import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  contractId: z.string().optional().describe("Existing contract identifier to review or negotiate, such as ZPC-CON-101."),
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm.")
});
export type IReviewContractRenewalCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
