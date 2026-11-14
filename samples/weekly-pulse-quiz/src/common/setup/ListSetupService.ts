import { siteTimeZoneMatches } from '../logic/isoWeek';
import { isUsableSiteUrl, odataString } from '../logic/siteUrl';
import type { AnonymityMode } from '../models';
import { DEFAULT_CONFIG_LIST, QUIZ_TIME_ZONE } from '../models';
import type { IHttpClient, IHttpResponse } from '../services/http';
import { JSON_HEADERS, readErrorMessage } from '../services/http';
import type { IListSetup, ISetupInspection, ISetupResult, ISetupSitePlan, ISetupStep, ISiteAccess } from './IListSetup';
import type { IBasePermissions, IFieldDefinition } from './setupSchema';
import {
  ADD_FIELD_INTERNAL_NAME_HINT,
  CONFIG_FIELDS,
  CONFIG_LIST_DESCRIPTION,
  everyoneExceptExternalClaim,
  GENERIC_LIST_TEMPLATE,
  hasPermission,
  PermissionKind,
  QUESTIONS_DEFAULT_VIEW_FIELDS,
  QUESTIONS_FIELDS,
  QUESTIONS_WEEK_FIELDS,
  QUESTIONS_LIST_DESCRIPTION,
  RESPONSES_FIELDS,
  RESPONSES_LIST_DESCRIPTION,
  RESPONSES_LIST_SETTINGS,
  RESPONSES_VIEW_FIELDS,
  ROLE_TYPE_ADMINISTRATOR,
  ROLE_TYPE_CONTRIBUTOR,
  UPCOMING_VIEW_FIELDS,
  UPCOMING_VIEW_QUERY,
  UPCOMING_VIEW_ROW_LIMIT,
  UPCOMING_VIEW_TITLE,
  upgradeFieldSchemaXml
} from './setupSchema';

export interface IListSetupTargets {
  questionsSiteUrl: string;
  questionsListTitle: string;
  responsesSiteUrl: string;
  responsesListTitle: string;
  configListTitle?: string;
  anonymityMode: AnonymityMode;
  /** pageContext.aadInfo.tenantId, for the "Everyone except external users" claim. */
  tenantId: string;
  /** Like -ResponsesSiteUrl in the script: also write it to an existing settings row. */
  responsesSiteExplicit: boolean;
}

export class SetupHttpError extends Error {
  public constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'SetupHttpError';
    Object.setPrototypeOf(this, SetupHttpError.prototype);
  }
}

interface IListInfo {
  Id: string;
  Title: string;
  HasUniqueRoleAssignments?: boolean;
}

interface IFieldInfo {
  InternalName: string;
  Indexed?: boolean;
  Title?: string;
  SchemaXml?: string;
}

type StepOutcome = { status: 'done' | 'skipped'; detail: string };

interface IStepDefinition {
  id: string;
  label: string;
  siteUrl: string;
  /** Completes "Couldn't ..." in the error message. */
  failure: string;
  action: () => Promise<StepOutcome>;
}

const MERGE_HEADERS: Record<string, string> = { ...JSON_HEADERS, 'X-HTTP-Method': 'MERGE', 'IF-MATCH': '*' };

const done = (detail: string): StepOutcome => ({ status: 'done', detail });
const skipped = (detail: string): StepOutcome => ({ status: 'skipped', detail });
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Plain-language reason for a failed REST call. */
export function describeSetupError(error: unknown, siteUrl: string): string {
  if (error instanceof SetupHttpError) {
    if (error.status === 401 || error.status === 403) {
      return `you need Full Control on ${siteUrl}`;
    }
    return error.message || `HTTP ${error.status}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Creates the Weekly Pulse lists with SharePoint REST through SPHttpClient (no Graph, no API permissions).
 * Mirrors provisioning/Provision-WeeklyPulse.ps1: idempotent, adds only what is missing, never deletes.
 * Only ever calls the two configured site URLs, both locked to the tenant origin.
 */
export class ListSetupService implements IListSetup {
  private readonly _q: string;
  private readonly _r: string;
  private readonly _configTitle: string;

  public constructor(
    private readonly _http: IHttpClient,
    private readonly _t: IListSetupTargets,
    allowedOrigin: string
  ) {
    if (!isUsableSiteUrl(_t.questionsSiteUrl, allowedOrigin) || !isUsableSiteUrl(_t.responsesSiteUrl, allowedOrigin)) {
      throw new Error('Set up lists only works on site URLs in this tenant.');
    }
    this._q = _t.questionsSiteUrl.replace(/\/+$/, '');
    this._r = _t.responsesSiteUrl.replace(/\/+$/, '');
    this._configTitle = _t.configListTitle || DEFAULT_CONFIG_LIST;
  }

  private get _sites(): string[] {
    return this._q.toLowerCase() === this._r.toLowerCase() ? [this._q] : [this._q, this._r];
  }

  public describe(): ISetupSitePlan[] {
    const t = this._t;
    const questions = [
      `"${t.questionsListTitle}" list with ${QUESTIONS_FIELDS.length} columns, the "${UPCOMING_VIEW_TITLE}" view, and QuizYear and WeekNumber in the default view`,
      `"${this._configTitle}" list with one settings row (used by the Copilot component)`
    ];
    const responses = [
      `"${t.responsesListTitle}" list: people see and edit only their own answers; unique permissions (site owners: Full Control, everyone except external users: Contribute); no versioning, no attachments, excluded from search`
    ];
    if (this._sites.length === 1) {
      return [{ siteUrl: this._q, items: [...questions, ...responses] }];
    }
    return [
      { siteUrl: this._q, items: questions },
      { siteUrl: this._r, items: responses }
    ];
  }

  public async inspect(): Promise<ISetupInspection> {
    const sites: ISiteAccess[] = [];
    for (const siteUrl of this._sites) {
      sites.push(await this._access(siteUrl));
    }
    const wanted = [
      { title: this._t.questionsListTitle, siteUrl: this._q },
      { title: this._configTitle, siteUrl: this._q },
      { title: this._t.responsesListTitle, siteUrl: this._r }
    ];
    const missingLists = [];
    for (const w of wanted) {
      try {
        if (!(await this._findList(w.siteUrl, w.title))) missingLists.push(w);
      } catch {
        // Can't tell (no access): don't claim it is missing.
      }
    }
    return { missingLists, sites, canSetUp: sites.every((s) => s.canManageLists && s.canManagePermissions) };
  }

  public async run(onProgress: (steps: ISetupStep[]) => void): Promise<ISetupResult> {
    const defs = this._steps();
    const steps: ISetupStep[] = defs.map((d) => ({ id: d.id, label: d.label, siteUrl: d.siteUrl, status: 'pending' }));
    const warnings: string[] = [];
    const emit = (): void => onProgress(steps.map((s) => ({ ...s })));
    emit();

    // Non-blocking, as in the script: the "Upcoming weeks" view uses the site's [Today].
    try {
      const tz = (await this._get(this._q, '/_api/web/regionalsettings/timezone?$select=Description')) as { Description?: string };
      if (tz.Description && !siteTimeZoneMatches(tz.Description)) {
        warnings.push(`The site time zone is "${tz.Description}". The quiz week changes on Monday at 00:00 ${QUIZ_TIME_ZONE}, but the "${UPCOMING_VIEW_TITLE}" view uses the site's today.`);
      }
    } catch {
      // ignore
    }

    for (let i = 0; i < defs.length; i++) {
      steps[i].status = 'running';
      emit();
      try {
        const outcome = await defs[i].action();
        steps[i].status = outcome.status;
        steps[i].detail = outcome.detail;
      } catch (error) {
        const reason = describeSetupError(error, defs[i].siteUrl);
        steps[i].status = 'failed';
        steps[i].detail = reason;
        emit();
        return { ok: false, steps: steps.map((s) => ({ ...s })), error: `Couldn't ${defs[i].failure}: ${reason}`, warnings };
      }
      emit();
    }
    return { ok: true, steps: steps.map((s) => ({ ...s })), warnings };
  }

  // ------------------------------------------------------------------ steps

  private _steps(): IStepDefinition[] {
    const t = this._t;
    const q = this._q;
    const r = this._r;
    const lists: { [key: string]: IListInfo } = {};
    const need = (key: string): IListInfo => lists[key];

    return [
      {
        id: 'questions-list', label: `List "${t.questionsListTitle}"`, siteUrl: q, failure: `create the list "${t.questionsListTitle}"`,
        action: async () => this._ensureList(q, t.questionsListTitle, QUESTIONS_LIST_DESCRIPTION, (l) => (lists.q = l))
      },
      {
        id: 'questions-columns', label: `Columns on "${t.questionsListTitle}"`, siteUrl: q, failure: `add columns to "${t.questionsListTitle}"`,
        action: async () => this._ensureFields(q, need('q'), QUESTIONS_FIELDS, [])
      },
      {
        id: 'questions-view', label: `Views on "${t.questionsListTitle}"`, siteUrl: q,
        failure: `update the views of "${t.questionsListTitle}"`,
        action: async () => this._ensureQuestionsViews(q, need('q'))
      },
      {
        id: 'config-list', label: `List "${this._configTitle}"`, siteUrl: q, failure: `create the list "${this._configTitle}"`,
        action: async () => this._ensureList(q, this._configTitle, CONFIG_LIST_DESCRIPTION, (l) => (lists.c = l))
      },
      {
        id: 'config-columns', label: `Columns on "${this._configTitle}"`, siteUrl: q, failure: `add columns to "${this._configTitle}"`,
        action: async () => this._ensureFields(q, need('c'), CONFIG_FIELDS, [])
      },
      {
        id: 'config-row', label: 'Settings row', siteUrl: q, failure: `add the settings row to "${this._configTitle}"`,
        action: async () => this._ensureConfigRow(q, need('c'))
      },
      {
        id: 'responses-list', label: `List "${t.responsesListTitle}"`, siteUrl: r, failure: `create the list "${t.responsesListTitle}"`,
        action: async () => this._ensureList(r, t.responsesListTitle, RESPONSES_LIST_DESCRIPTION, (l) => (lists.r = l))
      },
      {
        id: 'responses-columns', label: `Columns on "${t.responsesListTitle}"`, siteUrl: r, failure: `add columns to "${t.responsesListTitle}"`,
        // The "already answered?" lookup filters on Author (Created By), so it is indexed too.
        action: async () => this._ensureFields(r, need('r'), RESPONSES_FIELDS, ['Author'])
      },
      {
        id: 'responses-security', label: 'Item-level security (read own, edit own); versioning and attachments off; excluded from search', siteUrl: r,
        failure: `turn on item-level security for "${t.responsesListTitle}"`,
        action: async () => {
          await this._post(r, `${this._listPath(need('r'))}`, RESPONSES_LIST_SETTINGS, MERGE_HEADERS);
          return done('Set');
        }
      },
      {
        id: 'responses-break', label: 'Unique permissions (not copied from the site)', siteUrl: r, failure: `break permissions on "${t.responsesListTitle}"`,
        action: async () => this._ensureUniquePermissions(r, need('r'))
      },
      {
        id: 'responses-owners', label: 'Site owners: Full Control', siteUrl: r, failure: 'give site owners Full Control',
        action: async () => {
          const owners = (await this._get(r, '/_api/web/associatedownergroup?$select=Id,Title')) as { Id: number; Title: string };
          const role = await this._roleId(r, ROLE_TYPE_ADMINISTRATOR);
          await this._post(r, `${this._listPath(need('r'))}/roleassignments/addroleassignment(principalid=${Number(owners.Id)},roledefid=${role})`);
          return done(`"${owners.Title}"`);
        }
      },
      {
        id: 'responses-everyone', label: 'Everyone except external users: Contribute', siteUrl: r, failure: 'give everyone except external users Contribute',
        action: async () => {
          if (!/^[0-9a-f-]{36}$/i.test(t.tenantId || '')) throw new Error('the tenant ID is unknown');
          const user = (await this._post(r, '/_api/web/ensureuser', { logonName: everyoneExceptExternalClaim(t.tenantId) })) as { Id: number };
          const role = await this._roleId(r, ROLE_TYPE_CONTRIBUTOR);
          await this._post(r, `${this._listPath(need('r'))}/roleassignments/addroleassignment(principalid=${Number(user.Id)},roledefid=${role})`);
          return done('Granted');
        }
      },
      {
        id: 'responses-view', label: 'Default view shows no Created By / Modified By', siteUrl: r, failure: `update the default view of "${t.responsesListTitle}"`,
        action: async () => {
          const view = (await this._get(r, `${this._listPath(need('r'))}/defaultview?$select=Id,Title`)) as { Id: string };
          await this._setViewFields(r, need('r'), view.Id, RESPONSES_VIEW_FIELDS);
          return done(`${RESPONSES_VIEW_FIELDS.length} columns`);
        }
      }
    ];
  }

  private async _ensureList(site: string, title: string, description: string, keep: (l: IListInfo) => void): Promise<StepOutcome> {
    const existing = await this._findList(site, title);
    if (existing) {
      keep(existing);
      return skipped('Already exists');
    }
    const created = (await this._post(site, '/_api/web/lists', { Title: title, BaseTemplate: GENERIC_LIST_TEMPLATE, Description: description })) as IListInfo;
    keep({ Id: created.Id, Title: created.Title || title, HasUniqueRoleAssignments: false });
    return done('Created');
  }

  private async _ensureFields(site: string, list: IListInfo, defs: IFieldDefinition[], alsoIndex: string[]): Promise<StepOutcome> {
    const path = this._listPath(list);
    const select = defs.some((d) => d.upgrade) ? 'InternalName,Indexed,Title,SchemaXml' : 'InternalName,Indexed';
    const body = (await this._get(site, `${path}/fields?$select=${select}`)) as { value?: IFieldInfo[] };
    const existing: { [name: string]: IFieldInfo } = {};
    (body.value || []).forEach((fi) => (existing[fi.InternalName] = fi));
    let added = 0;
    let indexed = 0;
    let updated = 0;
    for (const def of defs) {
      let field = existing[def.internalName];
      if (!field) {
        field = (await this._post(site, `${path}/fields/createfieldasxml`, { parameters: { SchemaXml: def.xml, Options: ADD_FIELD_INTERNAL_NAME_HINT } })) as IFieldInfo;
        added++;
      } else if (def.upgrade && (await this._upgradeField(site, path, field, def))) {
        updated++;
      }
      if (def.indexed && !(field && field.Indexed)) {
        await this._index(site, path, def.internalName);
        indexed++;
      }
    }
    for (const name of alsoIndex) {
      if (existing[name] && !existing[name].Indexed) {
        await this._index(site, path, name);
        indexed++;
      }
    }
    const parts = [added ? `Added ${plural(added, 'column')}` : `All ${defs.length} columns exist`];
    if (updated) parts.push(`updated ${updated}`);
    if (indexed) parts.push(`indexed ${indexed}`);
    return added || indexed || updated ? done(parts.join(', ')) : skipped(parts[0]);
  }

  /** Brings an existing column up to date: display name, Commas, DefaultFormula. Items are never touched. */
  private async _upgradeField(site: string, listPath: string, field: IFieldInfo, def: IFieldDefinition): Promise<boolean> {
    const up = def.upgrade || {};
    const fieldPath = `${listPath}/fields/getbyinternalnameortitle('${encodeURIComponent(odataString(def.internalName))}')`;
    let changed = false;
    if (up.title && field.Title !== up.title) {
      await this._post(site, fieldPath, { Title: up.title }, MERGE_HEADERS);
      changed = true;
    }
    if ((up.attributes || up.defaultFormula) && field.SchemaXml) {
      const xml = upgradeFieldSchemaXml(field.SchemaXml, { attributes: up.attributes, defaultFormula: up.defaultFormula });
      if (xml) {
        await this._post(site, fieldPath, { SchemaXml: xml }, MERGE_HEADERS);
        changed = true;
      }
    }
    return changed;
  }

  private async _index(site: string, listPath: string, internalName: string): Promise<void> {
    await this._post(site, `${listPath}/fields/getbyinternalnameortitle('${encodeURIComponent(odataString(internalName))}')`, { Indexed: true }, MERGE_HEADERS);
  }

  /**
   * Default view: adds the question columns that are missing (keeps any others) and puts QuizYear and
   * WeekNumber right after Title. "Upcoming weeks": created, or its query and columns re-set.
   */
  private async _ensureQuestionsViews(site: string, list: IListInfo): Promise<StepOutcome> {
    const path = this._listPath(list);
    const views = (await this._get(site, `${path}/views?$select=Id,Title,DefaultView`)) as { value?: { Id: string; Title: string; DefaultView?: boolean }[] };
    const all = views.value || [];
    let created = 0;
    let updated = 0;

    const defaultView = all.filter((v) => v.DefaultView && v.Title !== UPCOMING_VIEW_TITLE)[0];
    if (defaultView && (await this._ensureDefaultViewFields(site, list, defaultView.Id))) {
      updated++;
    }

    const existing = all.filter((v) => v.Title === UPCOMING_VIEW_TITLE)[0];
    let viewId: string;
    if (!existing) {
      const made = (await this._post(site, `${path}/views/add`, {
        parameters: { Title: UPCOMING_VIEW_TITLE, Query: UPCOMING_VIEW_QUERY, RowLimit: UPCOMING_VIEW_ROW_LIMIT, Paged: true, PersonalView: false, ViewTypeKind: 1 }
      })) as { Id: string };
      viewId = made.Id;
      created++;
    } else {
      // Same as Set-PnPView in the script: keep the view's query and columns current.
      viewId = existing.Id;
      await this._post(site, `${path}/views(guid'${guid(viewId)}')`, { ViewQuery: UPCOMING_VIEW_QUERY }, MERGE_HEADERS);
      updated++;
    }
    await this._setViewFields(site, list, viewId, UPCOMING_VIEW_FIELDS);

    const parts: string[] = [];
    if (created) parts.push(`Created ${plural(created, 'view')}`);
    if (updated) parts.push(`${created ? 'updated' : 'Updated'} ${plural(updated, 'view')}`);
    return done(parts.join(', '));
  }

  /** Returns true if the default view changed. Never removes a column. */
  private async _ensureDefaultViewFields(site: string, list: IListInfo, viewId: string): Promise<boolean> {
    const viewPath = `${this._listPath(list)}/views(guid'${guid(viewId)}')/viewfields`;
    const body = (await this._get(site, viewPath)) as { Items?: string[] | { results?: string[] } };
    const raw = body.Items;
    const current: string[] = Array.isArray(raw) ? raw.slice() : (raw && raw.results) || [];
    let changed = false;
    for (const name of QUESTIONS_DEFAULT_VIEW_FIELDS) {
      if (current.indexOf(name) < 0) {
        await this._post(site, `${viewPath}/addviewfield('${encodeURIComponent(odataString(name))}')`);
        current.push(name);
        changed = true;
      }
    }
    // QuizYear, WeekNumber right after Title (or first, if Title isn't in the view).
    let at = current.indexOf('LinkTitle') + 1;
    for (const name of QUESTIONS_WEEK_FIELDS) {
      if (current.indexOf(name) !== at) {
        await this._post(site, `${viewPath}/moveviewfieldto`, { field: name, index: at });
        current.splice(current.indexOf(name), 1);
        current.splice(at, 0, name);
        changed = true;
      }
      at++;
    }
    return changed;
  }

  private async _setViewFields(site: string, list: IListInfo, viewId: string, fields: string[]): Promise<void> {
    const viewPath = `${this._listPath(list)}/views(guid'${guid(viewId)}')/viewfields`;
    await this._post(site, `${viewPath}/removeallviewfields`);
    for (const name of fields) {
      await this._post(site, `${viewPath}/addviewfield('${encodeURIComponent(odataString(name))}')`);
    }
  }

  private async _ensureConfigRow(site: string, list: IListInfo): Promise<StepOutcome> {
    const path = this._listPath(list);
    const body = (await this._get(site, `${path}/items?$select=Id,ResponsesSiteUrl&$orderby=ID%20asc&$top=10`)) as { value?: { Id: number; ResponsesSiteUrl?: string | null }[] };
    const rows = body.value || [];
    if (rows.length === 0) {
      await this._post(site, `${path}/items`, {
        Title: 'Settings',
        AnonymityMode: this._t.anonymityMode,
        ShowCorrectAnswer: true,
        ShowJustification: true,
        Animations: true,
        ResponsesSiteUrl: this._r,
        ResponsesListTitle: this._t.responsesListTitle,
        QuestionsListTitle: this._t.questionsListTitle
      });
      return done('Added');
    }
    const row = rows[0];
    if (this._t.responsesSiteExplicit && (row.ResponsesSiteUrl || '') !== this._r) {
      await this._post(site, `${path}/items(${Number(row.Id)})`, { ResponsesSiteUrl: this._r }, MERGE_HEADERS);
      return done('Updated ResponsesSiteUrl');
    }
    return skipped(rows.length > 1 ? `Exists (${rows.length} rows; the oldest is used)` : 'Exists (left as is)');
  }

  private async _ensureUniquePermissions(site: string, list: IListInfo): Promise<StepOutcome> {
    const info = (await this._get(site, `${this._listPath(list)}?$select=HasUniqueRoleAssignments`)) as { HasUniqueRoleAssignments?: boolean };
    if (info.HasUniqueRoleAssignments) {
      return skipped('Already unique');
    }
    // Not copied: members' Edit level includes Manage Lists, which would bypass item-level security.
    await this._post(site, `${this._listPath(list)}/breakroleinheritance(copyRoleAssignments=false,clearSubscopes=false)`);
    return done('Done');
  }

  // ------------------------------------------------------------------ REST

  private async _access(siteUrl: string): Promise<ISiteAccess> {
    try {
      const perms = (await this._get(siteUrl, '/_api/web/effectiveBasePermissions')) as IBasePermissions;
      return {
        siteUrl,
        canManageLists: hasPermission(perms, PermissionKind.ManageLists),
        canManagePermissions: hasPermission(perms, PermissionKind.ManagePermissions),
        canManageWeb: hasPermission(perms, PermissionKind.ManageWeb)
      };
    } catch {
      return { siteUrl, canManageLists: false, canManagePermissions: false, canManageWeb: false };
    }
  }

  private async _findList(site: string, title: string): Promise<IListInfo | undefined> {
    const filter = encodeURIComponent(`Title eq '${odataString(title)}'`);
    const body = (await this._get(site, `/_api/web/lists?$select=Id,Title&$filter=${filter}`)) as { value?: IListInfo[] };
    return (body.value || [])[0];
  }

  private async _roleId(site: string, roleType: number): Promise<number> {
    const role = (await this._get(site, `/_api/web/roledefinitions/getbytype(${roleType})?$select=Id`)) as { Id: number };
    return Number(role.Id);
  }

  private _listPath(list: IListInfo | undefined): string {
    if (!list || !list.Id) {
      throw new Error('the list was not created');
    }
    return `/_api/web/lists(guid'${guid(list.Id)}')`;
  }

  private _url(site: string, path: string): string {
    if (this._sites.map((s) => s.toLowerCase()).indexOf(site.toLowerCase()) < 0) {
      throw new Error('blocked: not a configured Weekly Pulse site');
    }
    return `${site}${path}`;
  }

  private async _get(site: string, path: string): Promise<unknown> {
    return this._read(await this._http.get(this._url(site, path), JSON_HEADERS));
  }

  private async _post(site: string, path: string, body?: unknown, headers: Record<string, string> = JSON_HEADERS): Promise<unknown> {
    return this._read(await this._http.post(this._url(site, path), headers, body === undefined ? '' : JSON.stringify(body)));
  }

  private async _read(response: IHttpResponse): Promise<unknown> {
    if (!response.ok) {
      throw new SetupHttpError(response.status, await readErrorMessage(response));
    }
    if (response.status === 204) {
      return {};
    }
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
}

function guid(value: string): string {
  const v = String(value || '').replace(/[{}]/g, '');
  if (!/^[0-9a-f-]{36}$/i.test(v)) {
    throw new Error('unexpected id from SharePoint');
  }
  return v;
}
