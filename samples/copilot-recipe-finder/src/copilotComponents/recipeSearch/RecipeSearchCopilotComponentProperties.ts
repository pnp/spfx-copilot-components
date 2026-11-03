import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  query: z.string().describe('A short recipe or dish name to search, for example Arrabiata or chicken. Not an allergy certification or timing filter.')
});

export type IRecipeSearchCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
