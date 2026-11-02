import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  accountId: z.string().optional().describe("Exact account record ID: CONTOSO or ACC-002. Unknown IDs show no-match."),
  selectedId: z.string().optional().describe("Exact visible source, opportunity, or value-flow stage/connection ID to inspect. Unknown or filtered selections remain visible as no-match.")
});
export type IBuildAccountBriefCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
