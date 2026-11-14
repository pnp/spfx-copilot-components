import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  recipientName: z.string().optional().describe('Optional colleague display name used to prefill the praise draft.'),
  message: z.string().optional().describe('Optional praise message used only to prefill an editable draft.'),
  audience: z.string().optional().describe('Optional permitted community or direct audience label.')
});

export type IShowRecognitionAndCommunitiesCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
