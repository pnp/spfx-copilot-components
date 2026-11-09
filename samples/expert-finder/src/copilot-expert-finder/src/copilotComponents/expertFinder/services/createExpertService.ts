import { SPHttpClient } from '@microsoft/sp-http';
import type { IExpertService } from './IExpertService';
import { MockExpertService } from './MockExpertService';
import { SharePointExpertService } from './SharePointExpertService';

export async function createExpertService(
  client: SPHttpClient,
  contextWebUrl: string
): Promise<{ service: IExpertService; isDemo: boolean }> {
  const rootSiteUrl = new URL(contextWebUrl).origin;
  const listTitle = 'Experts';
  const response = await client.get(
    `${rootSiteUrl}/_api/web/lists/getbytitle('${listTitle}')?$select=Id`,
    SPHttpClient.configurations.v1
  );

  if (response.status === 404) {
    return { service: new MockExpertService(), isDemo: true };
  }
  if (response.status !== 200) {
    throw new Error(`Unable to check the Experts list (HTTP ${response.status}). Check your access to the tenant root site.`);
  }

  return { service: new SharePointExpertService(client, rootSiteUrl, listTitle), isDemo: false };
}
