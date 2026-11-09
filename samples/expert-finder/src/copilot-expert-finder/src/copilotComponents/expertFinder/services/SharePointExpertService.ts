import { z } from 'zod';
import { SPHttpClient } from '@microsoft/sp-http';
import type { Expert, ExpertSkill } from '../models/Expert';
import { normalizeSkill } from '../utils/skills';
import { getTeamsChatUrl } from '../utils/expertLinks';
import type { IExpertService } from './IExpertService';

const responseSchema = z.object({
  value: z.array(z.object({
    Id: z.number(), Title: z.string().min(1), Skill: z.string(),
    ShortCV: z.string().nullish(), Department: z.string().nullish(),
    Expert: z.object({ Id: z.number(), Title: z.string().min(1), Name: z.string().nullish(), EMail: z.unknown().optional() })
  })),
  'odata.nextLink': z.string().optional(),
  '@odata.nextLink': z.string().optional()
});

function escapeLiteral(value: string): string { return value.replace(/'/g, "''"); }

export class SharePointExpertService implements IExpertService {
  public constructor(private readonly _client: SPHttpClient, private readonly _siteUrl: string, private readonly _listTitle: string) {}

  public async getExpertsBySkill(skill: ExpertSkill): Promise<Expert[]> {
    const canonical = normalizeSkill(skill);
    if (!canonical) throw new Error('Choose a supported skill: SPFx, Copilot, DB or Spanish.');
    let timer = 0;
    const timeout = new Promise<Expert[]>((_resolve, reject) => {
      timer = window.setTimeout(() => reject(new Error('SharePoint is taking too long. Please try again.')), 15000);
    });
    try { return await Promise.race([this._readExperts(canonical), timeout]); }
    finally { window.clearTimeout(timer); }
  }

  private async _readExperts(skill: ExpertSkill): Promise<Expert[]> {
    const query = new URLSearchParams({
      '$select': 'Id,Title,Skill,ShortCV,Department,Expert/Id,Expert/Title,Expert/Name,Expert/EMail',
      '$expand': 'Expert', '$filter': `Skill eq '${escapeLiteral(skill)}'`, '$orderby': 'Id asc', '$top': '100'
    });
    const url = `${this._siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(escapeLiteral(this._listTitle))}')/items?${query.toString()}`;
    const response = await this._client.get(url, SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata=nometadata', 'odata-version': '' }
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('You do not have access to this Experts list. Sign in with an authorized account.');
      if (response.status === 404) throw new Error('The Experts list could not be found in the tenant root site. Reload the component to check the data source again.');
      if (response.status === 429) throw new Error('SharePoint is busy. Please wait a moment and try again.');
      throw new Error(`Unable to retrieve experts from SharePoint (HTTP ${response.status}). Please try again.`);
    }
    let body: unknown;
    try { body = await response.json(); }
    catch { throw new Error('SharePoint returned an unreadable response. Please try again.'); }
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) throw new Error('The Experts list response is missing required fields. Check the list setup and Person field.');
    if (parsed.data['odata.nextLink'] || parsed.data['@odata.nextLink']) {
      throw new Error('This demo supports up to 100 experts per skill. Narrow the demo data before continuing.');
    }
    return parsed.data.value.map(item => {
      if (normalizeSkill(item.Skill) !== skill) throw new Error('SharePoint returned an unexpected skill. Check the Experts list configuration.');
      // A SharePoint membership login supplies the actual principal, unlike the mail attribute.
      const login = item.Expert.Name || '';
      const prefix = 'i:0#.f|membership|';
      const principal = login.indexOf(prefix) === 0 ? login.substring(prefix.length) : undefined;
      const userPrincipalName = getTeamsChatUrl(principal) ? principal : undefined;
      const email = z.email().safeParse(typeof item.Expert.EMail === 'string' ? item.Expert.EMail.trim() : undefined);
      return {
        id: String(item.Id), displayName: item.Expert.Title, jobTitle: item.Title,
        skill, shortCV: item.ShortCV || '', department: item.Department || '', userPrincipalName,
        email: email.success ? email.data : undefined
      };
    });
  }
}
