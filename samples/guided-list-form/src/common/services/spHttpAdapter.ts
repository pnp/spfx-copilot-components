import { SPHttpClient } from '@microsoft/sp-http';
import type { IHttpClient, IHttpResponse } from './http';

/** Wraps SPFx SPHttpClient (brokered auth, no API permissions needed). */
export class SpHttpAdapter implements IHttpClient {
  public constructor(private readonly _client: SPHttpClient) {}

  public get(url: string, headers: Record<string, string>): Promise<IHttpResponse> {
    return this._client.get(url, SPHttpClient.configurations.v1, { headers });
  }

  public post(url: string, headers: Record<string, string>, body: string): Promise<IHttpResponse> {
    return this._client.post(url, SPHttpClient.configurations.v1, { headers, body });
  }
}
