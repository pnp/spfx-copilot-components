import type { ICommunity, ICommunitySnapshot } from '../models/ICommunity';

export interface IVivaEngageService {
  getCommunities(): Promise<ICommunity[]>;
  getCommunityById(id: string, refresh?: boolean): Promise<ICommunity>;
  getSnapshot(): ICommunitySnapshot;
  refresh(): Promise<ICommunity[]>;
  dispose(): void;
}
