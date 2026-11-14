import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry.")
});
export type IReviewSupplierQualificationCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
