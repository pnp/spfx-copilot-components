import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  year: z.number().int().min(2020).max(2100).optional().describe('Optional equity plan year.'),
  currency: z.enum(['EUR', 'USD', 'GBP']).optional().describe('Optional display currency.')
});

export type IShowMyEquityCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
