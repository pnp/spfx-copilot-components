import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  requestId: z.string().optional().describe('Optional stable vacation request ID to open for review.'),
  employeeName: z.string().optional().describe('Optional employee name used to filter the vacation request queue.'),
  status: z.string().optional().describe('Optional request status filter such as pending, approved, or declined.')
});

export type IReviewVacationRequestsCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
