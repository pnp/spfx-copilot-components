import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  category: z.string().optional().describe("Procurement category to filter or prefill, such as IT hardware or Logistics."),
  region: z.string().optional().describe("Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported."),
  currency: z.enum(['EUR','USD','GBP','JPY']).optional().describe("Explicit currency; comparison and policy scenarios use EUR and never silently convert.")
});
export type IAggregateDemandCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
