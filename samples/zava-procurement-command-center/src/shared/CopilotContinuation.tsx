import * as React from 'react';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, tokens } from '@fluentui/react-components';
import { Chat20Regular } from '@fluentui/react-icons';
import type { IIntentDefinition } from './catalog';
import { discussionAction, getCopilotActions, type ICopilotAction } from './copilot';
import type { IProcurementSnapshot } from './modelContext';

export type SendProcurementFollowUp = (message: string, snapshot: IProcurementSnapshot) => Promise<boolean>;
const useStyles = makeStyles({
  root: { minWidth: 0, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, paddingTop: '16px', marginTop: '16px' },
  heading: { margin: '0 0 6px', fontSize: tokens.fontSizeBase400 },
  text: { margin: '0 0 12px', fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, lineHeight: '1.5' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px', '& button': { whiteSpace: 'normal', textAlign: 'left', maxWidth: '100%' } },
  question: { display: 'grid', gap: '8px', marginTop: '12px', fontSize: tokens.fontSizeBase200 },
  input: { boxSizing: 'border-box', width: '100%', padding: '10px', minHeight: '64px', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, font: 'inherit' },
  error: { color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 }
});

export default function CopilotContinuation({ definition, snapshot, full, send }: {
  readonly definition: IIntentDefinition; readonly snapshot?: IProcurementSnapshot;
  readonly full: boolean; readonly send?: SendProcurementFollowUp;
}): React.ReactElement {
  const s = useStyles();
  const [state, setState] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = React.useState('');
  const [question, setQuestion] = React.useState('');
  const [showQuestion, setShowQuestion] = React.useState(false);
  const sending = React.useRef(false);
  const release = (): void => { sending.current = false; };
  const live = React.useRef(true);
  React.useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const signature = JSON.stringify(snapshot);
  React.useEffect(() => { setState(current => current === 'sending' ? current : 'idle'); setError(''); }, [signature]);
  const actions = snapshot ? getCopilotActions(definition, snapshot, full) : undefined;
  const submit = async (action: ICopilotAction): Promise<void> => {
    if (!snapshot || !send || sending.current) return;
    sending.current = true;
    setState('sending');
    setError('');
    const captured: IProcurementSnapshot = {
      ...snapshot,
      discussion: { topic: action.label, responseMode: action.handoff ? 'component' : 'text', handoff: action.handoff }
    };
    try {
      const accepted = await send(action.prompt, captured);
      if (live.current) {
        setState(accepted ? 'sent' : 'error');
        if (!accepted) setError('Copilot did not accept the message. Your selection and draft are unchanged; retry the action.');
      }
    } catch (reason) {
      if (live.current) {
        setState('error');
        setError(`Context and question could not be sent: ${reason instanceof Error ? reason.message : String(reason)} Retry the action.`);
      }
    } finally { release(); }
  };
  const run = (action: ICopilotAction): void => {
    submit(action).catch((reason: unknown) => { if (live.current) { setState('error'); setError(`Unable to continue with Copilot: ${String(reason)}`); } });
  };
  const disabled = !actions || !send || state === 'sending';
  return <section className={s.root} aria-label="Continue with Copilot" data-copilot-continuation>
    <h2 className={s.heading}>Continue with Copilot</h2>
    <p className={s.text}>{full ? 'Return a concise summary to chat with the current scope, evidence gaps and next steps. No new component is opened.' : 'Carry this exact selection and evidence into the next business step, or ask a question about what is shown.'}</p>
    <div className={s.actions}>
      <Button appearance="primary" icon={<Chat20Regular />} disabled={disabled} onClick={() => { if (actions) run(actions.primary); }}>Continue with Copilot: {actions?.primary.label || 'Preparing visible context'}</Button>
      <Menu><MenuTrigger disableButtonEnhancement><Button disabled={disabled}>More discussions</Button></MenuTrigger><MenuPopover><MenuList>
        {actions?.discussions.map(action => <MenuItem key={action.label} onClick={() => run(action)}>{action.label}</MenuItem>)}
        <MenuItem onClick={() => setShowQuestion(true)}>Ask your own question</MenuItem>
      </MenuList></MenuPopover></Menu>
    </div>
    {showQuestion && <div className={s.question}><label>Question about this view<textarea className={s.input} value={question} onChange={event => setQuestion(event.target.value)} /></label><div><Button disabled={disabled || !question.trim()} onClick={() => run(discussionAction('Question about this view', question.trim()))}>Ask Copilot</Button></div></div>}
    {state === 'sending' && <p className={s.text} role="status">Sharing this view and question with Copilot...</p>}
    {state === 'sent' && <p className={s.text} role="status">Message accepted by Copilot. No procurement action was authorized.</p>}
    {error && <p className={s.error} role="alert">{error}</p>}
    {!send && <p className={s.text}>Open this experience in Copilot to continue the conversation.</p>}
  </section>;
}
