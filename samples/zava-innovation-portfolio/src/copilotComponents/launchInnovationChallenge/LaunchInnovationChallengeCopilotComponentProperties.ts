import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({
  message: z.string().optional().describe("User-supplied idea/challenge title, recognition message, funding rationale, or pilot hypothesis, appropriate to this tool. Initializes an editable draft only; never confirms it."),
  theme: z.string().optional().describe("Exact strategic theme to initialize or filter: Customer experience, Operational efficiency, Sustainability, New revenue, Employee experience, AI & automation."),
  region: z.string().optional().describe("Exact reporting/recruitment region: AMER, EMEA, APAC, LATAM. Challenge also supports All regions. Unsupported values visibly have no match.")
});
export type ILaunchInnovationChallengeCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
