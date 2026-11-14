import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({

});
export type IGetInnovationGrowthCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
