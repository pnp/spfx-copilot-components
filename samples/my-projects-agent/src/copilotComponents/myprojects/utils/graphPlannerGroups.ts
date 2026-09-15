import type { MSGraphClientV3 } from '@microsoft/sp-http';

import type {
  IGraphCollectionResponse,
  IGraphMicrosoft365Group,
  IMicrosoft365Group,
  IMicrosoft365GroupPage,
} from '../models';

const GROUP_PAGE_SIZE = 20;
const M365_GROUP_TYPE = 'Unified';
const GROUP_SELECT = 'id,displayName,description,mail,groupTypes';

function escapeSearchValue(searchValue: string): string {
  return searchValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildInitialRequestPath(searchValue: string): string {
  const query = [
    `$select=${GROUP_SELECT}`,
    `$filter=groupTypes/any(groupType:groupType eq '${M365_GROUP_TYPE}')`,
    '$count=true',
    `$top=${GROUP_PAGE_SIZE}`,
  ];
  const normalizedSearch = searchValue.trim();

  if (normalizedSearch) {
    const searchExpression = `"displayName:${escapeSearchValue(
      normalizedSearch
    )}"`;
    query.push(`$search=${encodeURIComponent(searchExpression)}`);
  }

  return `/me/memberOf/microsoft.graph.group?${query.join('&')}`;
}

function toMicrosoft365Group(
  group: IGraphMicrosoft365Group
): IMicrosoft365Group | undefined {
  if (
    !group.id ||
    !group.displayName ||
    group.groupTypes?.indexOf(M365_GROUP_TYPE) === -1
  ) {
    return undefined;
  }

  return {
    description: group.description,
    displayName: group.displayName,
    id: group.id,
    mail: group.mail,
  };
}

export async function fetchMicrosoft365GroupPage(
  graphClient: MSGraphClientV3,
  searchValue: string,
  nextLink?: string
): Promise<IMicrosoft365GroupPage> {
  const response: IGraphCollectionResponse<IGraphMicrosoft365Group> =
    await graphClient
      .api(nextLink ?? buildInitialRequestPath(searchValue))
      .header('ConsistencyLevel', 'eventual')
      .get();

  return {
    groups: (response.value ?? [])
      .map(toMicrosoft365Group)
      .filter(
        (group): group is IMicrosoft365Group => group !== undefined
      ),
    nextLink: response['@odata.nextLink'],
  };
}