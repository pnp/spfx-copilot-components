import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({
  ideaId: z.string().optional().describe("Exact offline catalog ID (IDEA-001 format). Smart Onboarding Journey is IDEA-001; Knowledge Discovery Platform IDEA-031; Frontline Copilot Coach IDEA-057. Never invent or substitute an unknown ID."),
  theme: z.string().optional().describe("Exact strategic theme to initialize or filter: Customer experience, Operational efficiency, Sustainability, New revenue, Employee experience, AI & automation.")
});
export type IGetMyInnovationCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
