import type { ISiteSnapshot } from '../../models';

export interface IDashboardProps {
  snapshot: ISiteSnapshot;
  // Which detail tab to open first (from the chat's focus argument).
  focus?: string;
  onExport: () => void;
  onEmail: () => Promise<boolean>;
}
