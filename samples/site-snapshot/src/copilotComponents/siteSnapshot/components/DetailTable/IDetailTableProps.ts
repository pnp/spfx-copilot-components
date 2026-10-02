import type { ISnapshotDetail } from '../../models';

export type DetailKind = 'stale' | 'external' | 'largest' | 'types' | 'owners' | 'duplicates' | 'empty';

export interface IDetailTableProps {
  kind: DetailKind;
  detail: ISnapshotDetail;
}
