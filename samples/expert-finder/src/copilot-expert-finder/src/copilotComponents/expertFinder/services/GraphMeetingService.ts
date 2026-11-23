import { z } from 'zod';
import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';
import type { Expert } from '../models/Expert';
import type { AvailabilitySlot } from '../models/ExpertAvailability';
import type { CreatedMeeting, MeetingOrganizer } from '../models/ExpertMeeting';
import type { AgendaTarget, MeetingAgenda, AgendaSaveResult } from '../models/MeetingAgenda';
import { bookingIdSchema, eventIdSchema, meetingMarkerSchema, meetingPropertyId, normalizeAgenda } from '../utils/meetingAgenda';
import { inspectAgendaBody, mergeAgendaBody, type AgendaBody } from '../utils/meetingAgendaBody';

const calendarSchema = z.object({ allowedOnlineMeetingProviders: z.array(z.string()) });
const scheduleSchema = z.object({
  value: z.array(z.object({ availabilityView: z.string().nullish(), error: z.unknown().optional() })).length(2)
});
const eventSchema = z.object({
  id: z.string().min(1), webLink: z.string().nullish(), isOnlineMeeting: z.boolean().optional(),
  onlineMeetingProvider: z.string().optional(), onlineMeeting: z.object({ joinUrl: z.string().nullish() }).nullish()
});
const emailAddressSchema = z.object({ address: z.string(), name: z.string().optional() });
const agendaEventSchema = z.object({
  id: z.string(), subject: z.string().min(1), isOrganizer: z.boolean(), organizer: z.object({ emailAddress: emailAddressSchema }),
  attendees: z.array(z.object({ type: z.string(), emailAddress: emailAddressSchema })),
  start: z.object({ dateTime: z.string(), timeZone: z.literal('UTC') }),
  end: z.object({ dateTime: z.string(), timeZone: z.literal('UTC') }),
  type: z.literal('singleInstance'), recurrence: z.null(), isCancelled: z.literal(false),
  body: z.object({ contentType: z.string(), content: z.string() }), isOnlineMeeting: z.literal(true),
  onlineMeetingProvider: z.literal('teamsForBusiness'), onlineMeeting: z.object({ joinUrl: z.string() }),
  webLink: z.string().nullish(), '@odata.etag': z.string().optional(),
  singleValueExtendedProperties: z.array(z.object({ id: z.string(), value: z.string() }))
});
interface AgendaSnapshot { meeting: MeetingAgenda; body: AgendaBody; etag: string; joinUrl: string; signature: string; }

function statusCode(error: unknown): number | undefined {
  return error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : undefined;
}
function calendarError(error: unknown): Error {
  const status = statusCode(error);
  if (status === 401 || status === 403) return new Error('Calendar access was denied. Check your account permissions and mailbox access.');
  if (status === 404) return new Error('This meeting is no longer available. Check Outlook.');
  if (status === 429) return new Error('Calendar requests are being throttled. Wait before trying again.');
  return new Error('The meeting could not be read. Please try again or check Outlook.');
}

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
  private _agendaSaving = false;
  private _agendaRetryAt = 0;
  private _pendingAgenda: { snapshot: AgendaSnapshot; agenda: string } | undefined;
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
    const marker = meetingMarkerSchema.parse({ version: 1, bookingId: transactionId, expertEmail: normalize(expert.email),
      startUtc: slot.start.toISOString(), endUtc: slot.end.toISOString() });
    const markerValue = JSON.stringify(marker);
    if (new TextEncoder().encode(markerValue).byteLength > 2048) throw new Error('The meeting metadata is too long.');
    // Calendar-backed Teams meeting: /me is the organizer; only the expert is an attendee.
    // https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0
    startWrite();
    const response: unknown = await withTimeout(client.api('/me/events').version('v1.0').post({
      subject: `Expert Finder: ${expert.skill} discussion`,
      body: { contentType: 'Text', content: `Discussion about ${expert.skill}.${notes ? `\n\n${notes}` : ''}` },
      start: { dateTime: slot.start.toISOString().slice(0, 19), timeZone: 'UTC' },
      end: { dateTime: slot.end.toISOString().slice(0, 19), timeZone: 'UTC' },
      attendees: [{ emailAddress: { address: expert.email, name: expert.displayName }, type: 'required' }],
      isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness', showAs: 'busy', transactionId,
      singleValueExtendedProperties: [{ id: meetingPropertyId, value: markerValue }]
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
    return { id: event.id, bookingId: transactionId, outlookUrl: httpsUrl(event.webLink),
      teamsJoinUrl: event.isOnlineMeeting && event.onlineMeetingProvider === 'teamsForBusiness' ? httpsUrl(event.onlineMeeting?.joinUrl) : undefined };
  }

  private async _readAgenda(target: AgendaTarget): Promise<AgendaSnapshot> {
    eventIdSchema.parse(target.eventId); bookingIdSchema.parse(target.bookingId);
    if (this._disposed) throw new Error('The component is closed.');
    if (Date.now() < this._agendaRetryAt) throw new Error('Calendar requests are being throttled. Wait before trying again.');
    if (!this._client) this._client = this._factory.getClient('3');
    const client = await this._client;
    let response: unknown;
    try {
      response = await withTimeout(client.api(`/me/events/${encodeURIComponent(target.eventId)}`).version('v1.0')
        .header('Prefer', 'outlook.timezone="UTC"')
        .select('id,subject,organizer,isOrganizer,attendees,start,end,type,recurrence,isCancelled,body,isOnlineMeeting,onlineMeetingProvider,onlineMeeting,webLink,changeKey')
        .expand(`singleValueExtendedProperties($filter=id eq '${meetingPropertyId}')`).get(), 10000, 'Meeting read timed out.');
    } catch (error) { throw this._agendaError(error); }
    if (this._disposed) throw new Error('The component is closed.');
    const result = agendaEventSchema.safeParse(response);
    if (!result.success) throw new Error('This event is not an eligible 30-minute ExpertFinder Teams meeting.');
    const event = result.data;
    const organizer = normalize(event.organizer.emailAddress.address);
    if (event.id !== target.eventId || !event.isOrganizer || !organizer
      || (organizer !== this.organizer.email && organizer !== this.organizer.userPrincipalName)) {
      throw new Error('Only the organizer can update this ExpertFinder meeting.');
    }
    const properties = event.singleValueExtendedProperties.filter(item => item.id === meetingPropertyId);
    if (properties.length !== 1 || new TextEncoder().encode(properties[0].value).byteLength > 2048) {
      throw new Error('This meeting has no valid ExpertFinder booking marker.');
    }
    let marker: z.infer<typeof meetingMarkerSchema>;
    try { marker = meetingMarkerSchema.parse(JSON.parse(properties[0].value)); }
    catch { throw new Error('This meeting has invalid ExpertFinder booking data.'); }
    const utc = (value: string): string => new Date(/Z$/i.test(value) ? value : value + 'Z').toISOString();
    const startUtc = utc(event.start.dateTime);
    const endUtc = utc(event.end.dateTime);
    const expert = event.attendees.find(item => item.type === 'required' && normalize(item.emailAddress.address) === marker.expertEmail);
    const joinUrl = httpsUrl(event.onlineMeeting.joinUrl);
    const etag = event['@odata.etag'];
    if (marker.bookingId !== target.bookingId || startUtc !== marker.startUtc || endUtc !== marker.endUtc
      || Date.parse(endUtc) - Date.parse(startUtc) !== 30 * 60 * 1000 || !expert || !joinUrl || !etag) {
      throw new Error('The meeting booking, time or Teams connection no longer matches. Review it in Outlook.');
    }
    const body = inspectAgendaBody(event.body);
    const expertName = expert.emailAddress.name || expert.emailAddress.address;
    const reviewVersion = JSON.stringify([event.subject, expertName, marker.expertEmail, startUtc, endUtc, body.agenda]);
    return { body: event.body, etag, joinUrl, signature: body.signature, meeting: { ...target, subject: event.subject,
      expertName, expertEmail: marker.expertEmail, startUtc, endUtc, agenda: body.agenda, reviewVersion, outlookUrl: httpsUrl(event.webLink) } };
  }

  public async readMeetingAgenda(target: AgendaTarget): Promise<MeetingAgenda> { return (await this._readAgenda(target)).meeting; }

  private _agendaError(error: unknown): Error {
    if (statusCode(error) === 429) {
      const headers = error && typeof error === 'object' && 'headers' in error && error.headers instanceof Headers ? error.headers : undefined;
      const retry = headers?.get('Retry-After');
      const until = retry && !Number.isNaN(Number(retry)) ? Date.now() + Number(retry) * 1000 : Date.parse(retry || '');
      this._agendaRetryAt = Number.isFinite(until) ? Math.max(Date.now(), until) : Date.now() + 30000;
    }
    return calendarError(error);
  }

  private async _confirmAgenda(snapshot: AgendaSnapshot, agenda: string): Promise<AgendaSaveResult> {
    const actual = await this._readAgenda(snapshot.meeting);
    const saved = actual.meeting.agenda === agenda && actual.signature === snapshot.signature && actual.joinUrl === snapshot.joinUrl;
    if (saved) this._pendingAgenda = undefined;
    return { status: saved ? 'saved' : 'unknown', meeting: actual.meeting };
  }

  public async saveMeetingAgenda(target: AgendaTarget, text: string, reviewVersion: string): Promise<AgendaSaveResult> {
    const agenda = normalizeAgenda(text);
    if (this._agendaSaving || this._pendingAgenda) throw new Error('Check the previous save status before saving again.');
    this._agendaSaving = true;
    try {
      const snapshot = await this._readAgenda(target);
      if (snapshot.meeting.agenda === agenda) return { status: 'alreadySaved', meeting: snapshot.meeting };
      if (snapshot.meeting.reviewVersion !== reviewVersion) return { status: 'conflict', meeting: snapshot.meeting };
      const body = mergeAgendaBody(snapshot.body, agenda);
      const client = await this._client;
      if (!client || this._disposed) throw new Error('The component is closed.');
      this._pendingAgenda = { snapshot, agenda };
      try {
        await withTimeout(client.api(`/me/events/${encodeURIComponent(target.eventId)}`).version('v1.0')
          .header('If-Match', snapshot.etag).patch({ body }), 20000, 'Save could not be confirmed.');
      } catch (error) {
        const status = statusCode(error);
        if (status === 409 || status === 412) { this._pendingAgenda = undefined; return { status: 'conflict' }; }
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 429) {
          this._pendingAgenda = undefined;
          throw status === 400 ? new Error('The calendar rejected this agenda update. Review the event in Outlook.') : this._agendaError(error);
        }
        return { status: 'unknown' };
      }
      try { return await this._confirmAgenda(snapshot, agenda); }
      catch { return { status: 'unknown' }; }
    } finally { this._agendaSaving = false; }
  }

  public async checkAgendaSave(): Promise<AgendaSaveResult> {
    if (!this._pendingAgenda || this._agendaSaving) throw new Error('There is no pending save to check.');
    return this._confirmAgenda(this._pendingAgenda.snapshot, this._pendingAgenda.agenda);
  }

  public allowAgendaRetry(): void { if (!this._agendaSaving) this._pendingAgenda = undefined; }

  public dispose(): void { this._disposed = true; this._requests.clear(); this._bookedSlots.clear(); this._pendingAgenda = undefined; }
}
