import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import type { Expert, ExpertPhotos } from '../models/Expert';
import type { GraphAvailabilityService } from '../services/GraphAvailabilityService';
import type { GraphMeetingService } from '../services/GraphMeetingService';
import { filterExperts, emptyFilters, type ExpertFilters } from '../utils/expertFilters';
import { ExpertSearch } from './ExpertSearch';
import { ExpertCard } from './ExpertCard';
import type { IntroductionAction } from './IExpertFinderProps';

const useStyles = makeStyles({
  grid: { display: 'grid', alignItems: 'start', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px', paddingBottom: '8px',
    '@media (max-width: 1000px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
    '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  count: { margin: '24px 0 20px', fontWeight: 600 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '48px 16px', textAlign: 'center' },
  hint: { margin: 0, color: tokens.colorNeutralForeground2 }
});

export function ExpertFinderFullscreen({ experts, photos, onPhotoSettled, availabilityService, meetingService, introduction, filters, onFiltersChange, isDemo, onOpenLink }: {
  experts: Expert[]; photos: ExpertPhotos; onPhotoSettled: (id: string, failed: boolean) => void;
  availabilityService?: GraphAvailabilityService;
  meetingService?: GraphMeetingService;
  introduction: IntroductionAction;
  filters: ExpertFilters; onFiltersChange: (filters: ExpertFilters) => void;
  isDemo: boolean; onOpenLink: (url: string) => Promise<void>;
}): React.ReactElement {
  const styles = useStyles();
  const [selectedExpertId, setSelectedExpertId] = React.useState<string>();
  const visible = React.useMemo(() => filterExperts(experts, filters), [experts, filters]);
  React.useEffect(() => {
    if (selectedExpertId && !visible.some(expert => expert.id === selectedExpertId)) setSelectedExpertId(undefined);
  }, [visible, selectedExpertId]);
  return <>
    <ExpertSearch experts={experts} filters={filters} onChange={onFiltersChange} />
    <p className={styles.count} role="status">{visible.length === experts.length
      ? `${visible.length} ${visible.length === 1 ? 'expert' : 'experts'} found`
      : `${visible.length} of ${experts.length} experts`}</p>
    {visible.length ? <div className={styles.grid}>{visible.map(expert =>
      <ExpertCard key={expert.id} expert={expert} photo={photos[expert.id]} onPhotoSettled={onPhotoSettled}
        availabilityService={availabilityService} meetingService={meetingService} availabilitySelected={selectedExpertId === expert.id}
        introduction={introduction}
        onCheckAvailability={() => setSelectedExpertId(expert.id)}
        isDemo={isDemo} onOpenLink={onOpenLink} />)}</div>
      : <div className={styles.empty} role="status"><Search24Regular /><strong>No experts match these filters</strong>
        <p className={styles.hint}>Try a different name, department or role.</p><Button onClick={() => onFiltersChange({ ...emptyFilters })}>Clear filters</Button></div>}
  </>;
}
