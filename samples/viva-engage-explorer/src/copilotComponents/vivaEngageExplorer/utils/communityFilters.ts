import type { ICommunity } from '../models/ICommunity';
import type { ICommunityExplorerQuery } from '../VivaEngageExplorerCopilotComponentProperties';

export function filterCommunities(communities: ICommunity[], query: ICommunityExplorerQuery): ICommunity[] {
  const text = (query.searchText ?? '').trim().toLocaleLowerCase();
  return communities.filter(community => {
    if (query.privacy && query.privacy !== 'all' && community.privacy !== query.privacy) return false;
    const name = (community.displayName ?? '').toLocaleLowerCase();
    const description = (community.description ?? '').toLocaleLowerCase();
    return !text || (query.searchIn !== 'description' && name.includes(text)) ||
      (query.searchIn !== 'name' && description.includes(text));
  }).sort((a, b) => {
    const order = (a.displayName ?? '').localeCompare(b.displayName ?? '', undefined, { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id);
    return query.sortBy === 'nameDesc' ? -order : order;
  });
}
