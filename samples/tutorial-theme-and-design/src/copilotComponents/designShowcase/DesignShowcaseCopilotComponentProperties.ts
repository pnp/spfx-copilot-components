/**
 * Properties schema for this Copilot Component.
 *
 * The tool has no parameters. The agent invokes it with an empty
 * object. The manifest references the compiled `.js` default export.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({});

export type IDesignShowcaseCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
