import { z } from 'zod';
import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';
import type { AvailabilityStatus, ExpertAvailability } from '../models/ExpertAvailability';

const responseSchema = z.object({
  value: z.array(z.object({ availabilityView: z.string().nullish(), error: z.unknown().optional() })).length(1)
});
const statuses: readonly AvailabilityStatus[] = ['free', 'tentative', 'busy', 'outOfOffice'];
const slotDuration = 30 * 60 * 1000;

export class GraphAvailabilityService {
  private _client: Promise<MSGraphClientV3> | undefined;
  private _disposed = false;

  public constructor(private readonly _factory: MSGraphClientFactory) {}

  public async getAvailability(email: string, now = new Date()): Promise<ExpertAvailability> {
    const address = z.email().safeParse(email.trim());
    if (!address.success) throw new Error('Availability unavailable: no email address.');
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18);
    if (end.getTime() - start.getTime() !== 18 * slotDuration) {
      throw new Error('The selected local time window could not be displayed.');
    }
    let expired = false;
    let timer = 0;
    const timeout = new Promise<ExpertAvailability>((_resolve, reject) => {
      timer = window.setTimeout(() => {
        expired = true;
        reject(new Error('Calendar availability is taking too long. Please try again.'));
      }, 10000);
    });
    try { return await Promise.race([this._readAvailability(address.data, start, end, () => expired), timeout]); }
    finally { window.clearTimeout(timer); }
  }

  private async _readAvailability(email: string, start: Date, end: Date, expired: () => boolean): Promise<ExpertAvailability> {
    let response: unknown;
    try {
      if (!this._client) this._client = this._factory.getClient('3');
      const client = await this._client;
      if (expired() || this._disposed) throw new Error('The calendar request is no longer active.');
      // /me is the caller; schedules contains the selected expert's SMTP address.
      // https://learn.microsoft.com/en-us/graph/api/calendar-getschedule?view=graph-rest-1.0
      response = await client.api('/me/calendar/getSchedule').version('v1.0').post({
        schedules: [email], availabilityViewInterval: 30,
        startTime: { dateTime: start.toISOString().slice(0, 19), timeZone: 'UTC' },
        endTime: { dateTime: end.toISOString().slice(0, 19), timeZone: 'UTC' }
      });
    } catch (error: unknown) {
      this._client = undefined;
      const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
      if (status === 401 || status === 403) throw new Error('Calendar access is unavailable. Check sign-in, permissions and calendar sharing.');
      if (status === 404) throw new Error('Calendar availability is unavailable. The mailbox may not be accessible.');
      if (status === 429) throw new Error('The calendar service is busy. Please wait a moment before trying again.');
      throw new Error('Unable to retrieve calendar availability. Check mailbox access and try again.');
    }
    if (expired() || this._disposed) throw new Error('The calendar request is no longer active.');
    // Strip event details at the boundary; only free/busy codes enter UI state.
    const parsed = responseSchema.safeParse(response);
    if (!parsed.success) throw new Error('No usable availability information was returned.');
    const schedule = parsed.data.value[0];
    if (schedule.error !== undefined && schedule.error !== null) {
      throw new Error('Availability is unavailable for this expert. Check mailbox access and calendar sharing.');
    }
    const view = schedule.availabilityView;
    if (!view || !/^[0-3]{18}$/.test(view)) throw new Error('No usable availability information was returned.');
    return {
      date: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      slots: view.split('').map((code, index) => ({
        start: new Date(start.getTime() + index * slotDuration),
        end: new Date(start.getTime() + (index + 1) * slotDuration), status: statuses[Number(code)]
      }))
    };
  }

  public dispose(): void { this._disposed = true; }
}
