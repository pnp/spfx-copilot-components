import type { IHttpClient, IHttpResponse } from '../services/http';
import type { ISetupStep } from '../setup/IListSetup';
import type { IListSetupTargets } from '../setup/ListSetupService';
import { describeSetupError, ListSetupService, SetupHttpError } from '../setup/ListSetupService';
import {
  CONFIG_FIELDS,
  hasPermission,
  PermissionKind,
  QUESTIONS_FIELDS,
  RESPONSES_FIELDS,
  RESPONSES_VIEW_FIELDS,
  UPCOMING_VIEW_FIELDS,
  upgradeFieldSchemaXml
} from '../setup/setupSchema';

const ORIGIN = 'https://fabrikam.sharepoint.com';
const SITE = 'https://fabrikam.sharepoint.com/sites/intranet';
const PULSE = 'https://fabrikam.sharepoint.com/sites/pulse';
const TENANT = '11111111-2222-3333-4444-555555555555';
const FULL = { High: '2147483647', Low: '4294967295' };
const MEMBER = { High: '432', Low: '1011030767' }; // Edit level: Manage Lists, no Manage Permissions
const READER = { High: '176', Low: '138612833' };

function res(status: number, body: unknown): IHttpResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => (body === undefined ? '' : JSON.stringify(body)) };
}

interface ISimList {
  id: string;
  title: string;
  fields: { [name: string]: boolean };
  /** SchemaXml and display name per field (only for fields the test cares about). */
  schema: { [name: string]: string };
  titles: { [name: string]: string };
  views: { id: string; title: string; query: string; fields: string[]; isDefault: boolean }[];
  items: { Id: number; [key: string]: unknown }[];
  unique: boolean;
  settings: { [key: string]: unknown };
  roles: string[];
}

interface ICall {
  method: 'GET' | 'POST' | 'MERGE';
  url: string;
  body?: unknown;
}

/** A tiny in-memory SharePoint that answers the REST calls ListSetupService makes. */
class SimSharePoint implements IHttpClient {
  public calls: ICall[] = [];
  public sites: { [url: string]: { perms: { High: string; Low: string }; lists: ISimList[]; timeZone: string } } = {};
  public failWith: ((call: ICall) => number | undefined) | undefined;
  private _n: number = 0;

  public constructor(sites: string[], perms = FULL) {
    sites.forEach((s) => (this.sites[s] = { perms, lists: [], timeZone: '(UTC) Coordinated Universal Time' }));
  }

  public addList(site: string, title: string, fields: string[] = []): ISimList {
    const list: ISimList = {
      id: this._guid(),
      title,
      fields: {},
      schema: {},
      titles: {},
      views: [{ id: this._guid(), title: 'All Items', query: '', fields: ['LinkTitle'], isDefault: true }],
      items: [],
      unique: false,
      settings: {},
      roles: []
    };
    ['Title', 'Author', 'Editor', 'ID', 'Created', 'Modified', ...fields].forEach((f) => (list.fields[f] = false));
    this.sites[site].lists.push(list);
    return list;
  }

  public list(site: string, title: string): ISimList | undefined {
    return this.sites[site].lists.filter((l) => l.title === title)[0];
  }

  public get creates(): ICall[] {
    return this.calls.filter(
      (c) => c.method === 'POST' && /\/_api\/web\/lists$|createfieldasxml|views\/add$|\/items$|breakroleinheritance|addroleassignment/.test(c.url)
    );
  }

  public async get(url: string): Promise<IHttpResponse> {
    return this._handle({ method: 'GET', url });
  }

  public async post(url: string, headers: Record<string, string>, body: string): Promise<IHttpResponse> {
    return this._handle({ method: headers['X-HTTP-Method'] === 'MERGE' ? 'MERGE' : 'POST', url, body: body ? JSON.parse(body) : undefined });
  }

  private _guid(): string {
    this._n++;
    return `00000000-0000-0000-0000-${('000000000000' + this._n).slice(-12)}`;
  }

  private _handle(call: ICall): IHttpResponse {
    this.calls.push(call);
    const forced = this.failWith && this.failWith(call);
    if (forced) {
      return res(forced, { 'odata.error': { message: { value: forced === 403 ? 'Access denied.' : 'Something broke.' } } });
    }
    const site = Object.keys(this.sites).filter((s) => call.url.indexOf(`${s}/_api/`) === 0)[0];
    if (!site) return res(404, {});
    const web = this.sites[site];
    const path = decodeURIComponent(call.url.slice(site.length + '/_api/web'.length));
    const body = (call.body || {}) as { [key: string]: unknown };

    if (path === '/effectiveBasePermissions') return res(200, web.perms);
    if (path.indexOf('/regionalsettings/timezone') === 0) return res(200, { Description: web.timeZone });
    if (path.indexOf('/lists?') === 0) {
      const title = /Title eq '(.*)'$/.exec(path)![1].replace(/''/g, "'");
      return res(200, { value: web.lists.filter((l) => l.title === title).map((l) => ({ Id: l.id, Title: l.title })) });
    }
    if (path === '/lists' && call.method === 'POST') {
      const l = this.addList(site, String(body.Title));
      return res(201, { Id: l.id, Title: l.title });
    }
    if (path.indexOf('/associatedownergroup') === 0) return res(200, { Id: 3, Title: 'Intranet Owners' });
    const role = /^\/roledefinitions\/getbytype\((\d)\)/.exec(path);
    if (role) return res(200, { Id: Number(role[1]) === 5 ? 1073741829 : 1073741827 });
    if (path === '/ensureuser') return res(200, { Id: 11, LoginName: (body as { logonName: string }).logonName });

    const m = /^\/lists\(guid'([0-9a-f-]+)'\)(.*)$/.exec(path);
    if (!m) return res(404, {});
    const list = web.lists.filter((l) => l.id === m[1])[0];
    if (!list) return res(404, {});
    const rest = m[2];

    if (rest === '' && call.method === 'MERGE') {
      Object.assign(list.settings, body);
      return res(204, undefined);
    }
    if (rest === '?$select=HasUniqueRoleAssignments') return res(200, { HasUniqueRoleAssignments: list.unique });
    if (rest.indexOf('/breakroleinheritance') === 0) {
      list.unique = true;
      return res(200, {});
    }
    const ra = /^\/roleassignments\/addroleassignment\(principalid=(\d+),roledefid=(\d+)\)$/.exec(rest);
    if (ra) {
      list.roles.push(`${ra[1]}:${ra[2]}`);
      return res(200, {});
    }
    if (rest.indexOf('/fields?') === 0) {
      const withSchema = /SchemaXml/.test(rest);
      return res(200, {
        value: Object.keys(list.fields).map((f) =>
          withSchema
            ? { InternalName: f, Indexed: list.fields[f], Title: list.titles[f] || f, SchemaXml: list.schema[f] || `<Field Name="${f}" />` }
            : { InternalName: f, Indexed: list.fields[f] }
        )
      });
    }
    if (rest === '/fields/createfieldasxml') {
      const xml = (body as { parameters: { SchemaXml: string } }).parameters.SchemaXml;
      const name = /Name='([^']+)'/.exec(xml)![1];
      list.fields[name] = false;
      list.schema[name] = xml;
      list.titles[name] = /DisplayName='([^']+)'/.exec(xml)![1];
      return res(200, { InternalName: name, Indexed: false });
    }
    const fi = /^\/fields\/getbyinternalnameortitle\('([^']+)'\)$/.exec(rest);
    if (fi && call.method === 'MERGE') {
      if (!(fi[1] in list.fields)) return res(404, {});
      if ('Indexed' in body) list.fields[fi[1]] = !!body.Indexed;
      if ('Title' in body) list.titles[fi[1]] = String(body.Title);
      if ('SchemaXml' in body) list.schema[fi[1]] = String(body.SchemaXml);
      return res(204, undefined);
    }
    if (rest.indexOf('/views?') === 0) return res(200, { value: list.views.map((v) => ({ Id: v.id, Title: v.title, DefaultView: v.isDefault })) });
    if (rest === '/views/add') {
      const p = (body as { parameters: { Title: string; Query: string } }).parameters;
      const v = { id: this._guid(), title: p.Title, query: p.Query, fields: ['LinkTitle'], isDefault: false };
      list.views.push(v);
      return res(200, { Id: v.id, Title: v.title });
    }
    if (rest.indexOf('/defaultview') === 0) {
      const v = list.views.filter((x) => x.isDefault)[0];
      return res(200, { Id: v.id, Title: v.title });
    }
    const vw = /^\/views\(guid'([0-9a-f-]+)'\)(.*)$/.exec(rest);
    if (vw) {
      const v = list.views.filter((x) => x.id === vw[1])[0];
      if (vw[2] === '' && call.method === 'MERGE') v.query = String(body.ViewQuery);
      else if (vw[2] === '/viewfields' && call.method === 'GET') return res(200, { Items: v.fields.slice() });
      else if (vw[2] === '/viewfields/removeallviewfields') v.fields = [];
      else if (vw[2] === '/viewfields/moveviewfieldto') {
        const mv = body as { field: string; index: number };
        v.fields.splice(v.fields.indexOf(mv.field), 1);
        v.fields.splice(mv.index, 0, mv.field);
      } else {
        const add = /^\/viewfields\/addviewfield\('([^']+)'\)$/.exec(vw[2]);
        if (!add) return res(404, {});
        v.fields.push(add[1]);
      }
      return res(200, {});
    }
    if (rest.indexOf('/items?') === 0) return res(200, { value: list.items.map((i) => ({ Id: i.Id, ResponsesSiteUrl: i.ResponsesSiteUrl })) });
    if (rest === '/items' && call.method === 'POST') {
      list.items.push({ Id: list.items.length + 1, ...body });
      return res(201, {});
    }
    const item = /^\/items\((\d+)\)$/.exec(rest);
    if (item && call.method === 'MERGE') {
      Object.assign(list.items.filter((i) => i.Id === Number(item[1]))[0], body);
      return res(204, undefined);
    }
    return res(404, {});
  }
}

function targets(over: Partial<IListSetupTargets> = {}): IListSetupTargets {
  return {
    questionsSiteUrl: SITE,
    questionsListTitle: 'Weekly Pulse Questions',
    responsesSiteUrl: SITE,
    responsesListTitle: 'Weekly Pulse Responses',
    anonymityMode: 'Anonymous',
    tenantId: TENANT,
    responsesSiteExplicit: false,
    ...over
  };
}

const short = (c: ICall): string => `${c.method} ${decodeURIComponent(c.url).replace(/^https:\/\/fabrikam\.sharepoint\.com\/sites\/\w+\/_api\/web/, '').replace(/guid'[0-9a-f-]+'/g, 'guid')}`;

describe('hasPermission', () => {
  it('reads SharePoint permission bits from Low/High, including string values above 2^31', () => {
    expect(hasPermission(FULL, PermissionKind.ManageLists)).toBe(true);
    expect(hasPermission(FULL, PermissionKind.ManagePermissions)).toBe(true);
    expect(hasPermission(FULL, PermissionKind.ManageWeb)).toBe(true);
    expect(hasPermission(MEMBER, PermissionKind.ManageLists)).toBe(true);
    expect(hasPermission(MEMBER, PermissionKind.ManagePermissions)).toBe(false);
    expect(hasPermission(READER, PermissionKind.ManageLists)).toBe(false);
    expect(hasPermission({ High: 0, Low: 0x40000000 }, PermissionKind.ManageWeb)).toBe(true);
    expect(hasPermission(undefined, PermissionKind.ManageLists)).toBe(false);
    expect(hasPermission({ High: 'x', Low: 'y' }, PermissionKind.ManageLists)).toBe(false);
  });
});

describe('ListSetupService', () => {
  it('refuses site URLs outside the tenant origin', () => {
    const sim = new SimSharePoint([SITE]);
    expect(() => new ListSetupService(sim, targets({ questionsSiteUrl: 'https://evil.example.com/sites/x' }), ORIGIN)).toThrow();
    expect(() => new ListSetupService(sim, targets({ responsesSiteUrl: 'https://contoso.sharepoint.com/sites/x' }), ORIGIN)).toThrow();
  });

  describe('inspect (permission gating)', () => {
    it('owner with Full Control: can set up; reports all three lists missing', async () => {
      const sim = new SimSharePoint([SITE]);
      const r = await new ListSetupService(sim, targets(), ORIGIN).inspect();
      expect(r.canSetUp).toBe(true);
      expect(r.sites).toEqual([{ siteUrl: SITE, canManageLists: true, canManagePermissions: true, canManageWeb: true }]);
      expect(r.missingLists.map((l) => l.title)).toEqual(['Weekly Pulse Questions', 'Weekly Pulse Config', 'Weekly Pulse Responses']);
      expect(sim.calls[0].url).toBe(`${SITE}/_api/web/effectiveBasePermissions`);
      expect(sim.calls.every((c) => c.method === 'GET')).toBe(true);
    });

    it('member (Manage Lists but not Manage Permissions) and reader: no setup', async () => {
      for (const perms of [MEMBER, READER]) {
        const r = await new ListSetupService(new SimSharePoint([SITE], perms), targets(), ORIGIN).inspect();
        expect(r.canSetUp).toBe(false);
        expect(r.missingLists.length).toBe(3);
      }
    });

    it('needs Full Control on both sites when Responses live elsewhere', async () => {
      const sim = new SimSharePoint([SITE, PULSE]);
      sim.sites[PULSE].perms = MEMBER;
      const r = await new ListSetupService(sim, targets({ responsesSiteUrl: PULSE }), ORIGIN).inspect();
      expect(r.sites.map((s) => s.siteUrl)).toEqual([SITE, PULSE]);
      expect(r.canSetUp).toBe(false);
    });

    it('a failed permission check means no button', async () => {
      const sim = new SimSharePoint([SITE]);
      sim.failWith = (c) => (/effectiveBasePermissions/.test(c.url) ? 403 : undefined);
      const r = await new ListSetupService(sim, targets(), ORIGIN).inspect();
      expect(r.canSetUp).toBe(false);
    });

    it('nothing missing once the lists exist', async () => {
      const sim = new SimSharePoint([SITE]);
      ['Weekly Pulse Questions', 'Weekly Pulse Config', 'Weekly Pulse Responses'].forEach((t) => sim.addList(SITE, t));
      const r = await new ListSetupService(sim, targets(), ORIGIN).inspect();
      expect(r.missingLists).toEqual([]);
    });
  });

  it('describe() lists what will be created per site', () => {
    const one = new ListSetupService(new SimSharePoint([SITE]), targets(), ORIGIN).describe();
    expect(one.length).toBe(1);
    expect(one[0].siteUrl).toBe(SITE);
    expect(one[0].items.join(' ')).toContain('Weekly Pulse Responses');
    const two = new ListSetupService(new SimSharePoint([SITE, PULSE]), targets({ responsesSiteUrl: PULSE }), ORIGIN).describe();
    expect(two.map((s) => s.siteUrl)).toEqual([SITE, PULSE]);
    expect(two[1].items.join(' ')).toContain('Weekly Pulse Responses');
    expect(two[0].items.join(' ')).not.toContain('Weekly Pulse Responses');
  });

  it('first run: creates everything exactly like the script, in order', async () => {
    const sim = new SimSharePoint([SITE]);
    const progress: ISetupStep[][] = [];
    const result = await new ListSetupService(sim, targets(), ORIGIN).run((s) => progress.push(s));

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.steps.every((s) => s.status === 'done')).toBe(true);
    expect(progress[0].every((s) => s.status === 'pending')).toBe(true);
    expect(progress.some((p) => p.some((s) => s.status === 'running'))).toBe(true);

    // Questions
    const qs = sim.list(SITE, 'Weekly Pulse Questions')!;
    QUESTIONS_FIELDS.forEach((f) => expect(qs.fields[f.internalName]).toBe(f.indexed));
    expect(['QuizYear', 'WeekNumber', 'IsActive'].every((f) => qs.fields[f])).toBe(true);
    const upcoming = qs.views.filter((v) => v.title === 'Upcoming weeks')[0];
    expect(upcoming.fields).toEqual(UPCOMING_VIEW_FIELDS);
    expect(upcoming.query).toContain("<Today OffsetDays='-6' />");
    expect(upcoming.fields.slice(0, 3)).toEqual(['LinkTitle', 'QuizYear', 'WeekNumber']);
    const allItems = qs.views.filter((v) => v.isDefault)[0];
    expect(allItems.fields.slice(0, 3)).toEqual(['LinkTitle', 'QuizYear', 'WeekNumber']);
    expect(allItems.fields).toEqual(UPCOMING_VIEW_FIELDS);
    expect(qs.titles.WeekLabel).toBe('Week label');
    expect(result.steps.filter((s) => s.id === 'questions-view')[0].detail).toBe('Created 1 view, updated 1 view');

    // Config
    const cfg = sim.list(SITE, 'Weekly Pulse Config')!;
    CONFIG_FIELDS.forEach((f) => expect(f.internalName in cfg.fields).toBe(true));
    expect(cfg.items).toEqual([
      {
        Id: 1, Title: 'Settings', AnonymityMode: 'Anonymous', ShowCorrectAnswer: true, ShowJustification: true, Animations: true,
        ResponsesSiteUrl: SITE, ResponsesListTitle: 'Weekly Pulse Responses', QuestionsListTitle: 'Weekly Pulse Questions'
      }
    ]);

    // Responses
    const rs = sim.list(SITE, 'Weekly Pulse Responses')!;
    RESPONSES_FIELDS.forEach((f) => expect(rs.fields[f.internalName]).toBe(f.indexed));
    expect(rs.fields.Author).toBe(true);
    expect(rs.settings).toEqual({ ReadSecurity: 2, WriteSecurity: 2, EnableVersioning: false, EnableAttachments: false, NoCrawl: true });
    expect(rs.unique).toBe(true);
    expect(rs.roles).toEqual(['3:1073741829', '11:1073741827']);
    expect(rs.views.filter((v) => v.isDefault)[0].fields).toEqual(RESPONSES_VIEW_FIELDS);

    // The exact create calls
    const breakCall = sim.calls.filter((c) => /breakroleinheritance/.test(c.url))[0];
    expect(breakCall.url).toContain('breakroleinheritance(copyRoleAssignments=false,clearSubscopes=false)');
    const ensure = sim.calls.filter((c) => /ensureuser/.test(c.url))[0];
    expect(ensure.body).toEqual({ logonName: `c:0-.f|rolemanager|spo-grid-all-users/${TENANT}` });
    const createField = sim.calls.filter((c) => /createfieldasxml/.test(c.url))[0];
    expect(createField.body).toEqual({ parameters: { SchemaXml: QUESTIONS_FIELDS[0].xml, Options: 8 } });
    expect(sim.calls.filter((c) => c.method === 'POST' && /\/_api\/web\/lists$/.test(c.url)).map((c) => (c.body as { Title: string; BaseTemplate: number }).BaseTemplate)).toEqual([100, 100, 100]);

    // Only the configured site, only SharePoint REST.
    expect(sim.calls.every((c) => c.url.indexOf(`${SITE}/_api/web/`) === 0)).toBe(true);

    // Order of the main steps.
    const order = sim.calls.map(short).filter((c) => /^POST \/lists$|breakrole|ensureuser|addroleassignment/.test(c));
    expect(order).toEqual([
      'POST /lists',
      'POST /lists',
      'POST /lists',
      'POST /lists(guid)/breakroleinheritance(copyRoleAssignments=false,clearSubscopes=false)',
      'POST /lists(guid)/roleassignments/addroleassignment(principalid=3,roledefid=1073741829)',
      'POST /ensureuser',
      'POST /lists(guid)/roleassignments/addroleassignment(principalid=11,roledefid=1073741827)'
    ]);
  });

  it('second run is idempotent: nothing is created again, nothing is deleted', async () => {
    const sim = new SimSharePoint([SITE]);
    const svc = new ListSetupService(sim, targets(), ORIGIN);
    await svc.run(() => undefined);
    sim.calls = [];
    const again = await svc.run(() => undefined);
    expect(again.ok).toBe(true);
    expect(sim.creates.map(short)).toEqual([
      // Role assignments are re-applied (adding an existing assignment is a no-op in SharePoint), as the script does.
      'POST /lists(guid)/roleassignments/addroleassignment(principalid=3,roledefid=1073741829)',
      'POST /lists(guid)/roleassignments/addroleassignment(principalid=11,roledefid=1073741827)'
    ]);
    const byId: { [id: string]: string } = {};
    again.steps.forEach((s) => (byId[s.id] = s.status));
    expect(byId['questions-list']).toBe('skipped');
    expect(byId['questions-columns']).toBe('skipped');
    expect(byId['config-row']).toBe('skipped');
    expect(again.steps.filter((s) => s.id === 'questions-columns')[0].detail).toBe('All 11 columns exist');
    expect(again.steps.filter((s) => s.id === 'questions-view')[0].detail).toBe('Updated 1 view');
    expect(sim.calls.some((c) => /getbyinternalnameortitle/.test(c.url) && c.method === 'MERGE')).toBe(false);
    const allItemsId = sim.list(SITE, 'Weekly Pulse Questions')!.views[0].id;
    expect(sim.calls.some((c) => c.method === 'POST' && c.url.indexOf(`views(guid'${allItemsId}')/viewfields/`) >= 0)).toBe(false);
    expect(byId['responses-break']).toBe('skipped');
    expect(sim.list(SITE, 'Weekly Pulse Config')!.items.length).toBe(1);
    expect(sim.calls.some((c) => /delete|recycle/i.test(c.url))).toBe(false);
  });

  it('existing list with some columns: skips the list, adds only the missing columns and indexes', async () => {
    const sim = new SimSharePoint([SITE]);
    const existing = sim.addList(SITE, 'Weekly Pulse Questions', ['QuizYear', 'ChoiceA', 'MyOwnColumn']);
    existing.fields.QuizYear = true;
    await new ListSetupService(sim, targets(), ORIGIN).run(() => undefined);
    const createdOnQuestions = sim.calls
      .filter((c) => c.url.indexOf(`lists(guid'${existing.id}')/fields/createfieldasxml`) >= 0)
      .map((c) => /Name='([^']+)'/.exec((c.body as { parameters: { SchemaXml: string } }).parameters.SchemaXml)![1]);
    expect(createdOnQuestions).toEqual(['WeekNumber', 'ChoiceB', 'ChoiceC', 'ChoiceD', 'CorrectChoice', 'Justification', 'IsActive', 'WeekStart', 'WeekLabel']);
    // Already indexed: no index call. (Its schema is brought up to date: Commas, default.)
    const quizYearMerges = sim.calls.filter((c) => c.method === 'MERGE' && /getbyinternalnameortitle\('QuizYear'\)/.test(c.url));
    expect(quizYearMerges.some((c) => 'Indexed' in (c.body as object))).toBe(false);
    expect(existing.schema.QuizYear).toContain('<DefaultFormula>=YEAR(Today)</DefaultFormula>');
    expect(sim.sites[SITE].lists.filter((l) => l.title === 'Weekly Pulse Questions').length).toBe(1);
    expect('MyOwnColumn' in existing.fields).toBe(true);
  });

  it('re-run on lists from an earlier setup: fixes Commas, default and title, adds the week columns to both views, never touches items', async () => {
    const sim = new SimSharePoint([SITE]);
    const svc = new ListSetupService(sim, targets(), ORIGIN);
    await svc.run(() => undefined);
    // Make the Questions list look like an earlier setup, with two grid-created items that have no week.
    const qs = sim.list(SITE, 'Weekly Pulse Questions')!;
    qs.schema.QuizYear =
      '<Field Type="Number" DisplayName="QuizYear" Required="TRUE" EnforceUniqueValues="FALSE" Indexed="TRUE" Min="2020" Max="2100" Decimals="0" ' +
      'ID="{6a1c...}" SourceID="{abc}" StaticName="QuizYear" Name="QuizYear" ColName="float1" RowOrdinal="0" Version="1" />';
    qs.schema.WeekNumber =
      '<Field Type="Number" DisplayName="WeekNumber" Required="TRUE" Indexed="TRUE" Min="1" Max="53" Decimals="0" StaticName="WeekNumber" Name="WeekNumber" Version="1" />';
    qs.titles.WeekLabel = 'Week';
    qs.views[0].fields = ['LinkTitle', 'MyOwnColumn'];
    const upcoming = qs.views.filter((v) => v.title === 'Upcoming weeks')[0];
    upcoming.fields = ['LinkTitle', 'WeekLabel', 'ChoiceA', 'ChoiceB', 'ChoiceC', 'ChoiceD', 'CorrectChoice', 'Justification', 'IsActive'];
    qs.items.push({ Id: 1, Title: 'Which tool…?' }, { Id: 2, Title: 'Poll' });
    const itemsBefore = JSON.stringify(qs.items);
    sim.calls = [];

    const r = await svc.run(() => undefined);
    expect(r.ok).toBe(true);
    const detail = (id: string): string | undefined => r.steps.filter((s) => s.id === id)[0].detail;
    expect(detail('questions-columns')).toBe('All 11 columns exist, updated 3');
    expect(detail('questions-view')).toBe('Updated 2 views');

    expect(qs.schema.QuizYear).toContain('Commas="FALSE"');
    expect(qs.schema.QuizYear).toContain('<DefaultFormula>=YEAR(Today)</DefaultFormula></Field>');
    expect(qs.schema.QuizYear).toContain('ColName="float1"');
    expect(qs.schema.WeekNumber).toContain('Commas="FALSE"');
    expect(qs.schema.WeekNumber).not.toContain('DefaultFormula');
    expect(qs.titles.WeekLabel).toBe('Week label');
    expect('WeekLabel' in qs.fields).toBe(true);

    expect(qs.views[0].fields.slice(0, 3)).toEqual(['LinkTitle', 'QuizYear', 'WeekNumber']);
    expect(qs.views[0].fields).toContain('MyOwnColumn');
    expect(upcoming.fields).toEqual(UPCOMING_VIEW_FIELDS);

    // Items: not read, not written.
    expect(JSON.stringify(qs.items)).toBe(itemsBefore);
    expect(sim.calls.some((c) => c.url.indexOf(`lists(guid'${qs.id}')/items`) >= 0)).toBe(false);
    expect(sim.calls.some((c) => /delete|recycle/i.test(c.url))).toBe(false);

    // Third run: the columns are current, only the Upcoming view is re-set.
    const third = await svc.run(() => undefined);
    expect(third.steps.filter((s) => s.id === 'questions-columns')[0].detail).toBe('All 11 columns exist');
    expect(third.steps.filter((s) => s.id === 'questions-view')[0].detail).toBe('Updated 1 view');
  });

  it('default view: moves QuizYear and WeekNumber after Title when they are elsewhere', async () => {
    const sim = new SimSharePoint([SITE]);
    const svc = new ListSetupService(sim, targets(), ORIGIN);
    await svc.run(() => undefined);
    const qs = sim.list(SITE, 'Weekly Pulse Questions')!;
    qs.views[0].fields = ['Attachments', 'LinkTitle', 'ChoiceA', 'WeekNumber', 'QuizYear'];
    await svc.run(() => undefined);
    expect(qs.views[0].fields.slice(0, 4)).toEqual(['Attachments', 'LinkTitle', 'QuizYear', 'WeekNumber']);
    expect(qs.views[0].fields.length).toBe(12);
  });

  it('upgradeFieldSchemaXml: adds or fixes attributes and DefaultFormula; undefined when current', () => {
    const up = { attributes: { Commas: 'FALSE', Decimals: '0' }, defaultFormula: '=YEAR(Today)' };
    expect(upgradeFieldSchemaXml(`<Field Type='Number' Name='QuizYear' Decimals='0' />`, up)).toBe(
      `<Field Type='Number' Name='QuizYear' Decimals='0' Commas="FALSE"><DefaultFormula>=YEAR(Today)</DefaultFormula></Field>`
    );
    expect(upgradeFieldSchemaXml(`<Field Name="X" Commas="TRUE" Decimals="2"><Default>2025</Default></Field>`, up)).toBe(
      `<Field Name="X" Commas="FALSE" Decimals="0"><DefaultFormula>=YEAR(Today)</DefaultFormula><Default>2025</Default></Field>`
    );
    expect(upgradeFieldSchemaXml(`<Field Name="X" Commas="TRUE"><DefaultFormula>=1</DefaultFormula></Field>`, up)).toBe(
      `<Field Name="X" Commas="FALSE" Decimals="0"><DefaultFormula>=YEAR(Today)</DefaultFormula></Field>`
    );
    expect(upgradeFieldSchemaXml(QUESTIONS_FIELDS[0].xml, up)).toBeUndefined();
    expect(upgradeFieldSchemaXml(`<Field Name="X" Commas="FALSE" Decimals="0" />`, { attributes: { Commas: 'FALSE', Decimals: '0' } })).toBeUndefined();
    expect(upgradeFieldSchemaXml('not xml', up)).toBeUndefined();
  });

  it('keeps an existing settings row, updating ResponsesSiteUrl only when it was set explicitly', async () => {
    const sim = new SimSharePoint([SITE, PULSE]);
    const cfg = sim.addList(SITE, 'Weekly Pulse Config');
    cfg.items.push({ Id: 1, Title: 'Settings', ResponsesSiteUrl: SITE, AnonymityMode: 'Named' });
    await new ListSetupService(sim, targets({ responsesSiteUrl: PULSE }), ORIGIN).run(() => undefined);
    expect(cfg.items[0].ResponsesSiteUrl).toBe(SITE);
    const r = await new ListSetupService(sim, targets({ responsesSiteUrl: PULSE, responsesSiteExplicit: true }), ORIGIN).run(() => undefined);
    expect(cfg.items).toEqual([{ Id: 1, Title: 'Settings', ResponsesSiteUrl: PULSE, AnonymityMode: 'Named' }]);
    expect(r.steps.filter((s) => s.id === 'config-row')[0].detail).toBe('Updated ResponsesSiteUrl');
  });

  it('separate Responses site: the Responses list and its permissions go there', async () => {
    const sim = new SimSharePoint([SITE, PULSE]);
    await new ListSetupService(sim, targets({ responsesSiteUrl: PULSE }), ORIGIN).run(() => undefined);
    expect(sim.list(PULSE, 'Weekly Pulse Responses')!.unique).toBe(true);
    expect(sim.list(SITE, 'Weekly Pulse Responses')).toBeUndefined();
    expect(sim.list(SITE, 'Weekly Pulse Config')!.items[0].ResponsesSiteUrl).toBe(PULSE);
  });

  it('403 on breaking permissions: stops with a plain message, earlier steps done, later steps untouched', async () => {
    const sim = new SimSharePoint([SITE]);
    sim.failWith = (c) => (/breakroleinheritance/.test(c.url) ? 403 : undefined);
    const result = await new ListSetupService(sim, targets(), ORIGIN).run(() => undefined);
    expect(result.ok).toBe(false);
    expect(result.error).toBe(`Couldn't break permissions on "Weekly Pulse Responses": you need Full Control on ${SITE}`);
    const status = (id: string): string => result.steps.filter((s) => s.id === id)[0].status;
    expect(status('responses-security')).toBe('done');
    expect(status('responses-break')).toBe('failed');
    expect(status('responses-owners')).toBe('pending');
    expect(sim.calls.some((c) => /addroleassignment|ensureuser/.test(c.url))).toBe(false);
  });

  it('other errors show the SharePoint message', async () => {
    const sim = new SimSharePoint([SITE]);
    sim.failWith = (c) => (c.method === 'POST' && /\/_api\/web\/lists$/.test(c.url) ? 500 : undefined);
    const result = await new ListSetupService(sim, targets(), ORIGIN).run(() => undefined);
    expect(result.error).toBe('Couldn\'t create the list "Weekly Pulse Questions": Something broke.');
    expect(sim.calls.filter((c) => c.method !== 'GET').length).toBe(1);
  });

  it('warns (without failing) when the site time zone differs from the quiz time zone', async () => {
    const sim = new SimSharePoint([SITE]);
    sim.sites[SITE].timeZone = '(UTC-05:00) Eastern Time (US and Canada)';
    const result = await new ListSetupService(sim, targets(), ORIGIN).run(() => undefined);
    expect(result.ok).toBe(true);
    expect(result.warnings[0]).toContain('Eastern Time');
  });

  it('refuses to grant Everyone without a valid tenant id', async () => {
    const sim = new SimSharePoint([SITE]);
    const result = await new ListSetupService(sim, targets({ tenantId: '' }), ORIGIN).run(() => undefined);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('give everyone except external users Contribute');
    expect(sim.calls.some((c) => /ensureuser/.test(c.url))).toBe(false);
  });

  it('describeSetupError maps 401/403 to the Full Control hint', () => {
    expect(describeSetupError(new SetupHttpError(401, 'x'), SITE)).toBe(`you need Full Control on ${SITE}`);
    expect(describeSetupError(new SetupHttpError(400, 'Bad field'), SITE)).toBe('Bad field');
    expect(describeSetupError(new Error('boom'), SITE)).toBe('boom');
  });
});
