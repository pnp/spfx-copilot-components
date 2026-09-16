const PLANNER_WEB_ROOT = 'https://planner.cloud.microsoft/webui/plan';

export function getPlannerPlanUrl(planId: string): string {
  return `${PLANNER_WEB_ROOT}/${encodeURIComponent(planId)}/view/board`;
}