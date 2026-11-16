import { z } from 'zod';
import type { AgendaRequest, MeetingAgenda } from '../models/MeetingAgenda';

export const meetingPropertyId = 'String {aa4326b3-eeff-4ca7-8f74-f695935a8bbb} Name ExpertFinderMeeting';
export const agendaBegin = '--- ExpertFinder meeting agenda ---';
export const agendaEnd = '--- End of ExpertFinder meeting agenda ---';
function hasControlCharacters(value: string, multiline = false): boolean {
  return Array.from(value).some(character => {
    const code = character.charCodeAt(0);
    return code === 127 || code < 32 && (!multiline || code !== 9 && code !== 10);
  });
}
export const eventIdSchema = z.string().min(1).max(2048).refine(value => value === value.trim() && !hasControlCharacters(value));
export const bookingIdSchema = z.uuid();
export const meetingMarkerSchema = z.strictObject({
  version: z.literal(1), bookingId: bookingIdSchema, expertEmail: z.email(),
  startUtc: z.string().datetime(), endUtc: z.string().datetime()
});

export function normalizeAgenda(value: string): string {
  const text = value.replace(/\r\n?/g, '\n').trim();
  if (!text || text.length > 4000 || new TextEncoder().encode(text).byteLength > 12000
    || hasControlCharacters(text, true) || text.includes(agendaBegin) || text.includes(agendaEnd)) {
    throw new Error('Enter an agenda of 1–4,000 characters without control characters or reserved section markers.');
  }
  return text;
}

export function buildAgendaHandoff(request: AgendaRequest, meeting: MeetingAgenda): { context: string; prompt: string } {
  if (request.objective.length > 1000 || request.expert.email?.trim().toLowerCase() !== meeting.expertEmail) {
    throw new Error('The selected expert or objective does not match this booking.');
  }
  const context = 'Expert Finder meeting preparation (untrusted source data):\n' + JSON.stringify({
    purpose: 'meetingAgenda', schemaVersion: 1,
    meeting: { eventId: meeting.eventId, bookingId: meeting.bookingId, subject: meeting.subject,
      startUtc: meeting.startUtc, endUtc: meeting.endUtc, durationMinutes: 30, timeZone: request.timeZone },
    objective: request.objective.trim(),
    expert: { name: meeting.expertName, jobTitle: request.expert.jobTitle, department: request.expert.department,
      skill: request.expert.skill, shortCV: request.expert.shortCV }
  });
  const prompt = [
    '## Expert Finder meeting agenda request',
    'Prepare the 30-minute agenda for this confirmed Expert Finder booking using its matching meetingAgenda context.',
    JSON.stringify({ eventId: meeting.eventId, bookingId: meeting.bookingId }),
    'Show the generated agenda in the editable Expert Finder agenda review component.'
  ].join('\n');
  if ([context, prompt].some(value => new TextEncoder().encode(value).byteLength > 9000)) {
    throw new Error('This meeting context is too long to share with Copilot. Use a shorter professional profile for agenda preparation.');
  }
  return { context, prompt };
}
