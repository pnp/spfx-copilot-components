import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  category: z.string().optional().describe("Procurement category to filter or prefill, such as IT hardware or Logistics."),
  period: z.string().optional().describe("Evidence period; spend comparisons support Current period or Previous period."),
  region: z.string().optional().describe("Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported.")
});
export type IExploreSpendPerformanceCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
