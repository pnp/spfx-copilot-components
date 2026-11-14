import type { MSGraphClientFactory, MSGraphClientV3 } from '@microsoft/sp-http';

export interface IUserProfile {
  displayName: string;
  jobTitle: string;
  mail: string;
}

export interface IMailMessage {
  id: string;
  subject: string;
  from: string;
  received: string;
  isRead: boolean;
}

export interface ICalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location: string;
}

export interface IGraphProfileService {
  getProfile(): Promise<IUserProfile>;
  getMessages(): Promise<IMailMessage[]>;
  getEvents(now: Date): Promise<ICalendarEvent[]>;
}

interface IGraphUser {
  displayName?: string;
  jobTitle?: string;
  mail?: string;
  userPrincipalName?: string;
}

interface IGraphMessage {
  id: string;
  subject?: string;
  from?: { emailAddress?: { name?: string } };
  receivedDateTime: string;
  isRead?: boolean;
}

interface IGraphDateTime {
  dateTime: string;
}

interface IGraphEvent {
  id: string;
  subject?: string;
  start: IGraphDateTime;
  end: IGraphDateTime;
  location?: { displayName?: string };
}

const NO_SUBJECT: string = '(No subject)';
const DAYS_AHEAD: number = 7;
const MS_PER_DAY: number = 24 * 60 * 60 * 1000;

/**
 * True when Microsoft Graph rejected the call because the permission
 * requested in `config/package-solution.json` is not approved yet.
 */
export function isPermissionError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) {
    return false;
  }

  const candidate = error as { statusCode?: number; message?: string };
  if (candidate.statusCode === 401 || candidate.statusCode === 403) {
    return true;
  }

  return /AADSTS65001|consent/i.test(candidate.message ?? '');
}

// calendarView returns UTC times without a zone suffix and with seven
// fractional digits. Keep the seconds and mark the value as UTC.
function toUtcIso(value: IGraphDateTime): string {
  return `${value.dateTime.slice(0, 19)}Z`;
}

/**
 * Reads the signed-in user's profile, mail, and calendar from Microsoft
 * Graph. The SPFx runtime provisions the token for `MSGraphClientV3`.
 */
export class GraphProfileService implements IGraphProfileService {
  private _clientPromise: Promise<MSGraphClientV3> | undefined;

  public constructor(private readonly _msGraphClientFactory: MSGraphClientFactory) {}

  public async getProfile(): Promise<IUserProfile> {
    const client: MSGraphClientV3 = await this._getClient();
    const user: IGraphUser = await client
      .api('/me')
      .select('displayName,jobTitle,mail,userPrincipalName')
      .get();

    return {
      displayName: user.displayName ?? '',
      jobTitle: user.jobTitle ?? '',
      mail: user.mail ?? user.userPrincipalName ?? ''
    };
  }

  public async getMessages(): Promise<IMailMessage[]> {
    const client: MSGraphClientV3 = await this._getClient();
    const response: { value: IGraphMessage[] } = await client
      .api('/me/messages')
      .select('id,subject,from,receivedDateTime,isRead')
      .orderby('receivedDateTime desc')
      .top(10)
      .get();

    return response.value.map((message: IGraphMessage) => ({
      id: message.id,
      subject: message.subject || NO_SUBJECT,
      from: message.from?.emailAddress?.name ?? '',
      received: message.receivedDateTime,
      isRead: message.isRead ?? false
    }));
  }

  public async getEvents(now: Date): Promise<ICalendarEvent[]> {
    const client: MSGraphClientV3 = await this._getClient();
    const end: Date = new Date(now.getTime() + DAYS_AHEAD * MS_PER_DAY);
    const response: { value: IGraphEvent[] } = await client
      .api('/me/calendarView')
      .query({ startDateTime: now.toISOString(), endDateTime: end.toISOString() })
      .select('id,subject,start,end,location')
      .orderby('start/dateTime')
      .top(25)
      .get();

    return response.value.map((event: IGraphEvent) => ({
      id: event.id,
      subject: event.subject || NO_SUBJECT,
      start: toUtcIso(event.start),
      end: toUtcIso(event.end),
      location: event.location?.displayName ?? ''
    }));
  }

  private _getClient(): Promise<MSGraphClientV3> {
    if (!this._clientPromise) {
      this._clientPromise = this._msGraphClientFactory.getClient('3');
    }
    return this._clientPromise;
  }
}
