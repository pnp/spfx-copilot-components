import type { Answers, IFormSchema, ISubmitResult } from '../models';
import { buildFormSchema, type IRawField } from '../logic/fieldTypes';
import { buildItemPayload } from '../logic/payload';
import { listApiUrl } from '../logic/siteUrl';
import type { IHttpClient, IHttpResponse } from './http';
import { JSON_HEADERS } from './http';
import { hasSharePointWriteException, parseSharePointWriteError, requiredSubmitMessage } from '../logic/sharePointWriteError';
import { buildReconcileItemsUrl, currentUserUrl, matchReconciledItem, readCurrentUserId, reconcileFieldFrom } from '../logic/reconcileSubmit';
import { ListFormError, type IListFormService } from './IListFormService';

/** Generic custom list. Libraries (101) and other templates are rejected. */
export const CUSTOM_LIST_TEMPLATE = 100;

export interface IListFormTarget {
  /** Already resolved by the URL lock (https, same tenant). */
  siteUrl: string;
  /** Already checked by resolveListTitle. */
  listTitle: string;
  /** Optional comma-separated subset/order of columns. */
  fields?: string;
}

interface IListInfo {
  Id?: string;
  Title?: string;
  BaseTemplate?: number;
  Hidden?: boolean;
  RootFolder?: { ServerRelativeUrl?: string };
}

const FIELD_SELECT = 'InternalName,Title,TypeAsString,Required,Hidden,ReadOnlyField,Choices,DisplayFormat,RichText,MaxLength,Description,CurrencyLocaleId,FieldTypeKind';

function failFor(response: IHttpResponse): ListFormError {
  if (response.status === 401 || response.status === 403) {
    return new ListFormError('accessDenied', 'You don\u2019t have access to this list.');
  }
  if (response.status === 404) {
    return new ListFormError('notFound', 'The list wasn\u2019t found on this site.');
  }
  return new ListFormError('server', `SharePoint returned HTTP ${response.status}.`);
}

/** Reads the list schema and creates one item, through SharePoint REST as the signed-in user. No API permissions. */
export class SharePointListFormService implements IListFormService {
  public readonly demo: boolean = false;

  public constructor(private readonly _http: IHttpClient, private readonly _target: IListFormTarget) {}

  private get _listApi(): string {
    return listApiUrl(this._target.siteUrl, this._target.listTitle);
  }

  private async _get(url: string): Promise<unknown> {
    let response: IHttpResponse;
    try {
      response = await this._http.get(url, { Accept: JSON_HEADERS.Accept, 'odata-version': '' });
    } catch {
      throw new ListFormError('network', 'SharePoint couldn\u2019t be reached.');
    }
    if (!response.ok) {
      throw failFor(response);
    }
    return response.json();
  }

  public async loadSchema(): Promise<IFormSchema> {
    const list = (await this._get(`${this._listApi}?$select=Id,Title,BaseTemplate,Hidden,RootFolder/ServerRelativeUrl&$expand=RootFolder`)) as IListInfo;
    if (!list || list.Hidden) {
      throw new ListFormError('notFound', 'The list wasn\u2019t found on this site.');
    }
    if (list.BaseTemplate !== CUSTOM_LIST_TEMPLATE) {
      throw new ListFormError('notAList', 'This form works with SharePoint lists, not document libraries or other list types.');
    }
    const filter = encodeURIComponent('Hidden eq false and ReadOnlyField eq false');
    const fieldsJson = (await this._get(`${this._listApi}/fields?$filter=${filter}&$select=${FIELD_SELECT}`)) as { value?: IRawField[] };
    const raw = fieldsJson && Array.isArray(fieldsJson.value) ? fieldsJson.value : [];
    const origin = new URL(this._target.siteUrl).origin;
    const folder = list.RootFolder && typeof list.RootFolder.ServerRelativeUrl === 'string' ? list.RootFolder.ServerRelativeUrl : '';
    const listUrl = folder && folder.charAt(0) === '/' ? `${origin}${folder}` : '';
    return buildFormSchema(typeof list.Title === 'string' ? list.Title : this._target.listTitle, listUrl, raw, this._target.fields);
  }

  public async submit(schema: IFormSchema, answers: Answers): Promise<ISubmitResult> {
    if (schema.blocking.length > 0) {
      throw new ListFormError('server', 'This list has required columns the form can\u2019t fill.');
    }
    const missing = requiredSubmitMessage(schema.fields, answers);
    if (missing) {
      throw new ListFormError('validation', missing);
    }
    return this._postItem(schema, answers);
  }

  public async findSubmittedItem(schema: IFormSchema, answers: Answers, submittedAt: number): Promise<ISubmitResult | undefined> {
    const me = await this._get(currentUserUrl(this._target.siteUrl));
    const authorId = readCurrentUserId(me);
    if (!authorId) {
      throw new ListFormError('server', 'The signed-in user could not be read, so the save could not be checked.');
    }
    const field = reconcileFieldFrom(schema, answers);
    const body = await this._get(buildReconcileItemsUrl(this._listApi, authorId, submittedAt, field));
    return matchReconciledItem(body, field, schema.listUrl);
  }

  private async _postItem(schema: IFormSchema, answers: Answers): Promise<ISubmitResult> {
    const body = JSON.stringify(buildItemPayload(schema.fields, answers));
    let response: IHttpResponse;
    try {
      response = await this._http.post(`${this._listApi}/items`, JSON_HEADERS, body);
    } catch (error) {
      if (error instanceof ListFormError) {
        throw error;
      }
      throw new ListFormError('network', 'SharePoint couldn\u2019t be reached.');
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    if (!response.ok) {
      const message = parseSharePointWriteError(payload, response.status);
      if (message) {
        throw new ListFormError('validation', message);
      }
      throw failFor(response);
    }
    if (hasSharePointWriteException(payload)) {
      throw new ListFormError('validation', parseSharePointWriteError(payload, response.status) || 'SharePoint couldn\u2019t save the item. Your answers are still here; try again.');
    }
    const created = (payload && typeof payload === 'object' ? payload : {}) as { Id?: number; ID?: number };
    const id = typeof created.Id === 'number' ? created.Id : typeof created.ID === 'number' ? created.ID : 0;
    const itemUrl = schema.listUrl && id ? `${schema.listUrl}/DispForm.aspx?ID=${id}` : '';
    return { id, itemUrl, demo: false };
  }
}
