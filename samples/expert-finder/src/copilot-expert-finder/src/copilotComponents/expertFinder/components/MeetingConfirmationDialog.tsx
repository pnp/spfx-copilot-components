import * as React from 'react';
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Field, Textarea, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import type { Expert } from '../models/Expert';
import type { AvailabilitySlot } from '../models/ExpertAvailability';
import type { CreatedMeeting } from '../models/ExpertMeeting';
import type { GraphMeetingService } from '../services/GraphMeetingService';

const useStyles = makeStyles({
  summary: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '8px 16px', margin: '12px 0 20px', fontSize: '14px',
    '& dt': { color: tokens.colorNeutralForeground2 }, '& dd': { margin: 0, overflowWrap: 'anywhere' } },
  message: { fontSize: '14px', lineHeight: '20px', color: tokens.colorNeutralForeground2 },
  error: { color: tokens.colorPaletteRedForeground1, fontSize: '14px', lineHeight: '20px' },
  actions: { flexWrap: 'wrap' }
});

type MeetingState = { status: 'editing' } | { status: 'creating' }
  | { status: 'success'; meeting: CreatedMeeting } | { status: 'error'; message: string };

export function MeetingConfirmationDialog({ expert, slot, service, timeZone, onClose, onMeetingCreated, onAvailabilityChanged, onOpenLink }: {
  expert: Expert; slot: AvailabilitySlot; service: GraphMeetingService; timeZone: string;
  onClose: () => void; onMeetingCreated: () => void; onAvailabilityChanged: () => void; onOpenLink: (url: string) => Promise<void>;
}): React.ReactElement {
  const styles = useStyles();
  const [notes, setNotes] = React.useState('');
  const [state, setState] = React.useState<MeetingState>({ status: 'editing' });
  const [linkError, setLinkError] = React.useState('');
  const busy = React.useRef(false);
  const active = React.useRef(true);
  React.useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const creating = state.status === 'creating';
  const locked = service.hasMeetingRequest(expert, slot);
  const teamsJoinUrl = state.status === 'success' ? state.meeting.teamsJoinUrl : undefined;
  const outlookUrl = state.status === 'success' ? state.meeting.outlookUrl : undefined;
  const timeFormat = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' });

  const create = (): Promise<void> => {
    if (busy.current || locked || state.status === 'success') return Promise.resolve();
    busy.current = true; setState({ status: 'creating' }); setLinkError('');
    return service.createMeeting(expert, slot, notes).then(meeting => {
      busy.current = false;
      if (active.current) { setState({ status: 'success', meeting }); onMeetingCreated(); }
    }).catch((error: unknown) => {
      busy.current = false;
      if (active.current) {
        setState({ status: 'error', message: error instanceof Error ? error.message : 'Meeting creation could not be confirmed. Check your Outlook calendar.' });
        onAvailabilityChanged();
      }
    });
  };

  const open = async (url: string): Promise<void> => {
    setLinkError('');
    try { await onOpenLink(url); }
    catch { if (active.current) setLinkError('The host could not open the meeting link. You can open the event from your Outlook calendar.'); }
  };
  const title = state.status === 'success' ? state.meeting.teamsJoinUrl ? 'Teams meeting created' : 'Calendar event created' : 'Confirm Teams meeting';

  return <Dialog open onOpenChange={(_, data) => { if (!data.open && !busy.current) onClose(); }}>
    <DialogSurface>
      <DialogBody>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <dl className={styles.summary}>
            <dt>Subject</dt><dd>Expert Finder: {expert.skill} discussion</dd>
            <dt>With</dt><dd>{expert.displayName} ({expert.email})</dd>
            <dt>Organizer</dt><dd>{service.organizer.displayName} ({service.organizer.email})</dd>
            <dt>Date</dt><dd>{slot.start.toLocaleDateString('en-US', { timeZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</dd>
            <dt>Time</dt><dd>{timeFormat.format(slot.start)}–{timeFormat.format(slot.end)} · {timeZone}</dd>
            <dt>Duration</dt><dd>30 minutes · Microsoft Teams</dd>
          </dl>
          {state.status !== 'success' && <Field label="Notes (optional)" hint={`${notes.length}/1000 characters`}>
            <Textarea value={notes} maxLength={1000} rows={3} resize="vertical" disabled={creating} readOnly={locked}
              onChange={(_, data) => setNotes(data.value)} />
          </Field>}
          {state.status === 'editing' && <p className={styles.message}>Creating this meeting will send an invitation to {expert.displayName}.</p>}
          {creating && <Spinner size="tiny" label="Checking calendars and creating the meeting…" />}
          {state.status === 'error' && <p className={styles.error} role="alert">{state.message}</p>}
          {state.status === 'success' && <p className={styles.message} role="status">{state.meeting.teamsJoinUrl
            ? 'The invitation has been sent. The expert can respond from their calendar.'
            : 'The event was created, but its Teams link could not be retrieved. Check the event in Outlook before taking another action.'}</p>}
          {linkError && <p className={styles.error} role="alert">{linkError}</p>}
        </DialogContent>
        <DialogActions className={styles.actions}>
          <Button disabled={creating} onClick={onClose}>{state.status === 'success' || locked && !creating ? 'Close' : 'Cancel'}</Button>
          {state.status !== 'success' && (!locked || creating) && <Button appearance="primary" disabled={creating} onClick={create}>
            {creating ? 'Creating…' : 'Create Teams meeting'}
          </Button>}
          {teamsJoinUrl && <Button appearance="primary" onClick={() => open(teamsJoinUrl)}>Open in Teams</Button>}
          {!teamsJoinUrl && outlookUrl && <Button appearance="primary" onClick={() => open(outlookUrl)}>Open in Outlook</Button>}
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  </Dialog>;
}
