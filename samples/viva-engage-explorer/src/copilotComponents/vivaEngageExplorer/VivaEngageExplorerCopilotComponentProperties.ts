import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export const propertiesSchema = z.object({
  action: z.enum(['list', 'search', 'details']).optional()
    .describe('List communities, search retrieved names and descriptions, or show details. Defaults to list.'),
  searchText: z.string().max(1024).optional()
    .describe('Case-insensitive text to match in community names and descriptions. For name-only requests set searchIn=name. Empty clears search.'),
  searchIn: z.enum(['all', 'name', 'description']).optional()
    .describe('Fields to search. Defaults to all (name and description).'),
  privacy: z.enum(['all', 'public', 'private']).optional()
    .describe('Privacy filter. Defaults to all. Never infer membership from privacy.'),
  communityId: z.string().max(512).optional()
    .transform(value => value?.trim() || undefined)
    .describe('Optional exact Graph community ID. When supplied, list, search and details retrieve only this community. Omit or leave blank to retrieve all accessible communities, subject to requested search and privacy filters. Never guess IDs; use action=details and searchText for name lookup.'),
  sortBy: z.enum(['nameAsc', 'nameDesc']).optional()
    .describe('Alphabetical name order. Defaults to nameAsc.')
}).strict();

export type ICommunityExplorerQuery = z.infer<typeof propertiesSchema>;
export type IVivaEngageExplorerCopilotComponentProperties = ICommunityExplorerQuery;
export default zodToJsonSchema(propertiesSchema);
