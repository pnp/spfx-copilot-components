import { z } from 'zod';

export const propertiesSchema = z.strictObject({
  skill: z.string().min(1).max(80).describe(
    'The skill the user wants to find an expert in. Use one canonical value: SPFx, Copilot, DB, or Spanish. Map SharePoint Framework to SPFx and database expertise to DB.'
  )
});

export type IExpertFinderCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default z.toJSONSchema(propertiesSchema, { target: 'draft-7' });
