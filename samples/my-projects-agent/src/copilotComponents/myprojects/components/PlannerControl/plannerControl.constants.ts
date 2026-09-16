import { PLANNER_VIEW_MODE_PROPERTY_KEY } from '../../utils/plannerComponent';
import type { IPlannerProjectSummary } from '../../models';

export const PLANNER_BOARD_VIEW_MODE = 'board';
export const PLANNER_CONFIGURATION_VIEW_MODE = 'config';

export function createPlannerControlProperties(
  project: IPlannerProjectSummary
): Record<string, unknown> {
  return {
    planId: project.id,
    groupPlans: [
      {
        id: project.id,
        owner: project.owner,
        title: project.title,
      },
    ],
    isFullScreen: false,
    [PLANNER_VIEW_MODE_PROPERTY_KEY]: PLANNER_CONFIGURATION_VIEW_MODE,
    plannerViewMode: PLANNER_BOARD_VIEW_MODE,
  };
}