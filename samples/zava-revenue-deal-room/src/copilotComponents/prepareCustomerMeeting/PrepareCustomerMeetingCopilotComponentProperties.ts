import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  meetingId: z.string().optional().describe("Exact meeting ID: MTG-2042 or MTG-2043. Unknown or conflicting records show no-match."),
  opportunityId: z.string().optional().describe("Exact opportunity ID: ZDR-2042. Must agree with any related record scope."),
  selectedId: z.string().optional().describe("Exact visible source, opportunity, or value-flow stage/connection ID to inspect. Unknown or filtered selections remain visible as no-match.")
});
export type IPrepareCustomerMeetingCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
