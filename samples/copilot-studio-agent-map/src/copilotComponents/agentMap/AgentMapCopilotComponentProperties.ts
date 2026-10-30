/**
 * Copilot tool properties for the Agent Map. The manifest references the
 * compiled default export (JSON Schema). Copilot fills in these values from
 * the user's request. All values are optional: the user chooses the missing
 * values in the view.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  agentName: z
    .string()
    .optional()
    .describe('Display name of the Copilot Studio agent to map, as the user wrote it. Leave empty when the user did not name an agent.'),
  environmentName: z
    .string()
    .optional()
    .describe('Display name of the Power Platform environment that contains the agent. Leave empty when the user did not name an environment.'),
  agentId: z
    .string()
    .optional()
    .describe('Dataverse ID (GUID) of the agent. Use only a GUID that the user supplied.'),
  environmentId: z
    .string()
    .optional()
    .describe('ID (GUID) of the Power Platform environment. Use only a GUID that the user supplied.')
});

export type IAgentMapCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
