import * as React from 'react';
import type { MSGraphClientFactory } from '@microsoft/sp-http';

import type {
  IMicrosoft365Group,
  IMicrosoft365GroupsState,
  IUseMicrosoft365GroupsResult,
} from '../models';
import { fetchMicrosoft365GroupPage } from '../utils/graphPlannerGroups';

const GRAPH_CLIENT_VERSION = '3';
const DEFAULT_GROUP_ERROR = 'Unable to load Microsoft 365 groups.';

const INITIAL_STATE: IMicrosoft365GroupsState = {
  groups: [],
  hasLoaded: false,
  isLoading: false,
  isLoadingMore: false,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : DEFAULT_GROUP_ERROR;
}

function appendUniqueGroups(
  currentGroups: IMicrosoft365Group[],
  nextGroups: IMicrosoft365Group[]
): IMicrosoft365Group[] {
  const groupsById = new Map(
    currentGroups.map((group) => [group.id, group] as const)
  );

  nextGroups.forEach((group) => groupsById.set(group.id, group));
  return Array.from(groupsById.values());
}

export function useMicrosoft365Groups(
  graphClientFactory: MSGraphClientFactory
): IUseMicrosoft365GroupsResult {
  const [state, setState] = React.useState(INITIAL_STATE);
  const currentSearchRef = React.useRef('');
  const hasRequestedFirstPageRef = React.useRef(false);
  const isLoadingMoreRef = React.useRef(false);
  const requestVersionRef = React.useRef(0);
  const disposedRef = React.useRef(false);

  React.useEffect(() => {
    disposedRef.current = false;

    return () => {
      disposedRef.current = true;
      requestVersionRef.current += 1;
    };
  }, []);

  const loadFirstPage = React.useCallback(
    async (searchValue: string): Promise<void> => {
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;
      hasRequestedFirstPageRef.current = true;
      isLoadingMoreRef.current = false;
      setState({
        groups: [],
        hasLoaded: false,
        isLoading: true,
        isLoadingMore: false,
      });

      try {
        const graphClient = await graphClientFactory.getClient(
          GRAPH_CLIENT_VERSION
        );
        const page = await fetchMicrosoft365GroupPage(
          graphClient,
          searchValue
        );

        if (
          disposedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setState({
          groups: page.groups,
          hasLoaded: true,
          isLoading: false,
          isLoadingMore: false,
          nextLink: page.nextLink,
        });
      } catch (error) {
        if (
          disposedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        hasRequestedFirstPageRef.current = false;
        setState({
          error: getErrorMessage(error),
          groups: [],
          hasLoaded: true,
          isLoading: false,
          isLoadingMore: false,
        });
      }
    },
    [graphClientFactory]
  );

  const ensureFirstPage = React.useCallback((): void => {
    if (!hasRequestedFirstPageRef.current) {
      loadFirstPage(currentSearchRef.current).catch(
        (): undefined => undefined
      );
    }
  }, [loadFirstPage]);

  const search = React.useCallback(
    (searchValue: string): void => {
      currentSearchRef.current = searchValue;
      loadFirstPage(searchValue).catch((): undefined => undefined);
    },
    [loadFirstPage]
  );

  const loadMore = React.useCallback((): void => {
    if (!state.nextLink || isLoadingMoreRef.current) {
      return;
    }

    const requestVersion = requestVersionRef.current;
    const nextLink = state.nextLink;
    isLoadingMoreRef.current = true;
    setState((currentState) => ({
      ...currentState,
      error: undefined,
      isLoadingMore: true,
    }));

    const loadNextPage = async (): Promise<void> => {
      try {
        const graphClient = await graphClientFactory.getClient(
          GRAPH_CLIENT_VERSION
        );
        const page = await fetchMicrosoft365GroupPage(
          graphClient,
          currentSearchRef.current,
          nextLink
        );

        if (
          disposedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          groups: appendUniqueGroups(currentState.groups, page.groups),
          isLoadingMore: false,
          nextLink: page.nextLink,
        }));
      } catch (error) {
        if (
          disposedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: getErrorMessage(error),
          isLoadingMore: false,
        }));
      } finally {
        isLoadingMoreRef.current = false;
      }
    };

    loadNextPage().catch((): undefined => undefined);
  }, [graphClientFactory, state.nextLink]);

  const retry = React.useCallback((): void => {
    loadFirstPage(currentSearchRef.current).catch(
      (): undefined => undefined
    );
  }, [loadFirstPage]);

  return {
    ...state,
    ensureFirstPage,
    loadMore,
    retry,
    search,
  };
}