import * as React from 'react';
import { Button, Field, Textarea, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import type { GraphMeetingService } from '../../expertFinder/services/GraphMeetingService';
import type { MeetingAgenda, AgendaSaveResult } from '../../expertFinder/models/MeetingAgenda';
import { normalizeAgenda } from '../../expertFinder/utils/meetingAgenda';
import type { IPrepareMeetingAgendaProperties } from '../PrepareMeetingAgendaCopilotComponentProperties';

const useStyles = makeStyles({
  root: { padding: '24px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '16px',
    backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1, minWidth: 0, overflowWrap: 'anywhere' },
  title: { marginTop: 0, fontSize: '20px' },
  summary: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: '8px 16px',
    '& dt': { color: tokens.colorNeutralForeground2 }, '& dd': { margin: 0 } },
  hint: { color: tokens.colorNeutralForeground2, lineHeight: '20px' },
  error: { color: tokens.colorPaletteRedForeground1 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }
});

export function MeetingAgendaReview({ input, service, onOpenLink, inline, onContentResize }: {
  input: IPrepareMeetingAgendaProperties; service: GraphMeetingService; onOpenLink: (url: string) => Promise<void>;
  inline: boolean; onContentResize: (width: number, height: number) => void;
}): React.ReactElement {
  const styles = useStyles();
  const [meeting, setMeeting] = React.useState<MeetingAgenda>();
  const [draft, setDraft] = React.useState(input.agenda);
  const [phase, setPhase] = React.useState<'loading' | 'editing' | 'saving' | 'saved' | 'unknown' | 'conflict'>('loading');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [checkedUnknown, setCheckedUnknown] = React.useState(false);
  const active = React.useRef(true);
  const busy = React.useRef(false);
  const contentElement = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  React.useEffect(() => {
    const element = contentElement.current;
    const view = element?.ownerDocument.defaultView;
    if (!inline || !element || !view?.ResizeObserver) return;
    let lastWidth = 0;
    let lastHeight = 0;
    const observer = new view.ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      if (width > 0 && height > 0 && (width !== lastWidth || height !== lastHeight)) {
        lastWidth = width; lastHeight = height;
        onContentResize(width, height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [inline, onContentResize]);
  const { eventId, bookingId } = input;
  const load = React.useCallback((): Promise<void> => {
    if (busy.current) return Promise.resolve();
    busy.current = true; setPhase('loading'); setError(''); setMeeting(undefined);
    return service.readMeetingAgenda({ eventId, bookingId }).then(result => {
      busy.current = false;
      if (active.current) { setMeeting(result); setPhase('editing'); setMessage('Draft — not saved to the meeting'); }
    }).catch((problem: unknown) => {
      busy.current = false;
      if (active.current) { setPhase('editing'); setError(problem instanceof Error ? problem.message : 'The meeting could not be loaded.'); }
    });
  }, [service, eventId, bookingId]);
  React.useEffect(() => { load().catch(() => undefined); }, [load]);

  let validation = '';
  try { normalizeAgenda(draft); } catch (problem) { validation = problem instanceof Error ? problem.message : 'Enter an agenda.'; }
  const apply = (result: AgendaSaveResult): void => {
    if (result.status === 'saved' || result.status === 'alreadySaved') {
      if (result.meeting) setMeeting(result.meeting);
      setPhase('saved'); setMessage(result.status === 'saved' ? 'Agenda saved to this meeting' : 'This agenda is already saved to this meeting');
    } else if (result.status === 'conflict') {
      setPhase('conflict'); setError('The meeting changed. Reload and review it before saving again.');
    } else {
      setPhase('unknown'); setMessage(''); setError('Save could not be confirmed. Check the meeting before saving again.');
    }
  };
  const save = (checkOnly: boolean): Promise<void> => {
    if (busy.current || !meeting) return Promise.resolve();
    busy.current = true; setError(''); setCheckedUnknown(false);
    if (!checkOnly) { setPhase('saving'); setMessage(''); }
    const request = checkOnly ? service.checkAgendaSave() : service.saveMeetingAgenda(input, draft, meeting.reviewVersion);
    return request.then(result => {
      busy.current = false;
      if (active.current) { apply(result); if (checkOnly && result.status === 'unknown') setCheckedUnknown(true); }
    }).catch((problem: unknown) => {
      busy.current = false;
      if (active.current) {
        setPhase(checkOnly ? 'unknown' : 'editing');
        setError(problem instanceof Error ? problem.message : 'The agenda could not be saved.');
      }
    });
  };
  const open = async (): Promise<void> => {
    if (!meeting?.outlookUrl) return;
    try { await onOpenLink(meeting.outlookUrl); }
    catch { if (active.current) setError('The host could not open Outlook. Open the event from your Outlook calendar.'); }
  };
  const locked = phase !== 'editing';
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = (value: string): string => new Date(value).toLocaleString(undefined, { timeZone: zone,
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return <section ref={contentElement} className={styles.root} aria-label="Meeting agenda">
    <h2 className={styles.title}>Review meeting agenda</h2>
    {phase === 'loading' && <Spinner label="Loading the meeting…" />}
    {meeting && <>
      <dl className={styles.summary}>
        <dt>Meeting</dt><dd>{meeting.subject}</dd>
        <dt>With</dt><dd>{meeting.expertName}</dd>
        <dt>Time</dt><dd>{date(meeting.startUtc)} – {date(meeting.endUtc)} · {zone}</dd>
        <dt>Duration</dt><dd>30 minutes · Microsoft Teams</dd>
      </dl>
      <p className={styles.hint}>Saving updates an invitation already sent and may notify attendees.</p>
      <Field label="Agenda" validationMessage={validation || undefined} validationState={validation ? 'error' : 'none'} hint={`${draft.length}/4000 characters`}>
        <Textarea value={draft} disabled={locked} rows={12} resize="vertical" onChange={(_, data) => setDraft(data.value)} />
      </Field>
    </>}
    {message && <p role="status">{message}</p>}
    {phase === 'saving' && <Spinner size="tiny" label="Saving agenda…" />}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.actions}>
      {!meeting && phase !== 'loading' && <Button onClick={load}>Try again</Button>}
      {meeting && phase === 'editing' && <Button appearance="primary" disabled={!!validation} onClick={() => save(false)}>Save agenda to meeting</Button>}
      {phase === 'saved' && <Button onClick={() => { setPhase('editing'); setMessage('Draft — not saved to the meeting'); }}>Edit agenda</Button>}
      {phase === 'conflict' && <Button onClick={load}>Reload meeting</Button>}
      {phase === 'unknown' && <Button onClick={() => save(true)}>Check save status</Button>}
      {phase === 'unknown' && checkedUnknown && <Button onClick={() => { service.allowAgendaRetry(); load().catch(() => undefined); }}>I checked Outlook — reload for another save</Button>}
      {meeting?.outlookUrl && (phase === 'saved' || phase === 'unknown') && <Button onClick={open}>Open in Outlook</Button>}
    </div>
  </section>;
}
