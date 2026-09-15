import * as React from 'react';
import type { MSGraphClientFactory } from '@microsoft/sp-http';

import type {
  ICreatePlannerProjectRequest,
  IPlannerProjectCreationResult,
  IUsePlannerProjectCreationResult,
} from '../models';
import { createPlannerProject } from '../utils/plannerProjectCreation';

const GRAPH_CLIENT_VERSION = '3';
const DEFAULT_CREATION_ERROR = 'Unable to create the Planner project.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_CREATION_ERROR;
}

export function usePlannerProjectCreation(
  graphClientFactory: MSGraphClientFactory
): IUsePlannerProjectCreationResult {
  const [error, setError] = React.useState<string>();
  const [isCreating, setIsCreating] = React.useState(false);
  const [result, setResult] =
    React.useState<IPlannerProjectCreationResult>();

  const createProject = React.useCallback(
    async (
      request: ICreatePlannerProjectRequest
    ): Promise<IPlannerProjectCreationResult | undefined> => {
      setError(undefined);
      setIsCreating(true);

      try {
        const graphClient = await graphClientFactory.getClient(
          GRAPH_CLIENT_VERSION
        );
        const creationResult = await createPlannerProject(
          graphClient,
          request
        );
        setResult(creationResult);
        return creationResult;
      } catch (creationError) {
        setError(getErrorMessage(creationError));
        return undefined;
      } finally {
        setIsCreating(false);
      }
    },
    [graphClientFactory]
  );

  return {
    createProject,
    error,
    isCreating,
    result,
  };
}