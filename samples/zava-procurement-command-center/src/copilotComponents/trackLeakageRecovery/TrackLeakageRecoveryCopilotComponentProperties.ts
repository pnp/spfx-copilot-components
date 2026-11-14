import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  opportunityId: z.string().optional().describe("Leakage opportunity or recovery intervention identifier, such as ZPC-LEAK-01."),
  proposedDecision: z.string().optional().describe("Editable decision suggestion only; never confirms, approves, rejects, or posts anything automatically."),
  conditionText: z.string().optional().describe("User-provided rationale or conditions for human review; at least 12 characters are required to confirm.")
});
export type ITrackLeakageRecoveryCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
