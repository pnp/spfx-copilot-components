import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  eventId: z.string().optional().describe("Sourcing event identifier; the curated bid and award case is ZPC-RFP-31."),
  riskWeight: z.number().optional().describe("Bid risk weight percentage, runtime range 5 to 45; all evaluation weights retain a 100% total."),
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier.")
});
export type ICompareSupplierBidsCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
