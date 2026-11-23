import { z } from 'zod';

export const propertiesSchema = z.strictObject({
  eventId: z.string().min(1).max(2048).refine(value => value === value.trim() && Array.from(value).every(character => {
    const code = character.charCodeAt(0); return code >= 32 && code !== 127;
  })).describe('Copy the exact Graph eventId from the matching Expert Finder meeting agenda request. Never invent or shorten it.'),
  bookingId: z.uuid().describe('Copy the exact bookingId UUID from the same meeting agenda request.'),
  agenda: z.string().min(1).max(4000).describe('The full generated agenda as plain text: objective, timed blocks totaling 30 minutes, and exactly three relevant questions in the user language. Supply actual agenda content, never a message saying it was prepared or a placeholder. This is a draft for review, not a saved agenda.')
});
export type IPrepareMeetingAgendaProperties = z.infer<typeof propertiesSchema>;
export default z.toJSONSchema(propertiesSchema, { target: 'draft-7' });
