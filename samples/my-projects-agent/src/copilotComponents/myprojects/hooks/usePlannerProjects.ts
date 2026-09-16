import * as React from 'react';
import type { MSGraphClientFactory } from '@microsoft/sp-http';

import type {
  IMyprojectsCopilotComponentProperties,
  IPlannerProjectsState,
  IUsePlannerProjectsResult,
} from '../models';
import { fetchPlannerProjects } from '../utils/graphPlanner';
import {
  filterPlannerProjects,
  summarizePlannerProject,
} from '../utils/plannerProjects';

const GRAPH_CLIENT_VERSION = '3';
const DEFAULT_ERROR_MESSAGE = 'Unable to load Planner projects.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
}

export function usePlannerProjects(
  graphClientFactory: MSGraphClientFactory,
  properties: IMyprojectsCopilotComponentProperties,
  currentUserId?: string
): IUsePlannerProjectsResult {
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [state, setState] = React.useState<IPlannerProjectsState>({
    isLoading: true,
    projects: [],
  });

  React.useEffect(() => {
    let disposed = false;

    setState({ isLoading: true, projects: [] });

    const loadProjects = async (): Promise<void> => {
      try {
        const graphClient = await graphClientFactory.getClient(
          GRAPH_CLIENT_VERSION
        );
        const projectData = await fetchPlannerProjects(
          graphClient,
          currentUserId
        );

        if (disposed) {
          return;
        }

        setState({
          isLoading: false,
          projects: projectData.map((project) =>
            summarizePlannerProject(project)
          ),
        });
      } catch (error) {
        if (disposed) {
          return;
        }

        console.error('[usePlannerProjects] Failed to load projects:', error);
        setState({
          error: getErrorMessage(error),
          isLoading: false,
          projects: [],
        });
      }
    };

    loadProjects().catch((): undefined => undefined);

    return () => {
      disposed = true;
    };
  }, [currentUserId, graphClientFactory, refreshToken]);

  const projects = React.useMemo(
    () => filterPlannerProjects(state.projects, properties),
    [properties, state.projects]
  );
  const refresh = React.useCallback((): void => {
    setRefreshToken((currentToken) => currentToken + 1);
  }, []);

  return {
    ...state,
    hasAnyProjects: state.projects.length > 0,
    projects,
    refresh,
  };
}
