import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({
  ideaId: z.string().optional().describe("Exact offline catalog ID (IDEA-001 format). Smart Onboarding Journey is IDEA-001; Knowledge Discovery Platform IDEA-031; Frontline Copilot Coach IDEA-057. Never invent or substitute an unknown ID.")
});
export type IGenerateInnovationBriefCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
