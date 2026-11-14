import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  approvalType: z.enum(['budget', 'publication', 'supplier', 'all']).optional().describe('Optional approval queue type requested by the user.'),
  approvalId: z.string().optional().describe('Optional stable approval ID to open directly.')
});

export type IShowMyApprovalsCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
