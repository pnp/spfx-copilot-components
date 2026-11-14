import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  category: z.string().optional().describe("Procurement category to filter or prefill, such as IT hardware or Logistics."),
  region: z.string().optional().describe("Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported."),
  opportunityId: z.string().optional().describe("Leakage opportunity or recovery intervention identifier, such as ZPC-LEAK-01.")
});
export type IDetectSpendLeakageCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
