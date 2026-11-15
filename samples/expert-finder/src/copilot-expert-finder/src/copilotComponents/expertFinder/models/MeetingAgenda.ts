import type { Expert } from './Expert';
import type { CreatedMeeting } from './ExpertMeeting';

export interface AgendaTarget { readonly eventId: string; readonly bookingId: string; }
export interface AgendaRequest {
  readonly expert: Expert;
  readonly meeting: CreatedMeeting;
  readonly objective: string;
  readonly timeZone: string;
}
export interface MeetingAgenda extends AgendaTarget {
  readonly subject: string;
  readonly expertName: string;
  readonly expertEmail: string;
  readonly startUtc: string;
  readonly endUtc: string;
  readonly agenda?: string;
  readonly reviewVersion: string;
  readonly outlookUrl?: string;
}
export interface AgendaSaveResult {
  readonly status: 'saved' | 'alreadySaved' | 'conflict' | 'unknown';
  readonly meeting?: MeetingAgenda;
}
