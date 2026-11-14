import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  purchaseOrderId: z.string().optional().describe("Existing purchase order identifier, such as ZPC-PO-4108."),
  requestId: z.string().optional().describe("Existing purchase request identifier. Unknown identifiers remain visible as no-match states."),
  quantity: z.number().int().optional().describe("Whole positive unit quantity explicitly requested by the user; runtime range is 1 to 100000."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry."),
  budget: z.number().optional().describe("Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm.")
});
export type IManagePurchaseOrderChangeCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
