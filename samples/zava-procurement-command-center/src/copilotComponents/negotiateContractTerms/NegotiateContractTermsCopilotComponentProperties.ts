import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  contractId: z.string().optional().describe("Existing contract identifier to review or negotiate, such as ZPC-CON-101."),
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  budget: z.number().optional().describe("Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry."),
  outcome: z.string().optional().describe("Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user.")
});
export type INegotiateContractTermsCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
