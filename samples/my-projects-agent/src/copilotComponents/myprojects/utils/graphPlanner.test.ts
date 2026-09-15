import type { MSGraphClientV3 } from '@microsoft/sp-http';

import { fetchPlannerProjects, toPlannerPlan } from './graphPlanner';

class GraphRequestStub {
  public constructor(
    private readonly requestPath: string,
    private readonly resolveResponse: (requestPath: string) => unknown
  ) {}

  public async get(): Promise<unknown> {
    return this.resolveResponse(this.requestPath);
  }

  public header(): GraphRequestStub {
    return this;
  }
}

function createGraphClient(
  resolveResponse: (requestPath: string) => unknown
): MSGraphClientV3 {
  const graphClient = {
    api: jest.fn(
      (requestPath: string) =>
        new GraphRequestStub(requestPath, resolveResponse)
    ),
  };

  // The Graph SDK client has a much broader surface than this request stub.
  return graphClient as unknown as MSGraphClientV3;
}

describe('toPlannerPlan', () => {
  it('maps a modern Planner group container without the deprecated owner', () => {
    expect(
      toPlannerPlan({
        container: {
          containerId: 'group-1',
          type: 'group',
        },
        createdDateTime: '2026-09-04T12:00:00Z',
        id: 'plan-1',
        title: 'New project',
      })
    ).toEqual({
      createdDateTime: '2026-09-04T12:00:00Z',
      id: 'plan-1',
      owner: 'group-1',
      title: 'New project',
    });
  });

  it('resolves the group identifier from a canonical container URL', () => {
    expect(
      toPlannerPlan({
        container: {
          type: 'group',
          url: 'https://graph.microsoft.com/v1.0/groups/group-2',
        },
        id: 'plan-2',
        title: 'URL container project',
      })?.owner
    ).toBe('group-2');
  });

  it('merges and deduplicates plans from the user and member groups', async () => {
    const graphClient = createGraphClient((requestPath) => {
      if (requestPath === '/me/planner/plans') {
        return {
          value: [
            { id: 'plan-1', owner: 'group-1', title: 'First project' },
            { id: 'plan-2', owner: 'group-1', title: 'Second project' },
          ],
        };
      }

      if (requestPath.indexOf('/me/memberOf/microsoft.graph.group?') === 0) {
        return {
          value: [
            {
              displayName: 'SPTECK',
              groupTypes: ['Unified'],
              id: 'group-1',
            },
          ],
        };
      }

      if (requestPath === '/groups/group-1/planner/plans') {
        return {
          value: [
            { id: 'plan-1', owner: 'group-1', title: 'First project' },
            {
              container: { containerId: 'group-1', type: 'group' },
              id: 'plan-3',
              title: 'Mega-Menu',
            },
          ],
        };
      }

      return { value: [] };
    });

    const projects = await fetchPlannerProjects(graphClient, 'user-1');

    expect(projects.map((project) => project.plan.id)).toEqual([
      'plan-1',
      'plan-2',
      'plan-3',
    ]);
    expect(graphClient.api).toHaveBeenCalledWith(
      '/groups/group-1/planner/plans'
    );
  });
});