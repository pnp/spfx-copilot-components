import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  region: z.string().optional().describe("Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported."),
  scenario: z.string().optional().describe("Explicit continuity, mitigation-trigger, or portfolio scenario stated by the user.")
});
export type ITrackSupplierRiskCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
