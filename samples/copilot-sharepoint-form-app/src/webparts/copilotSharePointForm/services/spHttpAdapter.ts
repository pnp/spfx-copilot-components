import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import { JSON_HEADERS, type IHttpClient, type IHttpResponse } from "./http";
import type { IByteSource } from "./types";

export class SpHttpAdapter implements IHttpClient {
  public constructor(private readonly _client: SPHttpClient) {
  }

  public get(url: string): Promise<IHttpResponse> {
    return this._client.get(url, SPHttpClient.configurations.v1, {
      headers: JSON_HEADERS
    }).then(toResponse);
  }

  public post(
    url: string,
    body: IByteSource | string | undefined,
    headers: { [name: string]: string }
  ): Promise<IHttpResponse> {
    return this._client.post(url, SPHttpClient.configurations.v1, {
      headers,
      body: toBody(body)
    }).then(toResponse);
  }
}

function toResponse(response: SPHttpClientResponse): IHttpResponse {
  return {
    ok: response.ok,
    status: response.status,
    text: (): Promise<string> => response.text()
  };
}

function toBody(body: IByteSource | string | undefined): BodyInit | undefined {
  if (body === undefined || typeof body === "string") {
    return body;
  }
  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return body;
  }
  throw new Error("The upload body is not a file.");
}
