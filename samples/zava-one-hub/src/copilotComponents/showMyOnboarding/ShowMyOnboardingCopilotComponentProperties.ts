import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  scope: z.string().optional().describe('Optional business scope, record label, date, or location from the user request.'),
  query: z.string().optional().describe('Optional search or filter text used to focus the initial experience.')
});

export type IShowMyOnboardingCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
