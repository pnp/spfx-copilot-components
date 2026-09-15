import type { MSGraphClientV3 } from '@microsoft/sp-http';

import type {
  ICreatePlannerProjectRequest,
  IGraphCollectionResponse,
  IGraphPlannerBucket,
  IGraphPlannerPlan,
  IGraphPlannerTask,
  IPlannerProjectCreationResult,
} from '../models';
import {
  isValidIsoDate,
  schedulePlannerBlueprintTasks,
} from './plannerBlueprints';

import { getPlannerPlanUrl } from './plannerLinks';

const PLANNER_ORDER_HINT = ' !';
const DEFAULT_CREATION_ERROR = 'Planner could not complete the request.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_CREATION_ERROR;
}

async function fetchAll<T>(
  graphClient: MSGraphClientV3,
  initialRequestPath: string
): Promise<T[]> {
  const items: T[] = [];
  let requestPath: string | undefined = initialRequestPath;

  while (requestPath) {
    const response: IGraphCollectionResponse<T> = await graphClient
      .api(requestPath)
      .get();
    items.push(...(response.value ?? []));
    requestPath = response['@odata.nextLink'];
  }

  return items;
}

async function findPlanByTitle(
  graphClient: MSGraphClientV3,
  groupId: string,
  projectName: string
): Promise<IGraphPlannerPlan | undefined> {
  const normalizedTitle = projectName.trim().toLocaleLowerCase();
  const plans = await fetchAll<IGraphPlannerPlan>(
    graphClient,
    `/groups/${encodeURIComponent(groupId)}/planner/plans`
  );

  return plans.find(
    (plan) => plan.title?.trim().toLocaleLowerCase() === normalizedTitle
  );
}

async function resolveTargetPlan(
  graphClient: MSGraphClientV3,
  request: ICreatePlannerProjectRequest,
  projectName: string
): Promise<
  | { plan: IGraphPlannerPlan; status: 'create' | 'resume' }
  | { plan: IGraphPlannerPlan; status: 'alreadyExists' }
> {
  if (request.resumePlanId) {
    const plan: IGraphPlannerPlan = await graphClient
      .api(`/planner/plans/${encodeURIComponent(request.resumePlanId)}`)
      .get();

    if (!plan.id) {
      throw new Error('The partial Planner project could not be reopened.');
    }

    if (
      plan.title?.trim().toLocaleLowerCase() !==
        projectName.toLocaleLowerCase() ||
      (plan.owner && plan.owner !== request.groupId)
    ) {
      throw new Error('The partial Planner project no longer matches this draft.');
    }

    return { plan, status: 'resume' };
  }

  const existingPlan = await findPlanByTitle(
    graphClient,
    request.groupId,
    projectName
  );

  if (existingPlan?.id) {
    return { plan: existingPlan, status: 'alreadyExists' };
  }

  const plan: IGraphPlannerPlan = await graphClient.api('/planner/plans').post({
    container: {
      url: `https://graph.microsoft.com/v1.0/groups/${encodeURIComponent(
        request.groupId
      )}`,
    },
    title: projectName,
  });

  if (!plan.id) {
    throw new Error('Planner created no plan identifier.');
  }

  return { plan, status: 'create' };
}

export async function createPlannerProject(
  graphClient: MSGraphClientV3,
  request: ICreatePlannerProjectRequest
): Promise<IPlannerProjectCreationResult> {
  const projectName = request.projectName.trim();

  if (!projectName) {
    throw new Error('Enter a project name before creating the project.');
  }

  if (!isValidIsoDate(request.startDate)) {
    throw new Error('Select a valid project start date.');
  }

  if (
    request.assignPlanningAndDevelopmentToMe &&
    !request.currentUserId
  ) {
    throw new Error('The signed-in user could not be resolved for assignment.');
  }

  const target = await resolveTargetPlan(graphClient, request, projectName);

  if (target.status === 'alreadyExists' && target.plan.id) {
    return {
      createdBucketCount: 0,
      createdTaskCount: 0,
      planId: target.plan.id,
      plannerUrl: getPlannerPlanUrl(target.plan.id),
      status: 'alreadyExists',
      totalBucketCount: request.blueprint.buckets.length,
      totalTaskCount: request.blueprint.tasks.length,
    };
  }

  const planId = target.plan.id;
  if (!planId) {
    throw new Error('Planner returned no plan identifier.');
  }

  const plannerUrl = getPlannerPlanUrl(planId);
  const bucketIds = new Map<string, string>();
  let createdBucketCount = 0;
  let createdTaskCount = 0;

  try {
    const existingBuckets =
      target.status === 'resume'
        ? await fetchAll<IGraphPlannerBucket>(
            graphClient,
            `/planner/plans/${encodeURIComponent(planId)}/buckets`
          )
        : [];

    for (const bucket of request.blueprint.buckets) {
      const existingBucket = existingBuckets.find(
        (candidate) =>
          candidate.id &&
          candidate.name?.trim().toLocaleLowerCase() ===
            bucket.name.toLocaleLowerCase()
      );

      if (existingBucket?.id) {
        bucketIds.set(bucket.key, existingBucket.id);
        createdBucketCount += 1;
        continue;
      }

      const createdBucket: IGraphPlannerBucket = await graphClient
        .api('/planner/buckets')
        .post({
          name: bucket.name,
          orderHint: PLANNER_ORDER_HINT,
          planId,
        });

      if (!createdBucket.id) {
        throw new Error(`Planner created no identifier for ${bucket.name}.`);
      }

      bucketIds.set(bucket.key, createdBucket.id);
      createdBucketCount += 1;
    }

    const scheduledTasks = schedulePlannerBlueprintTasks(
      request.blueprint,
      request.startDate
    );
    const existingTasks =
      target.status === 'resume'
        ? await fetchAll<IGraphPlannerTask>(
            graphClient,
            `/planner/plans/${encodeURIComponent(planId)}/tasks`
          )
        : [];

    for (const task of scheduledTasks) {
      const bucketId = bucketIds.get(task.bucketKey);

      if (!bucketId) {
        throw new Error(`No Planner bucket was created for ${task.bucketKey}.`);
      }

      const existingTask = existingTasks.find(
        (candidate) =>
          candidate.id &&
          candidate.bucketId === bucketId &&
          candidate.title?.trim().toLocaleLowerCase() ===
            task.title.toLocaleLowerCase()
      );

      if (existingTask) {
        createdTaskCount += 1;
        continue;
      }

      const shouldAssign =
        request.assignPlanningAndDevelopmentToMe &&
        task.assignment === 'planningAndDevelopment' &&
        request.currentUserId;
      const assignments = shouldAssign
        ? {
            [shouldAssign]: {
              '@odata.type': '#microsoft.graph.plannerAssignment',
              orderHint: PLANNER_ORDER_HINT,
            },
          }
        : undefined;

      await graphClient.api('/planner/tasks').post({
        ...(assignments ? { assignments } : {}),
        bucketId,
        dueDateTime: task.dueDateTime,
        planId,
        startDateTime: task.startDateTime,
        title: task.title,
      });
      createdTaskCount += 1;
    }
  } catch (error) {
    return {
      createdBucketCount,
      createdTaskCount,
      error: getErrorMessage(error),
      planId,
      plannerUrl,
      status: 'partial',
      totalBucketCount: request.blueprint.buckets.length,
      totalTaskCount: request.blueprint.tasks.length,
    };
  }

  return {
    createdBucketCount,
    createdTaskCount,
    planId,
    plannerUrl,
    status: 'created',
    totalBucketCount: request.blueprint.buckets.length,
    totalTaskCount: request.blueprint.tasks.length,
  };
}