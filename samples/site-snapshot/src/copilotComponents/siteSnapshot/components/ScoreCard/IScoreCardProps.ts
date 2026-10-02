import type { ISiteSnapshot } from '../../models';

export interface IScoreCardProps {
  snapshot: ISiteSnapshot;
  onOpen: () => Promise<void>;
}
