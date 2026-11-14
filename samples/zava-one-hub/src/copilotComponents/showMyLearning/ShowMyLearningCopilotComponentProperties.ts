import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  assignmentId: z.string().optional().describe('Optional stable learning assignment ID to open.'),
  status: z.string().optional().describe('Optional learning status filter such as required or completed.')
});

export type IShowMyLearningCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
