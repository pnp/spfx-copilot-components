import * as React from 'react';
import { Button, Card, makeStyles, tokens, useId } from '@fluentui/react-components';
import { CalendarClock20Regular, PeopleTeam20Regular } from '@fluentui/react-icons';
import type { Expert, ExpertPhoto } from '../models/Expert';
import type { GraphAvailabilityService } from '../services/GraphAvailabilityService';
import type { GraphMeetingService } from '../services/GraphMeetingService';
import { ExpertAvatar } from './ExpertAvatar';
import { ExpertActions } from './ExpertActions';
import { ExpertAvailabilityPanel } from './ExpertAvailabilityPanel';
import type { IntroductionAction, AgendaAction } from './IExpertFinderProps';

const useStyles = makeStyles({
  card: { padding: '24px', borderRadius: '16px', border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4, backgroundColor: tokens.colorNeutralBackground1, minWidth: 0, gap: '20px' },
  person: { display: 'flex', alignItems: 'center', gap: '16px' },
  details: { minWidth: 0, overflowWrap: 'anywhere' },
  name: { margin: 0, fontSize: '18px', lineHeight: '24px', fontWeight: 600 },
  role: { margin: '4px 0 0', color: tokens.colorNeutralForeground2, lineHeight: '20px' },
  summary: { margin: 0, color: tokens.colorNeutralForeground2, lineHeight: '22px', overflowWrap: 'anywhere' },
  department: { display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', marginTop: 'auto',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground2, fontSize: '13px' }
});

export function ExpertCard({ expert, photo, onPhotoSettled, availabilityService, meetingService, introduction, agenda, availabilitySelected, onCheckAvailability, isDemo, onOpenLink }: {
  expert: Expert; photo?: ExpertPhoto; onPhotoSettled: (id: string, failed: boolean) => void;
  availabilityService?: GraphAvailabilityService; availabilitySelected: boolean; onCheckAvailability: () => void;
  meetingService?: GraphMeetingService;
  introduction: IntroductionAction;
  agenda: AgendaAction;
  isDemo: boolean; onOpenLink: (url: string) => Promise<void>;
}): React.ReactElement {
  const styles = useStyles();
  const availabilityId = useId('expert-availability-');
  return <Card className={styles.card}>
    <div className={styles.person}>
      <ExpertAvatar expert={expert} photo={photo} onPhotoSettled={onPhotoSettled} size={72} />
      <div className={styles.details}><h2 className={styles.name}>{expert.displayName}</h2><p className={styles.role}>{expert.jobTitle}</p></div>
    </div>
    <p className={styles.summary}>{expert.shortCV || 'No professional summary provided.'}</p>
    <div className={styles.department}><PeopleTeam20Regular aria-hidden="true" />{expert.department || 'Department not specified'}</div>
    <ExpertActions expert={expert} isDemo={isDemo} onOpenLink={onOpenLink} introduction={introduction} />
    <Button appearance="subtle" icon={<CalendarClock20Regular />} onClick={onCheckAvailability}
      aria-label={`Check availability for ${expert.displayName}`} aria-expanded={availabilitySelected}
      aria-controls={availabilitySelected ? availabilityId : undefined}>Check availability</Button>
    {availabilitySelected && <ExpertAvailabilityPanel id={availabilityId} expert={expert} service={availabilityService}
      meetingService={meetingService} isDemo={isDemo} onOpenLink={onOpenLink} agenda={agenda} />}
  </Card>;
}
