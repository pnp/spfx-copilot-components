import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  focus: z.enum(['summary', 'meetings', 'tasks', 'news', 'mail', 'plan']).optional()
    .describe('The visible focus within the same read-only My Day cockpit: summary for a daily overview, meetings for agenda or next meeting, tasks for due work, news for company stories, mail for important messages, or plan for a locally generated focus briefing. Never changes host display mode or performs an external action.')
});

export type IMyDayCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
