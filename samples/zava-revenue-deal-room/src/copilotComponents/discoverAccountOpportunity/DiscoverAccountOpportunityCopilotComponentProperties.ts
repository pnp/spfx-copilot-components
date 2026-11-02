import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  accountId: z.string().optional().describe("Exact account record ID, for example CONTOSO or ACC-002. Unknown IDs show no-match."),
  period: z.enum(['current', 'next', 'all']).optional().describe("Quarter offset filter: current is 0, next is 1, all includes every seeded quarter. Defaults to current."),
  region: z.enum(['all', 'North America', 'EMEA', 'Asia Pacific', 'Latin America']).optional().describe("Filter actual account region. Defaults to all."),
  selectedId: z.string().optional().describe("Exact visible source, opportunity, or Sankey node/ribbon ID to inspect. Unknown or filtered selections remain visible as no-match."),
  countryId: z.string().optional().describe("Exact uppercase ISO2 demo headquarters country ID, for example US, GB or DE. Unknown countries show explicit recovery; attribution is not rollout revenue."),
  mapMetric: z.enum(['opportunity', 'spend']).optional().describe("Country view: opportunity uses provided demo catalog value, spend uses a separate recorded demo expense ledger. No live spend or ROI is implied.")
});
export type IDiscoverAccountOpportunityCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
