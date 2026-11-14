import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  supplierId: z.string().optional().describe("Exact supplier identifier or name; an unknown value must not select another supplier."),
  scenario: z.string().optional().describe("Explicit continuity, mitigation-trigger, or portfolio scenario stated by the user."),
  owner: z.string().optional().describe("Named accountable owner for the mitigation action."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry."),
  budget: z.number().optional().describe("Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority."),
  outcome: z.string().optional().describe("Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user.")
});
export type IPlanSupplierRiskMitigationCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
