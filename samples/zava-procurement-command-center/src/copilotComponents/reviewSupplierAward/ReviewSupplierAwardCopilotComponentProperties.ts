import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  eventId: z.string().optional().describe("Sourcing event identifier; the curated bid and award case is ZPC-RFP-31."),
  splitPercent: z.number().optional().describe("Proposed primary award percentage, runtime range 50 to 85. Above 70 requires separate approval authority."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm.")
});
export type IReviewSupplierAwardCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
