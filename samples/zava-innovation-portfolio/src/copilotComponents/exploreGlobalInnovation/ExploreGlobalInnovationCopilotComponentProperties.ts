import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({
  region: z.string().optional().describe("Exact reporting/recruitment region: AMER, EMEA, APAC, LATAM. Challenge also supports All regions. Unsupported values visibly have no match.")
});
export type IExploreGlobalInnovationCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
