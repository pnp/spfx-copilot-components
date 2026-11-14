import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  region: z.string().optional().describe("Evidence region: EMEA, AMER, APAC, LATAM, or All regions where supported."),
  scenario: z.string().optional().describe("Explicit continuity, mitigation-trigger, or portfolio scenario stated by the user."),
  concentrationLimit: z.number().optional().describe("Maximum primary supplier share, runtime range 34 to 80, for the illustrative three-supplier portfolio.")
});
export type IExploreSupplierPortfolioBalanceCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
