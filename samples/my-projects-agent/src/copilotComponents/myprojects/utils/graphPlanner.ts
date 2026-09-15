import type { MSGraphClientV3 } from '@microsoft/sp-http';

import type {
  IGraphCollectionResponse,
  IGraphPlannerAssignment,
  IGraphPlannerBucket,
  IGraphPlannerPlan,
  IGraphPlannerTask,
  IPlannerBucket,
  IPlannerPlan,
  IPlannerProjectData,
  IPlannerTask,
} from '../models';
import { fetchMicrosoft365GroupPage } from './graphPlannerGroups';

const CONCURRENT_GROUP_REQUESTS = 4;
const CONCURRENT_PLAN_REQUESTS = 4;

async function getCollection<T>(
  graphClient: MSGraphClientV3,
  initialPath: string
): Promise<T[]> {
  const items: T[] = [];
  let requestPath: string | undefined = initialPath;

  while (requestPath) {
    const response: IGraphCollectionResponse<T> = await graphClient
      .api(requestPath)
      .get();

    items.push(...(response.value ?? []));
    requestPath = response['@odata.nextLink'];
  }

  return items;
}

function getContainerIdFromUrl(
  containerUrl: string | undefined
): string | undefined {
  if (!containerUrl) {
    return undefined;
  }

  try {
    const pathParts = new URL(containerUrl).pathname
      .split('/')
      .filter((pathPart) => pathPart.length > 0);
    const groupsIndex = pathParts.findIndex(
      (pathPart) => pathPart.toLocaleLowerCase() === 'groups'
    );
    const encodedContainerId = pathParts[groupsIndex + 1];

    return groupsIndex >= 0 && encodedContainerId
      ? decodeURIComponent(encodedContainerId)
      : undefined;
  } catch {
    return undefined;
  }
}

export function toPlannerPlan(
  plan: IGraphPlannerPlan
): IPlannerPlan | undefined {
  const owner =
    plan.container?.containerId?.trim() ||
    getContainerIdFromUrl(plan.container?.url) ||
    plan.owner?.trim();

  if (!plan.id || !owner || !plan.title) {
    return undefined;
  }

  return {
    createdDateTime: plan.createdDateTime,
    id: plan.id,
    owner,
    title: plan.title,
  };
}

async function fetchMemberGroupPlans(
  graphClient: MSGraphClientV3
): Promise<IGraphPlannerPlan[]> {
  const groupIds: string[] = [];
  let nextLink: string | undefined;

  try {
    do {
      const page = await fetchMicrosoft365GroupPage(
        graphClient,
        '',
        nextLink
      );
      groupIds.push(...page.groups.map((group) => group.id));
      nextLink = page.nextLink;
    } while (nextLink);
  } catch {
    return [];
  }

  const plans: IGraphPlannerPlan[] = [];

  for (
    let index = 0;
    index < groupIds.length;
    index += CONCURRENT_GROUP_REQUESTS
  ) {
    const groupPage = groupIds.slice(
      index,
      index + CONCURRENT_GROUP_REQUESTS
    );
    const planPages = await Promise.all(
      groupPage.map(async (groupId): Promise<IGraphPlannerPlan[]> => {
        try {
          return await getCollection<IGraphPlannerPlan>(
            graphClient,
            `/groups/${encodeURIComponent(groupId)}/planner/plans`
          );
        } catch {
          return [];
        }
      })
    );

    planPages.forEach((planPage) => plans.push(...planPage));
  }

  return plans;
}

function toPlannerTask(
  task: IGraphPlannerTask,
  currentUserId: string | undefined
): IPlannerTask | undefined {
  if (!task.id || !task.planId || !task.bucketId || !task.title) {
    return undefined;
  }

  const assignments: Record<string, IGraphPlannerAssignment> =
    task.assignments ?? {};
  const assigneeIds = Object.keys(assignments);

  return {
    assignedToCurrentUser: Boolean(
      currentUserId &&
        assigneeIds.some(
          (assigneeId) =>
            assigneeId.toLocaleLowerCase() === currentUserId.toLocaleLowerCase()
        )
    ),
    assignmentDateTimes: assigneeIds
      .map((assigneeId) => assignments[assigneeId].assignedDateTime)
      .filter((value): value is string => value !== undefined),
    bucketId: task.bucketId,
    completedDateTime: task.completedDateTime,
    createdDateTime: task.createdDateTime,
    dueDateTime: task.dueDateTime,
    id: task.id,
    percentComplete: task.percentComplete ?? 0,
    planId: task.planId,
    startDateTime: task.startDateTime,
    title: task.title,
  };
}

function toPlannerBucket(
  bucket: IGraphPlannerBucket
): IPlannerBucket | undefined {
  if (!bucket.id || !bucket.planId || !bucket.name) {
    return undefined;
  }

  return {
    id: bucket.id,
    name: bucket.name,
    planId: bucket.planId,
  };
}

async function fetchProjectData(
  graphClient: MSGraphClientV3,
  plan: IPlannerPlan,
  currentUserId: string | undefined
): Promise<IPlannerProjectData> {
  const [tasks, buckets] = await Promise.all([
    getCollection<IGraphPlannerTask>(
      graphClient,
      `/planner/plans/${plan.id}/tasks`
    ),
    getCollection<IGraphPlannerBucket>(
      graphClient,
      `/planner/plans/${plan.id}/buckets`
    ),
  ]);

  return {
    plan,
    tasks: tasks
      .map((task) => toPlannerTask(task, currentUserId))
      .filter((task): task is IPlannerTask => task !== undefined),
    buckets: buckets
      .map(toPlannerBucket)
      .filter((bucket): bucket is IPlannerBucket => bucket !== undefined),
  };
}

export async function fetchPlannerProjects(
  graphClient: MSGraphClientV3,
  currentUserId?: string
): Promise<IPlannerProjectData[]> {
  const [userPlans, memberGroupPlans] = await Promise.all([
    getCollection<IGraphPlannerPlan>(graphClient, '/me/planner/plans'),
    fetchMemberGroupPlans(graphClient),
  ]);
  const plansById = new Map<string, IPlannerPlan>();

  userPlans.concat(memberGroupPlans).forEach((graphPlan) => {
    const plan = toPlannerPlan(graphPlan);

    if (plan && !plansById.has(plan.id)) {
      plansById.set(plan.id, plan);
    }
  });

  const plans = Array.from(plansById.values());
  const projects: IPlannerProjectData[] = [];

  for (let index = 0; index < plans.length; index += CONCURRENT_PLAN_REQUESTS) {
    const page = plans.slice(index, index + CONCURRENT_PLAN_REQUESTS);
    projects.push(
      ...(await Promise.all(
        page.map((plan) =>
          fetchProjectData(graphClient, plan, currentUserId)
        )
      ))
    );
  }

  return projects;
}
