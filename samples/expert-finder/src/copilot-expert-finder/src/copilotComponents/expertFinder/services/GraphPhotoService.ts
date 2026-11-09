import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';

export class GraphPhotoService {
  private _client: Promise<MSGraphClientV3> | undefined;
  private readonly _photos = new Map<string, Promise<string | undefined>>();
  private readonly _urls = new Set<string>();
  private _disposed = false;

  public constructor(private readonly _factory: MSGraphClientFactory) {}

  public getPhotoUrl(userPrincipalName: string): Promise<string | undefined> {
    const principal = userPrincipalName.trim().toLowerCase();
    if (!principal || this._disposed) return Promise.resolve(undefined);
    let photo = this._photos.get(principal);
    if (!photo) {
      photo = this._loadPhoto(principal);
      this._photos.set(principal, photo);
    }
    return photo;
  }

  private async _loadPhoto(principal: string): Promise<string | undefined> {
    let expired = false;
    let timer = 0;
    const timeout = new Promise<undefined>(resolve => {
      timer = window.setTimeout(() => { expired = true; resolve(undefined); }, 5000);
    });
    const request = (async (): Promise<string | undefined> => {
      if (!this._client) this._client = this._factory.getClient('3');
      const client = await this._client;
      if (this._disposed || expired) return undefined;
      // The SDK parses image content as Blob. Use $value to retrieve pixels, not metadata.
      // https://learn.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-1.0
      const photo: unknown = await client.api(`/users/${encodeURIComponent(principal)}/photo/$value`).version('v1.0').get();
      if (this._disposed || expired || !(photo instanceof Blob) || !photo.size || !photo.type.startsWith('image/')) return undefined;
      const url = URL.createObjectURL(photo);
      this._urls.add(url);
      return url;
    })();
    try { return await Promise.race([request, timeout]); }
    catch { return undefined; }
    finally { window.clearTimeout(timer); }
  }

  public dispose(): void {
    this._disposed = true;
    this._urls.forEach(url => URL.revokeObjectURL(url));
    this._urls.clear();
    this._photos.clear();
  }
}
