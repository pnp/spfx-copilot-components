import type {
  IPlannerProjectBlueprint,
  IScheduledPlannerBlueprintTask,
  PlannerProjectTemplateKey,
} from '../models';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PLANNER_START_TIME = 'T09:00:00Z';
const PLANNER_DUE_TIME = 'T17:00:00Z';

export const PLANNER_PROJECT_TEMPLATE_KEYS = [
  'basicPlan',
  'simplePlan',
  'projectManagement',
  'softwareDevelopment',
  'businessPlan',
  'employeeOnboarding',
] as const satisfies readonly PlannerProjectTemplateKey[];

const BASIC_PLAN_BLUEPRINT = {
  key: 'basicPlan',
  version: 1,
  buckets: [],
  tasks: [],
} as const satisfies IPlannerProjectBlueprint;

const SIMPLE_PLAN_BLUEPRINT = {
  key: 'simplePlan',
  version: 1,
  buckets: [
    { key: 'toDo', name: 'To do' },
    { key: 'inProgress', name: 'In progress' },
    { key: 'done', name: 'Done' },
  ],
  tasks: [
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'toDo',
      dueOffsetDays: 2,
      startOffsetDays: 0,
      title: 'Confirm the desired outcome',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'toDo',
      dueOffsetDays: 3,
      startOffsetDays: 1,
      title: 'List and prioritize the work',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'inProgress',
      dueOffsetDays: 7,
      startOffsetDays: 3,
      title: 'Start the highest-priority work',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'inProgress',
      dueOffsetDays: 14,
      startOffsetDays: 7,
      title: 'Review progress and next steps',
    },
  ],
} as const satisfies IPlannerProjectBlueprint;

const SOFTWARE_DEVELOPMENT_BLUEPRINT = {
  key: 'softwareDevelopment',
  version: 1,
  buckets: [
    { key: 'planning', name: 'Discovery and planning' },
    { key: 'development', name: 'Development' },
    { key: 'validation', name: 'Validation' },
    { key: 'release', name: 'Release' },
  ],
  tasks: [
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 2,
      startOffsetDays: 0,
      title: 'Define project scope and success criteria',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 5,
      startOffsetDays: 1,
      title: 'Capture requirements and acceptance criteria',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 8,
      startOffsetDays: 4,
      title: 'Design solution architecture',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 9,
      startOffsetDays: 6,
      title: 'Plan delivery milestones',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'development',
      dueOffsetDays: 10,
      startOffsetDays: 8,
      title: 'Prepare the development environment',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'development',
      dueOffsetDays: 20,
      startOffsetDays: 9,
      title: 'Implement core functionality',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'development',
      dueOffsetDays: 23,
      startOffsetDays: 15,
      title: 'Integrate services and data',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'development',
      dueOffsetDays: 25,
      startOffsetDays: 20,
      title: 'Add telemetry and operational safeguards',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'validation',
      dueOffsetDays: 21,
      startOffsetDays: 18,
      title: 'Prepare the test plan',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'validation',
      dueOffsetDays: 28,
      startOffsetDays: 24,
      title: 'Run functional and accessibility testing',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'validation',
      dueOffsetDays: 31,
      startOffsetDays: 27,
      title: 'Resolve release blockers',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'release',
      dueOffsetDays: 32,
      startOffsetDays: 30,
      title: 'Complete the release readiness review',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'release',
      dueOffsetDays: 34,
      startOffsetDays: 33,
      title: 'Deploy the release',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'release',
      dueOffsetDays: 37,
      startOffsetDays: 34,
      title: 'Monitor the release and capture follow-up work',
    },
  ],
} as const satisfies IPlannerProjectBlueprint;

const PROJECT_MANAGEMENT_BLUEPRINT = {
  key: 'projectManagement',
  version: 1,
  buckets: [
    { key: 'initiation', name: 'Initiation' },
    { key: 'planning', name: 'Planning' },
    { key: 'execution', name: 'Execution' },
    { key: 'closeout', name: 'Closeout' },
  ],
  tasks: [
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'initiation',
      dueOffsetDays: 2,
      startOffsetDays: 0,
      title: 'Define the project objective and success criteria',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'initiation',
      dueOffsetDays: 3,
      startOffsetDays: 0,
      title: 'Identify stakeholders and project sponsor',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 5,
      startOffsetDays: 2,
      title: 'Confirm scope, deliverables, and milestones',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 7,
      startOffsetDays: 3,
      title: 'Assign roles and responsibilities',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'planning',
      dueOffsetDays: 8,
      startOffsetDays: 5,
      title: 'Create the risk and issue register',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'execution',
      dueOffsetDays: 9,
      startOffsetDays: 8,
      title: 'Run the project kickoff',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'execution',
      dueOffsetDays: 22,
      startOffsetDays: 9,
      title: 'Deliver the planned work',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'execution',
      dueOffsetDays: 16,
      startOffsetDays: 10,
      title: 'Review progress, risks, and dependencies',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'execution',
      dueOffsetDays: 23,
      startOffsetDays: 16,
      title: 'Validate completed deliverables',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'closeout',
      dueOffsetDays: 25,
      startOffsetDays: 23,
      title: 'Obtain stakeholder acceptance',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'closeout',
      dueOffsetDays: 27,
      startOffsetDays: 25,
      title: 'Complete handover and closeout',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'closeout',
      dueOffsetDays: 28,
      startOffsetDays: 27,
      title: 'Capture outcomes and lessons learned',
    },
  ],
} as const satisfies IPlannerProjectBlueprint;

const BUSINESS_PLAN_BLUEPRINT = {
  key: 'businessPlan',
  version: 1,
  buckets: [
    { key: 'summary', name: 'Executive summary' },
    { key: 'market', name: 'Market and strategy' },
    { key: 'operations', name: 'Operations' },
    { key: 'financials', name: 'Financials' },
    { key: 'review', name: 'Review' },
  ],
  tasks: [
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'summary',
      dueOffsetDays: 3,
      startOffsetDays: 0,
      title: 'Define the business vision and objectives',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'summary',
      dueOffsetDays: 5,
      startOffsetDays: 2,
      title: 'Draft the executive summary',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'market',
      dueOffsetDays: 8,
      startOffsetDays: 3,
      title: 'Research the target market and customers',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'market',
      dueOffsetDays: 10,
      startOffsetDays: 6,
      title: 'Assess competitors and market position',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'market',
      dueOffsetDays: 12,
      startOffsetDays: 9,
      title: 'Define the value proposition and go-to-market strategy',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'operations',
      dueOffsetDays: 15,
      startOffsetDays: 11,
      title: 'Document the operating model',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'operations',
      dueOffsetDays: 17,
      startOffsetDays: 13,
      title: 'Identify people, partners, and resources',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'financials',
      dueOffsetDays: 20,
      startOffsetDays: 15,
      title: 'Build the revenue and cost forecast',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'financials',
      dueOffsetDays: 22,
      startOffsetDays: 18,
      title: 'Define funding needs and key assumptions',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'review',
      dueOffsetDays: 24,
      startOffsetDays: 22,
      title: 'Review risks and mitigation plans',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'review',
      dueOffsetDays: 26,
      startOffsetDays: 24,
      title: 'Review the plan with stakeholders',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'review',
      dueOffsetDays: 28,
      startOffsetDays: 26,
      title: 'Approve and publish the business plan',
    },
  ],
} as const satisfies IPlannerProjectBlueprint;

const EMPLOYEE_ONBOARDING_BLUEPRINT = {
  key: 'employeeOnboarding',
  version: 1,
  buckets: [
    { key: 'beforeStart', name: 'Before the start date' },
    { key: 'firstDay', name: 'First day' },
    { key: 'firstWeek', name: 'First week' },
    { key: 'firstMonth', name: 'First month' },
  ],
  tasks: [
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'beforeStart',
      dueOffsetDays: 0,
      startOffsetDays: 0,
      title: 'Confirm the role, manager, and start details',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'beforeStart',
      dueOffsetDays: 1,
      startOffsetDays: 0,
      title: 'Prepare accounts, equipment, and workspace',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'beforeStart',
      dueOffsetDays: 1,
      startOffsetDays: 0,
      title: 'Share the welcome message and first-week schedule',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'firstDay',
      dueOffsetDays: 1,
      startOffsetDays: 1,
      title: 'Welcome the employee and introduce the team',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'firstDay',
      dueOffsetDays: 1,
      startOffsetDays: 1,
      title: 'Review role expectations and ways of working',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'firstDay',
      dueOffsetDays: 2,
      startOffsetDays: 1,
      title: 'Verify access to required tools and resources',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'firstWeek',
      dueOffsetDays: 5,
      startOffsetDays: 2,
      title: 'Complete required orientation and training',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'firstWeek',
      dueOffsetDays: 5,
      startOffsetDays: 2,
      title: 'Meet key partners and stakeholders',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'firstWeek',
      dueOffsetDays: 7,
      startOffsetDays: 5,
      title: 'Agree on initial goals and priorities',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'firstMonth',
      dueOffsetDays: 14,
      startOffsetDays: 7,
      title: 'Hold the two-week check-in',
    },
    {
      assignment: 'planningAndDevelopment',
      bucketKey: 'firstMonth',
      dueOffsetDays: 25,
      startOffsetDays: 14,
      title: 'Review progress against initial goals',
    },
    {
      assignment: 'unassigned',
      bucketKey: 'firstMonth',
      dueOffsetDays: 30,
      startOffsetDays: 25,
      title: 'Complete the 30-day onboarding review',
    },
  ],
} as const satisfies IPlannerProjectBlueprint;

const BLUEPRINTS: Record<PlannerProjectTemplateKey, IPlannerProjectBlueprint> = {
  basicPlan: BASIC_PLAN_BLUEPRINT,
  businessPlan: BUSINESS_PLAN_BLUEPRINT,
  employeeOnboarding: EMPLOYEE_ONBOARDING_BLUEPRINT,
  projectManagement: PROJECT_MANAGEMENT_BLUEPRINT,
  simplePlan: SIMPLE_PLAN_BLUEPRINT,
  softwareDevelopment: SOFTWARE_DEVELOPMENT_BLUEPRINT,
};

function parseIsoDate(isoDate: string): Date {
  const match = ISO_DATE_PATTERN.exec(isoDate);

  if (!match) {
    throw new Error('The project start date must use YYYY-MM-DD format.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('The project start date is not a valid calendar date.');
  }

  return date;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

export function isValidIsoDate(isoDate: string): boolean {
  try {
    parseIsoDate(isoDate);
    return true;
  } catch {
    return false;
  }
}

export function getPlannerProjectBlueprint(
  templateKey: PlannerProjectTemplateKey
): IPlannerProjectBlueprint {
  return BLUEPRINTS[templateKey];
}

export function isPlannerProjectTemplateKey(
  value: string
): value is PlannerProjectTemplateKey {
  return PLANNER_PROJECT_TEMPLATE_KEYS.some((key) => key === value);
}

export function schedulePlannerBlueprintTasks(
  blueprint: IPlannerProjectBlueprint,
  startDate: string
): IScheduledPlannerBlueprintTask[] {
  parseIsoDate(startDate);

  return blueprint.tasks.map((task) => ({
    ...task,
    dueDateTime: `${addDaysToIsoDate(
      startDate,
      task.dueOffsetDays
    )}${PLANNER_DUE_TIME}`,
    startDateTime: `${addDaysToIsoDate(
      startDate,
      task.startOffsetDays
    )}${PLANNER_START_TIME}`,
  }));
}