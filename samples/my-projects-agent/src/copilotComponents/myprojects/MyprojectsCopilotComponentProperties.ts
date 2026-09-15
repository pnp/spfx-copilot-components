import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

function createIsoDateSchema(): z.ZodString {
  return z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Calendar date in YYYY-MM-DD format.');
}

export const propertiesSchema = z.object({
  view: z
    .enum(['all', 'active', 'urgent', 'overdue', 'onHold'])
    .default('all')
    .describe(
      "Project view to render. Use 'active' for incomplete tasks, 'urgent' for " +
      "incomplete tasks that are overdue or due within seven days, 'overdue' " +
      "only for incomplete overdue tasks, and 'onHold' for incomplete tasks in " +
      "a bucket named On hold, Hold, or Blocked. Use 'all' when no status " +
      'filter is requested.'
    ),
  projectName: z
    .string()
    .optional()
    .describe(
      'Project title supplied by the user. Omit it when the user does not name ' +
      'a specific project. Do not invent or expand a partial title.'
    ),
  assignedToMe: z
    .boolean()
    .optional()
    .describe(
      'Set to true when the user asks for projects or tasks assigned to them. ' +
      'Omit it otherwise.'
    ),
  dateField: z
    .enum(['activity', 'created', 'due'])
    .optional()
    .describe(
      "Date to filter. Use 'activity' for work or activity, 'created' for when " +
      "the project was created, and 'due' for task deadlines."
    ),
  dateRange: z
    .enum([
      'today',
      'last7Days',
      'last30Days',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
      'custom',
    ])
    .optional()
    .describe(
      "Calendar range for dateField. 'lastWeek' and 'lastMonth' mean the " +
      "previous calendar week or month. Use 'last7Days' or 'last30Days' for " +
      "rolling periods. Use 'custom' with fromDate and/or toDate."
    ),
  fromDate: createIsoDateSchema()
    .optional()
    .describe('Inclusive start date for a custom date range.'),
  toDate: createIsoDateSchema()
    .optional()
    .describe('Inclusive end date for a custom date range.'),
  sortBy: z
    .enum(['title', 'recentActivity', 'createdDate', 'nextDueDate'])
    .optional()
    .describe(
      "Result order. Use 'recentActivity' for recently worked projects, " +
      "'createdDate' for newest projects, and 'nextDueDate' for upcoming work."
    ),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe(
      'Maximum projects to return. Use 1 when the user asks for the latest, ' +
      'newest, or single most recent project. Omit when the user asks for all ' +
      'projects or does not specify a count; never default to 10.'
    ),
});

export const createProjectPropertiesSchema = z.object({
  operation: z
    .enum(['create'])
    .describe('Always set to create when preparing a new Planner project.'),
  projectName: z
    .string()
    .min(1)
    .describe('Exact title for the new Planner project.'),
  startDate: createIsoDateSchema().describe(
    'Start date requested by the user, resolved to an exact calendar date.'
  ),
  template: z
    .enum([
      'basicPlan',
      'simplePlan',
      'projectManagement',
      'softwareDevelopment',
      'businessPlan',
      'employeeOnboarding',
    ])
    .describe(
      "Use 'basicPlan' only when the user asks to start from scratch. Use " +
        "'simplePlan' for lightweight general work, 'projectManagement' for " +
        "structured project delivery, 'softwareDevelopment' for software or " +
        "engineering delivery, 'businessPlan' for business planning, and " +
        "'employeeOnboarding' for onboarding a new employee."
    ),
  assignPlanningAndDevelopmentToMe: z
    .boolean()
    .optional()
    .describe(
      "Set to true when the user asks to assign the template's key work to " +
        'themselves.'
    ),
});

export const createProjectPropertiesJsonSchema = zodToJsonSchema(
  createProjectPropertiesSchema
);

export default zodToJsonSchema(propertiesSchema);
