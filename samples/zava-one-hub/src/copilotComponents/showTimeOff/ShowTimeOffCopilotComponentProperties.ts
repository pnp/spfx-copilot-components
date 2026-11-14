import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  leaveType: z.enum(['vacation', 'sick', 'personal']).optional().describe('Optional leave type used to prefill a new request.'),
  startDate: z.string().optional().describe('Optional start date in YYYY-MM-DD format.'),
  endDate: z.string().optional().describe('Optional end date in YYYY-MM-DD format.'),
  reason: z.string().optional().describe('Optional editable reason used to prefill the request.')
});

export type IShowTimeOffCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
