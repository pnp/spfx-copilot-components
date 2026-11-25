/** Minimal HTTP abstraction so the SharePoint service is unit-testable without SPFx. */
export interface IHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export interface IHttpClient {
  get(url: string, headers: Record<string, string>): Promise<IHttpResponse>;
  post(url: string, headers: Record<string, string>, body: string): Promise<IHttpResponse>;
}

export const JSON_HEADERS: Record<string, string> = {
  Accept: 'application/json;odata=nometadata',
  'Content-Type': 'application/json;odata=nometadata',
  'odata-version': ''
};
