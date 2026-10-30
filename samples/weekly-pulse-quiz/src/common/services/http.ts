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

export async function readErrorMessage(response: IHttpResponse): Promise<string> {
  try {
    const raw = await response.text();
    const parsed = JSON.parse(raw) as { 'odata.error'?: { message?: { value?: string } }; error?: { message?: string | { value?: string } } };
    const odata = parsed['odata.error']?.message?.value;
    const err = parsed.error?.message;
    const msg = odata || (typeof err === 'string' ? err : err?.value);
    return msg || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
