import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  reportName: z.string().optional().describe('Optional editable expense report name.'),
  trip: z.string().optional().describe('Optional trip or business-purpose label.')
});

export type IShowExpensesAndTravelCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
