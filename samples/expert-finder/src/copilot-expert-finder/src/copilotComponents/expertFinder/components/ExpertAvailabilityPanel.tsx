import * as React from 'react';
import { Button, Spinner, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowClockwise16Regular, ChevronLeft20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import type { Expert } from '../models/Expert';
import type { AvailabilitySlot, AvailabilityStatus, ExpertAvailability } from '../models/ExpertAvailability';
import type { GraphAvailabilityService } from '../services/GraphAvailabilityService';
import type { GraphMeetingService } from '../services/GraphMeetingService';
import { MeetingConfirmationDialog } from './MeetingConfirmationDialog';

const statusLabels: Record<AvailabilityStatus, { label: string; marker: string }> = {
  free: { label: 'Free', marker: 'F' }, tentative: { label: 'Tentative', marker: 'T' },
  busy: { label: 'Busy', marker: 'B' }, outOfOffice: { label: 'Out of Office', marker: 'O' }
};

const periods = [
  { label: 'Morning', range: '09:00–14:00', start: 0, end: 10 },
  { label: 'Afternoon', range: '14:00–18:00', start: 10, end: 18 }
] as const;

const useStyles = makeStyles({
  root: { borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px', minWidth: 0, containerType: 'inline-size' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' },
  heading: { margin: 0, fontSize: '14px', fontWeight: 600 },
  hint: { margin: '4px 0 12px', fontSize: '12px', lineHeight: '18px', color: tokens.colorNeutralForeground2, overflowWrap: 'anywhere' },
  navigation: { display: 'grid', gridTemplateColumns: '32px minmax(0, 1fr) 32px', alignItems: 'center', gap: '8px' },
  period: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', fontSize: '13px', fontWeight: 600, lineHeight: '18px' },
  periodRange: { fontSize: '12px', fontWeight: 400, color: tokens.colorNeutralForeground2 },
  timeline: { display: 'grid', gap: '6px', listStyleType: 'none', margin: '12px 0 4px', padding: 0 },
  slotItem: { minWidth: 0 },
  morning: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' } },
  afternoon: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    '@container (min-width: 600px)': { gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' } },
  slot: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
    height: '56px', width: '100%', minWidth: 0, padding: 0, boxSizing: 'border-box', border: '1px solid transparent',
    borderRadius: '6px', fontSize: '18px', lineHeight: '22px', fontWeight: 600,
    ':focus-visible': { outline: `2px solid ${tokens.colorNeutralForeground1}`, outlineOffset: '2px' } },
  bookable: { cursor: 'pointer', ':hover': { backgroundColor: tokens.colorPaletteGreenBackground2, border: `1px solid ${tokens.colorPaletteGreenForeground1}` } },
  slotTime: { fontSize: '11px', lineHeight: '14px', fontWeight: 400, fontVariantNumeric: 'tabular-nums' },
  free: { backgroundColor: tokens.colorPaletteGreenBackground1, color: tokens.colorPaletteGreenForeground1 },
  tentative: { backgroundColor: tokens.colorPaletteYellowBackground1, color: tokens.colorPaletteYellowForeground1 },
  busy: { backgroundColor: tokens.colorBrandBackground2, color: tokens.colorBrandForeground1 },
  outOfOffice: { backgroundColor: tokens.colorPaletteRedBackground1, color: tokens.colorPaletteRedForeground1 },
  current: { outline: `2px solid ${tokens.colorNeutralForeground1}`, outlineOffset: '2px' },
  legend: { display: 'flex', gap: '6px 10px', flexWrap: 'wrap', marginTop: '12px', fontSize: '11px', color: tokens.colorNeutralForeground2 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '4px' },
  marker: { display: 'inline-grid', placeItems: 'center', width: '16px', height: '16px', borderRadius: '3px', fontSize: '10px', fontWeight: 600 }
});

type PanelState = { email?: string } & (
  { status: 'loading' } | { status: 'ready'; availability: ExpertAvailability } | { status: 'error'; message: string }
);

export function ExpertAvailabilityPanel({ id, expert, service, meetingService, isDemo, onOpenLink }: {
  id: string; expert: Expert; service?: GraphAvailabilityService; meetingService?: GraphMeetingService; isDemo: boolean;
  onOpenLink: (url: string) => Promise<void>;
}): React.ReactElement {
  const styles = useStyles();
  const [state, setState] = React.useState<PanelState>({ status: 'loading' });
  const [refresh, setRefresh] = React.useState(0);
  const [now, setNow] = React.useState(() => new Date());
  const [meetingSlot, setMeetingSlot] = React.useState<AvailabilitySlot>();
  const lastTrigger = React.useRef<HTMLButtonElement | null>(null);
  const refreshButton = React.useRef<HTMLButtonElement | null>(null);
  const panelElement = React.useRef<HTMLElement | null>(null);
  const [periodIndex, setPeriodIndex] = React.useState<0 | 1>(() => new Date().getHours() >= 14 ? 1 : 0);
  const period = periods[periodIndex];
  const unavailable = isDemo ? 'Calendar availability is not available for fictional demo profiles.'
    : !expert.email ? 'Availability unavailable: no email address.'
    : !service ? 'Calendar availability is not configured.' : undefined;

  React.useEffect(() => {
    if (unavailable || !service || !expert.email) return;
    let active = true;
    const email = expert.email;
    setState({ email, status: 'loading' });
    service.getAvailability(email).then(availability => {
      if (active) { setNow(new Date()); setState({ email, status: 'ready', availability }); }
    }).catch((error: unknown) => {
      if (active) setState({ email, status: 'error', message: error instanceof Error ? error.message : 'Unable to retrieve calendar availability. Please try again.' });
    });
    return () => { active = false; };
  }, [expert.email, service, unavailable, refresh]);

  const matches = state.email === expert.email;
  const loading = !unavailable && (!matches || state.status === 'loading');
  const availability = matches && state.status === 'ready' ? state.availability : undefined;
  const error = unavailable || (matches && state.status === 'error' ? state.message : undefined);

  React.useEffect(() => {
    if (!availability) return;
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, [availability]);

  const zone = availability?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = availability?.date || now;
  const dateOptions: Intl.DateTimeFormatOptions = { timeZone: zone, month: 'short', day: 'numeric', year: 'numeric' };
  const dateLabel = date.toLocaleDateString('en-US', dateOptions) === now.toLocaleDateString('en-US', dateOptions)
    ? 'Today' : date.toLocaleDateString('en-US', dateOptions);
  const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit' });
  const canBook = !isDemo && !!meetingService?.canSchedule(expert);
  const refreshAvailability = (): void => {
    setState({ email: expert.email, status: 'loading' }); setNow(new Date()); setRefresh(value => value + 1);
  };
  const closeMeeting = (): void => {
    setMeetingSlot(undefined);
    window.setTimeout(() => {
      const fallback = refreshButton.current?.disabled ? panelElement.current : refreshButton.current;
      (lastTrigger.current?.isConnected ? lastTrigger.current : fallback)?.focus();
    }, 0);
  };

  return <section ref={panelElement} tabIndex={-1} id={id} className={styles.root} aria-label={`Calendar availability for ${expert.displayName}`} aria-busy={loading}>
    <div className={styles.header}>
      <h3 className={styles.heading}>Availability</h3>
      {!unavailable && <Button ref={refreshButton} appearance="subtle" size="small" icon={<ArrowClockwise16Regular />} disabled={loading}
        aria-label={`${error ? 'Try again' : 'Refresh'} availability for ${expert.displayName}`}
        onClick={refreshAvailability}>
        {error ? 'Try again' : 'Refresh'}
      </Button>}
    </div>
    <p className={styles.hint}>{dateLabel} · 09:00–18:00 · {zone}</p>
    {loading ? <Spinner size="tiny" label="Checking availability…" />
      : error ? <p className={styles.hint} role={unavailable ? 'status' : 'alert'}>{error}</p>
      : availability && <>
        <div className={styles.navigation}>
          <Button appearance="subtle" icon={<ChevronLeft20Regular />} disabled={periodIndex === 0}
            aria-label="Show morning availability, 09:00–14:00" aria-controls={`${id}-slots`} onClick={() => setPeriodIndex(0)} />
          <span className={styles.period} role="status" aria-live="polite">
            <span>{period.label}</span><span className={styles.periodRange}>{period.range}</span>
          </span>
          <Button appearance="subtle" icon={<ChevronRight20Regular />} disabled={periodIndex === 1}
            aria-label="Show afternoon availability, 14:00–18:00" aria-controls={`${id}-slots`} onClick={() => setPeriodIndex(1)} />
        </div>
        <ol id={`${id}-slots`} className={mergeClasses(styles.timeline, periodIndex === 0 ? styles.morning : styles.afternoon)}
          aria-label={`${period.label} calendar availability, ${period.range}, 30-minute slots`}>
          {availability.slots.slice(period.start, period.end).map(slot => {
            const booked = !!meetingService?.isSlotBooked(expert, slot);
            const displayedStatus = booked ? 'busy' : slot.status;
            const status = statusLabels[displayedStatus];
            const current = slot.start.getTime() <= now.getTime() && now.getTime() < slot.end.getTime();
            const requested = !!meetingService?.hasMeetingRequest(expert, slot);
            const actionable = canBook && displayedStatus === 'free' && slot.start.getTime() > now.getTime() && !requested;
            const label = `${timeFormat.format(slot.start)}–${timeFormat.format(slot.end)}: ${status.label}${current ? '. Current time slot' : ''}${booked ? '. Meeting created in this session' : requested ? '. A meeting was already requested; check your calendar' : ''}`;
            const slotStyle = mergeClasses(styles.slot, styles[displayedStatus], current && styles.current);
            const content = <><time className={styles.slotTime} dateTime={slot.start.toISOString()} aria-hidden="true">{timeFormat.format(slot.start)}</time>
              <span aria-hidden="true">{status.marker}</span></>;
            return <li key={slot.start.getTime()} className={styles.slotItem}>
              <Tooltip content={actionable ? `${label}. Create a Teams meeting` : label} relationship="description">
                {actionable ? <Button appearance="transparent" className={mergeClasses(slotStyle, styles.bookable)}
                  aria-label={`Create a Teams meeting with ${expert.displayName}, ${label}`} aria-current={current ? 'time' : undefined}
                  onClick={event => {
                    setNow(new Date());
                    if (slot.start.getTime() > Date.now()) { lastTrigger.current = event.currentTarget; setMeetingSlot(slot); }
                  }}>{content}</Button>
                  : <span className={slotStyle} role="img" tabIndex={0} aria-label={label} aria-current={current ? 'time' : undefined}>{content}</span>}
              </Tooltip>
            </li>;
          })}
        </ol>
        <div className={styles.legend} aria-label="Calendar availability legend">
          {(Object.keys(statusLabels) as AvailabilityStatus[]).map(status => <span key={status} className={styles.legendItem}>
            <span className={mergeClasses(styles.marker, styles[status])} aria-hidden="true">{statusLabels[status].marker}</span>{statusLabels[status].label}
          </span>)}
        </div>
        <p className={styles.hint}>Calendar availability · 30-minute slots</p>
        {availability.slots.some(slot => meetingService?.isSlotBooked(expert, slot)) && <p className={styles.hint} role="status">
          Meetings created here stay marked Busy for this session. The expert can still accept or decline.
        </p>}
        {canBook && <p className={styles.hint}>Select a future Free slot to create a Teams meeting.</p>}
        {meetingService?.isSelf(expert) && <p className={styles.hint}>Your own calendar is shown for reference.</p>}
      </>}
    {meetingSlot && meetingService && <MeetingConfirmationDialog expert={expert} slot={meetingSlot} service={meetingService}
      timeZone={zone} onClose={closeMeeting} onMeetingCreated={() => setNow(new Date())}
      onAvailabilityChanged={refreshAvailability} onOpenLink={onOpenLink} />}
  </section>;
}
