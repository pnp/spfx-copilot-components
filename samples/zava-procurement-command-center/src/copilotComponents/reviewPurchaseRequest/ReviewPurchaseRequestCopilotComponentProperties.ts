import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  requestId: z.string().optional().describe("Existing purchase request identifier. Unknown identifiers remain visible as no-match states."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm.")
});
export type IReviewPurchaseRequestCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
