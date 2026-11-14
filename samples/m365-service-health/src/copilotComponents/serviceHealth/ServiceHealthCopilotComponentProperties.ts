/**
 * Properties schema for this Copilot Component.
 *
 * This schema is defined with Zod and exported as JSON Schema via
 * Zod's built-in converter. The manifest references the compiled `.js` default
 * export, which the Copilot host uses to validate and describe the tool
 * arguments that Copilot passes when invoking this component.
 *
 * To add more properties, extend the `z.object({...})` below — they will
 * automatically appear as tool parameters in the Copilot UI.
 */
import { z} from 'zod';

export const propertiesSchema = z.object({
  mode: z.enum(['overall', 'specific'])
    .describe('Use overall for Microsoft 365 health across all services. Use specific only when the user names a Microsoft 365 service.'),
  serviceName: z.string()
    .optional()
    .describe('The Microsoft 365 service to check when mode is specific, such as Microsoft Teams, Exchange Online, SharePoint Online, OneDrive, or Microsoft Entra ID.')
})
.superRefine((value, context) => {
  const trimmedServiceName = value.serviceName?.trim();

  if (value.mode === 'specific' && (!trimmedServiceName || trimmedServiceName.length === 0)) {
    context.addIssue({
      code: "custom",
      path: ['serviceName'],
      message: 'serviceName is required when mode is specific.'
    });
  }
});

export type IServiceHealthCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default z.toJSONSchema(propertiesSchema);
