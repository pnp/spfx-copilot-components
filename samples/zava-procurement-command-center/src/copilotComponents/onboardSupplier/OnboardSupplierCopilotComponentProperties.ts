import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  supplierName: z.string().optional().describe("Legal name of the new supplier candidate, not an existing supplier approval."),
  country: z.string().optional().describe("Country for the editable supplier intake."),
  category: z.string().optional().describe("Procurement category to filter or prefill, such as IT hardware or Logistics."),
  outcome: z.string().optional().describe("Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user.")
});
export type IOnboardSupplierCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
