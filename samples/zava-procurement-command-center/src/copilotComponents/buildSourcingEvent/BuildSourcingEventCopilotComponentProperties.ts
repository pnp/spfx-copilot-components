import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  cohortId: z.string().optional().describe("Source demand cohort identifier for a sourcing event draft."),
  eventId: z.string().optional().describe("Sourcing event identifier; the curated bid and award case is ZPC-RFP-31."),
  category: z.string().optional().describe("Procurement category to filter or prefill, such as IT hardware or Logistics."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry."),
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  outcome: z.string().optional().describe("Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user.")
});
export type IBuildSourcingEventCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
