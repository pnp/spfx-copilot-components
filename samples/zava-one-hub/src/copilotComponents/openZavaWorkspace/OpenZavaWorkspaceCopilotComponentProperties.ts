import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  tab: z.string().optional().describe('Optional workspace tab: company or personal. This does not save a preference.')
});

export type IOpenZavaWorkspaceCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
