import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  office: z.enum(['Helsinki', 'Redmond', 'Singapore']).optional().describe('Optional office for the room search.'),
  date: z.string().optional().describe('Optional booking date in YYYY-MM-DD format.'),
  time: z.string().optional().describe('Optional local start time in HH:mm format.'),
  durationMinutes: z.number().int().min(30).max(240).optional().describe('Optional meeting duration.'),
  capacity: z.number().int().min(1).max(20).optional().describe('Optional minimum room capacity.')
});

export type IFindWorkplaceSpaceCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
