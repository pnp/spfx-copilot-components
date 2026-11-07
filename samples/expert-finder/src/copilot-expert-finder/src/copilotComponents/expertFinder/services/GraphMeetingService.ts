import { z } from 'zod';
import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';
import type { Expert } from '../models/Expert';
import type { AvailabilitySlot } from '../models/ExpertAvailability';
import type { CreatedMeeting, MeetingOrganizer } from '../models/ExpertMeeting';

const calendarSchema = z.object({ allowedOnlineMeetingProviders: z.array(z.string()) });
const scheduleSchema = z.object({
  value: z.array(z.object({ availabilityView: z.string().nullish(), error: z.unknown().optional() })).length(2)
});
const eventSchema = z.object({
  id: z.string().min(1), webLink: z.string().nullish(), isOnlineMeeting: z.boolean().optional(),
  onlineMeetingProvider: z.string().optional(), onlineMeeting: z.object({ joinUrl: z.string().nullish() }).nullish()
});

function normalize(value?: string): string { return (value || '').trim().replace(/^i:0#\.f\|membership\|/i, '').toLowerCase(); }
function httpsUrl(value: unknown): string | undefined {
  const parsed = z.url().safeParse(value);
  return parsed.success && new URL(parsed.data).protocol === 'https:' ? parsed.data : undefined;
}
async function withTimeout<T>(request: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer = 0;
  const timeout = new Promise<T>((_resolve, reject) => { timer = window.setTimeout(() => reject(new Error(message)), milliseconds); });
  try { return await Promise.race([request, timeout]); }
  finally { window.clearTimeout(timer); }
}

export class GraphMeetingService {
  private _client: Promise<MSGraphClientV3> | undefined;
  private _teamsReady: Promise<void> | undefined;
  private readonly _requests = new Map<string, Promise<CreatedMeeting>>();
  private readonly _bookedSlots = new Set<string>();
  private _disposed = false;
  public readonly organizer: MeetingOrganizer;

  public constructor(private readonly _factory: MSGraphClientFactory, organizer: MeetingOrganizer) {
    this.organizer = { ...organizer, email: normalize(organizer.email), userPrincipalName: normalize(organizer.userPrincipalName) };
  }

  public isSelf(expert: Expert): boolean {
    const samePrincipal = !!expert.userPrincipalName && !!this.organizer.userPrincipalName && normalize(expert.userPrincipalName) === this.organizer.userPrincipalName;
    return !!expert.email && normalize(expert.email) === this.organizer.email || samePrincipal;
  }

  public canSchedule(expert: Expert): boolean {
    return !this._disposed && z.email().safeParse(this.organizer.email).success && z.email().safeParse(expert.email).success
      && !this.isSelf(expert);
  }

  private _key(expert: Expert, slot: AvailabilitySlot): string { return `${normalize(expert.email)}|${slot.start.toISOString()}|${slot.end.toISOString()}`; }
  public hasMeetingRequest(expert: Expert, slot: AvailabilitySlot): boolean { return this._requests.has(this._key(expert, slot)); }
  public isSlotBooked(expert: Expert, slot: AvailabilitySlot): boolean { return this._bookedSlots.has(this._key(expert, slot)); }

  public async createMeeting(expert: Expert, slot: AvailabilitySlot, notes: string): Promise<CreatedMeeting> {
    if (!this.canSchedule(expert)) throw new Error('Meeting creation is unavailable for this expert or account.');
    if (slot.status !== 'free' || slot.start.getTime() <= Date.now() || slot.end.getTime() - slot.start.getTime() !== 30 * 60 * 1000) {
      throw new Error('Choose a future Free 30-minute slot.');
    }
    if (notes.length > 1000) throw new Error('Keep meeting notes within 1,000 characters.');
    const key = this._key(expert, slot);
    const existing = this._requests.get(key);
    if (existing) return existing;
    let writeStarted = false;
    const request = this._create(expert, slot, notes.trim(), () => { writeStarted = true; }).then(meeting => {
      // Keep confirmed bookings visible while the attendee's free/busy view catches up.
      if (!this._disposed) this._bookedSlots.add(key);
      return meeting;
    }).catch((error: unknown) => {
      const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
      if (!writeStarted) { this._requests.delete(key); throw error; }
      if (status === 401 || status === 403) {
        throw new Error('Calendar creation was denied. Check Calendars.ReadWrite and mailbox access, and inspect Outlook before requesting this slot again.');
      }
      // A lost POST response does not prove failure. Retain this attempt to block a second invitation.
      throw new Error('Meeting creation could not be confirmed. Check your Outlook calendar before booking this slot again.');
    });
    this._requests.set(key, request);
    return request;
  }

  private async _prepare(expert: Expert, slot: AvailabilitySlot): Promise<MSGraphClientV3> {
    let client: MSGraphClientV3;
    let schedule: unknown;
    try {
      if (!this._client) this._client = this._factory.getClient('3');
      client = await this._client;
      if (this._disposed) throw new Error('The component is closed.');
      if (!this._teamsReady) this._teamsReady = client.api('/me/calendar').version('v1.0').select('allowedOnlineMeetingProviders').get().then((response: unknown) => {
        const calendar = calendarSchema.safeParse(response);
        if (!calendar.success || calendar.data.allowedOnlineMeetingProviders.indexOf('teamsForBusiness') === -1) {
          throw new Error('Teams meetings are unavailable for this calendar.');
        }
      });
      [, schedule] = await Promise.all([this._teamsReady, client.api('/me/calendar/getSchedule').version('v1.0').post({
        schedules: [this.organizer.email, expert.email], availabilityViewInterval: 30,
        startTime: { dateTime: slot.start.toISOString().slice(0, 19), timeZone: 'UTC' },
        endTime: { dateTime: slot.end.toISOString().slice(0, 19), timeZone: 'UTC' }
      })]);
    } catch {
      this._client = undefined; this._teamsReady = undefined;
      throw new Error('Unable to verify both calendars and Teams support. Check permissions, mailbox access and Teams configuration.');
    }
    const result = scheduleSchema.safeParse(schedule);
    if (!result.success || result.data.value.some(item => (item.error !== undefined && item.error !== null) || item.availabilityView !== '0')) {
      throw new Error('Both calendars could not be confirmed Free. Refresh availability and choose another slot.');
    }
    return client;
  }

  private async _create(expert: Expert, slot: AvailabilitySlot, notes: string, startWrite: () => void): Promise<CreatedMeeting> {
    const client = await withTimeout(this._prepare(expert, slot), 10000, 'Calendar checks are taking too long. Please try again.');
    if (this._disposed || slot.start.getTime() <= Date.now()) throw new Error('This slot is no longer available. Refresh and choose another one.');
    const transactionId = window.crypto.randomUUID();
    // Calendar-backed Teams meeting: /me is the organizer; only the expert is an attendee.
    // https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0
    startWrite();
    const response: unknown = await withTimeout(client.api('/me/events').version('v1.0').post({
      subject: `Expert Finder: ${expert.skill} discussion`,
      body: { contentType: 'Text', content: `Discussion about ${expert.skill}.${notes ? `\n\n${notes}` : ''}` },
      start: { dateTime: slot.start.toISOString().slice(0, 19), timeZone: 'UTC' },
      end: { dateTime: slot.end.toISOString().slice(0, 19), timeZone: 'UTC' },
      attendees: [{ emailAddress: { address: expert.email, name: expert.displayName }, type: 'required' }],
      isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness', showAs: 'busy', transactionId
    }), 20000, 'Meeting creation could not be confirmed.');
    const parsed = eventSchema.safeParse(response);
    if (!parsed.success) throw new Error('The meeting response could not be confirmed.');
    let event = parsed.data;
    if (!httpsUrl(event.onlineMeeting?.joinUrl)) {
      try {
        const refreshed: unknown = await withTimeout(client.api(`/me/events/${encodeURIComponent(event.id)}`).version('v1.0')
          .select('id,webLink,isOnlineMeeting,onlineMeetingProvider,onlineMeeting').get(), 5000, 'The meeting link is not available yet.');
        const linkResult = eventSchema.safeParse(refreshed);
        if (linkResult.success) event = linkResult.data;
      } catch { /* The event already exists. Never create a second event to retrieve its link. */ }
    }
    return { id: event.id, outlookUrl: httpsUrl(event.webLink),
      teamsJoinUrl: event.isOnlineMeeting && event.onlineMeetingProvider === 'teamsForBusiness' ? httpsUrl(event.onlineMeeting?.joinUrl) : undefined };
  }

  public dispose(): void { this._disposed = true; this._requests.clear(); this._bookedSlots.clear(); }
}
