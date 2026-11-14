import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier.")
});
export type IExploreSupplier360CopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
