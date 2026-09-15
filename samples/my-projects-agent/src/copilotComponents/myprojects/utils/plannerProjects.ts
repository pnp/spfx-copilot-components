import type {
  IMyprojectsCopilotComponentProperties,
  IPlannerDateBounds,
  IPlannerProjectData,
  IPlannerProjectSummary,
  IPlannerTask,
} from '../models';

const URGENT_WINDOW_DAYS = 7;
const DAYS_PER_WEEK = 7;
const DAYS_PER_ROLLING_MONTH = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ON_HOLD_BUCKET_NAMES = new Set([
  'blocked',
  'hold',
  'in hold',
  'on hold',
]);

function normalizeBucketName(name: string): string {
  return name.trim().toLocaleLowerCase().replace(/[\s_-]+/g, ' ');
}

function parseDate(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function isIncomplete(task: IPlannerTask): boolean {
  return task.percentComplete < 100;
}

function isOnHold(
  task: IPlannerTask,
  bucketNamesById: ReadonlyMap<string, string>
): boolean {
  const bucketName = bucketNamesById.get(task.bucketId);

  return Boolean(
    isIncomplete(task) &&
      bucketName &&
      ON_HOLD_BUCKET_NAMES.has(normalizeBucketName(bucketName))
  );
}

function isUrgent(task: IPlannerTask, now: number): boolean {
  const dueDate = parseDate(task.dueDateTime);
  const urgentThrough = now + URGENT_WINDOW_DAYS * MILLISECONDS_PER_DAY;

  return Boolean(isIncomplete(task) && dueDate !== undefined && dueDate <= urgentThrough);
}

function getLastActivityDateTime(
  project: IPlannerProjectData
): string | undefined {
  const activityDateTimes: (string | undefined)[] = [
    project.plan.createdDateTime,
  ];
  project.tasks.forEach((task) => {
    activityDateTimes.push(
      task.createdDateTime,
      task.completedDateTime,
      ...task.assignmentDateTimes
    );
  });

  const latestTimestamp = activityDateTimes.reduce<number | undefined>(
    (latest, value) => {
      const timestamp = parseDate(value);

      return timestamp !== undefined &&
        (latest === undefined || timestamp > latest)
        ? timestamp
        : latest;
    },
    undefined
  );

  return latestTimestamp === undefined
    ? undefined
    : new Date(latestTimestamp).toISOString();
}

export function summarizePlannerProject(
  project: IPlannerProjectData,
  now: number = Date.now()
): IPlannerProjectSummary {
  const bucketNamesById = new Map(
    project.buckets.map((bucket) => [bucket.id, bucket.name])
  );
  const activeTasks = project.tasks.filter(isIncomplete);
  const completedTasks = project.tasks.length - activeTasks.length;
  const assignedToMeTasks = project.tasks.filter(
    (task) => task.assignedToCurrentUser
  ).length;
  const urgentTasks = activeTasks.filter((task) => isUrgent(task, now)).length;
  const overdueTasks = activeTasks.filter((task) => {
    const dueDate = parseDate(task.dueDateTime);
    return dueDate !== undefined && dueDate < now;
  }).length;
  const onHoldTaskIds = activeTasks
    .filter((task) => isOnHold(task, bucketNamesById))
    .map((task) => task.id);
  const nextDueTimestamp = activeTasks.reduce<number | undefined>(
    (nearest, task) => {
      const dueDate = parseDate(task.dueDateTime);

      if (dueDate === undefined || dueDate < now) {
        return nearest;
      }

      return nearest === undefined || dueDate < nearest ? dueDate : nearest;
    },
    undefined
  );

  return {
    ...project.plan,
    activeTasks: activeTasks.length,
    assignedToMeTasks,
    completedTasks,
    lastActivityDateTime: getLastActivityDateTime(project),
    nextDueDate:
      nextDueTimestamp === undefined
        ? undefined
        : new Date(nextDueTimestamp).toISOString(),
    onHoldTaskIds,
    onHoldTasks: onHoldTaskIds.length,
    overdueTasks,
    tasks: project.tasks,
    totalTasks: project.tasks.length,
    urgentTasks,
  };
}

function matchesProjectName(
  project: IPlannerProjectSummary,
  projectName: string | undefined
): boolean {
  const normalizedProjectName = projectName?.trim().toLocaleLowerCase();

  return !normalizedProjectName ||
    project.title.toLocaleLowerCase().includes(normalizedProjectName);
}

function addDays(date: Date, days: number): number {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.getTime();
}

function getStartOfDay(timestamp: number): Date {
  const result = new Date(timestamp);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getStartOfWeek(timestamp: number): Date {
  const result = getStartOfDay(timestamp);
  const daysSinceMonday = (result.getDay() + 6) % DAYS_PER_WEEK;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

function parseCalendarDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

function resolveDateBounds(
  properties: IMyprojectsCopilotComponentProperties,
  now: number
): IPlannerDateBounds | undefined {
  const range =
    properties.dateRange ??
    (properties.fromDate || properties.toDate ? 'custom' : undefined);
  const today = getStartOfDay(now);

  switch (range) {
    case 'today':
      return { start: today.getTime(), endExclusive: addDays(today, 1) };
    case 'last7Days':
      return {
        start: addDays(today, -(DAYS_PER_WEEK - 1)),
        endExclusive: addDays(today, 1),
      };
    case 'last30Days':
      return {
        start: addDays(today, -(DAYS_PER_ROLLING_MONTH - 1)),
        endExclusive: addDays(today, 1),
      };
    case 'thisWeek': {
      const start = getStartOfWeek(now);
      return {
        start: start.getTime(),
        endExclusive: addDays(start, DAYS_PER_WEEK),
      };
    }
    case 'lastWeek': {
      const thisWeek = getStartOfWeek(now);
      return {
        start: addDays(thisWeek, -DAYS_PER_WEEK),
        endExclusive: thisWeek.getTime(),
      };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { start: start.getTime(), endExclusive: end.getTime() };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: start.getTime(), endExclusive: end.getTime() };
    }
    case 'custom': {
      const fromDate = parseCalendarDate(properties.fromDate);
      const toDate = parseCalendarDate(properties.toDate);

      if (!fromDate && !toDate) {
        return undefined;
      }

      return {
        start: fromDate?.getTime() ?? Number.NEGATIVE_INFINITY,
        endExclusive: toDate
          ? addDays(toDate, 1)
          : Number.POSITIVE_INFINITY,
      };
    }
    default:
      return undefined;
  }
}

function isDateInBounds(
  value: string | undefined,
  bounds: IPlannerDateBounds
): boolean {
  const timestamp = parseDate(value);

  return Boolean(
    timestamp !== undefined &&
      timestamp >= bounds.start &&
      timestamp < bounds.endExclusive
  );
}

function hasTaskActivityInBounds(
  task: IPlannerTask,
  bounds: IPlannerDateBounds
): boolean {
  return (
    isDateInBounds(task.createdDateTime, bounds) ||
    isDateInBounds(task.completedDateTime, bounds) ||
    task.assignmentDateTimes.some((value) => isDateInBounds(value, bounds))
  );
}

function matchesTaskView(
  project: IPlannerProjectSummary,
  task: IPlannerTask,
  view: IMyprojectsCopilotComponentProperties['view'],
  now: number
): boolean {
  switch (view) {
    case 'active':
      return isIncomplete(task);
    case 'urgent':
      return isUrgent(task, now);
    case 'overdue': {
      const dueDate = parseDate(task.dueDateTime);
      return Boolean(
        isIncomplete(task) && dueDate !== undefined && dueDate < now
      );
    }
    case 'onHold':
      return project.onHoldTaskIds.indexOf(task.id) >= 0;
    default:
      return true;
  }
}

function matchesTaskFilters(
  project: IPlannerProjectSummary,
  task: IPlannerTask,
  properties: IMyprojectsCopilotComponentProperties,
  bounds: IPlannerDateBounds | undefined,
  now: number
): boolean {
  if (!matchesTaskView(project, task, properties.view, now)) {
    return false;
  }

  if (properties.assignedToMe && !task.assignedToCurrentUser) {
    return false;
  }

  if (!bounds || properties.dateField === 'created') {
    return true;
  }

  return properties.dateField === 'due'
    ? isDateInBounds(task.dueDateTime, bounds)
    : hasTaskActivityInBounds(task, bounds);
}

function matchesProjectFilters(
  project: IPlannerProjectSummary,
  properties: IMyprojectsCopilotComponentProperties,
  bounds: IPlannerDateBounds | undefined,
  now: number
): boolean {
  if (!matchesProjectName(project, properties.projectName)) {
    return false;
  }

  if (
    bounds &&
    properties.dateField === 'created' &&
    !isDateInBounds(project.createdDateTime, bounds)
  ) {
    return false;
  }

  const hasStatusFilter = properties.view !== 'all';
  const hasTaskDateFilter = Boolean(
    bounds && properties.dateField !== 'created'
  );
  const hasTaskFilter = Boolean(
    hasStatusFilter || properties.assignedToMe || hasTaskDateFilter
  );

  if (!hasTaskFilter) {
    return true;
  }

  if (
    bounds &&
    properties.dateField !== 'due' &&
    !hasStatusFilter &&
    !properties.assignedToMe &&
    isDateInBounds(project.createdDateTime, bounds)
  ) {
    return true;
  }

  return project.tasks.some((task) =>
    matchesTaskFilters(project, task, properties, bounds, now)
  );
}

function compareDescendingDates(
  left: string | undefined,
  right: string | undefined
): number {
  return (parseDate(right) ?? Number.NEGATIVE_INFINITY) -
    (parseDate(left) ?? Number.NEGATIVE_INFINITY);
}

function compareAscendingDates(
  left: string | undefined,
  right: string | undefined
): number {
  return (parseDate(left) ?? Number.POSITIVE_INFINITY) -
    (parseDate(right) ?? Number.POSITIVE_INFINITY);
}

function sortPlannerProjects(
  projects: IPlannerProjectSummary[],
  properties: IMyprojectsCopilotComponentProperties
): IPlannerProjectSummary[] {
  return projects.sort((left, right) => {
    switch (properties.sortBy) {
      case 'recentActivity':
        return (
          compareDescendingDates(
            left.lastActivityDateTime,
            right.lastActivityDateTime
          ) || left.title.localeCompare(right.title)
        );
      case 'createdDate':
        return (
          compareDescendingDates(left.createdDateTime, right.createdDateTime) ||
          left.title.localeCompare(right.title)
        );
      case 'nextDueDate':
        return (
          compareAscendingDates(left.nextDueDate, right.nextDueDate) ||
          left.title.localeCompare(right.title)
        );
      case 'title':
        return left.title.localeCompare(right.title);
      default:
        break;
    }

    switch (properties.view) {
      case 'active':
        return (
          right.activeTasks - left.activeTasks ||
          left.title.localeCompare(right.title)
        );
      case 'urgent':
      case 'overdue':
        return (
          right.overdueTasks - left.overdueTasks ||
          right.urgentTasks - left.urgentTasks ||
          left.title.localeCompare(right.title)
        );
      case 'onHold':
        return (
          right.onHoldTasks - left.onHoldTasks ||
          left.title.localeCompare(right.title)
        );
      default:
        return properties.assignedToMe
          ? right.assignedToMeTasks - left.assignedToMeTasks ||
              left.title.localeCompare(right.title)
          : left.title.localeCompare(right.title);
    }
  });
}

export function filterPlannerProjects(
  projects: IPlannerProjectSummary[],
  properties: IMyprojectsCopilotComponentProperties,
  now: number = Date.now()
): IPlannerProjectSummary[] {
  const bounds = resolveDateBounds(properties, now);
  const matchingProjects = sortPlannerProjects(
    projects.filter((project) =>
      matchesProjectFilters(project, properties, bounds, now)
    ),
    properties
  );
  const maxResults =
    properties.maxResults === undefined ||
    !Number.isFinite(properties.maxResults)
      ? undefined
      : Math.min(50, Math.max(1, Math.floor(properties.maxResults)));

  return maxResults === undefined
    ? matchingProjects
    : matchingProjects.slice(0, maxResults);
}
