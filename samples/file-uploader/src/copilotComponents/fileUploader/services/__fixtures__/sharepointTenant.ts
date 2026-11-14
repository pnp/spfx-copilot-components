import type { IFieldLink, IRecordListItem } from '../SharePointDocumentStoreService';
import raw from './sharepoint-tenant.json';

/**
 * What the tenant returned to the shipped store, captured by
 * `npm run capture:fixtures` (todo.md 8.9 N4) and scrubbed of anything that
 * names the tenant. The SharePoint fakes build on this instead of hand-typed
 * field links, so a built-in column the platform marks required (8.8 L1) is in
 * the fake because the platform returned it.
 *
 * Test-only: nothing outside a `*.test.ts` imports this, so it never ships.
 * Never edit `sharepoint-tenant.json` by hand — re-capture it, and let
 * `npm run check:fixtures` say when the tenant has moved.
 */

export interface ICapturedContentType {
  Id: { StringValue: string };
  Name: string;
}

export interface ISharePointTenantFixture {
  /** `capturedOn` and `pnpjs` are absent until the first real capture. */
  $source: { capturedBy: string; capturedOn?: string; pnpjs?: string };
  library: {
    /** The library's content types, as `list.contentTypes.select('Id', 'Name')` returned them. */
    contentTypes: ICapturedContentType[];
    /** Each content type's field links, keyed by its (pseudonymous) id. */
    fieldLinks: { [contentTypeId: string]: IFieldLink[] };
  };
  choices: { FilingDepartment: string[]; FilingStatus: string[] };
  /** One invoice and one expense report as `getRecent()` read them, both written with `documentDateWritten`. */
  recent: { documentDateWritten: string; items: IRecordListItem[] };
}

export const SHAREPOINT_TENANT: ISharePointTenantFixture = raw as unknown as ISharePointTenantFixture;

/** The captured id of a content type, by name. Throws when the capture has no such type. */
export function contentTypeIdOf(name: string): string {
  const found: ICapturedContentType | undefined = SHAREPOINT_TENANT.library.contentTypes.filter(ct => ct.Name === name)[0];
  if (!found) {
    throw new Error('The captured fixture has no content type named "' + name + '".');
  }
  return found.Id.StringValue;
}
