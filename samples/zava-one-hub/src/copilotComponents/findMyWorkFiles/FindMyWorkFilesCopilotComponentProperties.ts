import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  query: z.string().optional().describe('Optional file-name or keyword search text.')
});

export type IFindMyWorkFilesCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
