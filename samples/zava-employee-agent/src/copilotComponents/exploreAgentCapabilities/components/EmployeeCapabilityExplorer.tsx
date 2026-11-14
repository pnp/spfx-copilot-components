import * as React from 'react';
import { makeStyles } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';
import { findEmployeeCapabilities } from '../../shared/experiences/employeeCapabilities';
import { getZavaFamily, isZavaFamilyId, ZAVA_FAMILIES, type ZavaFamilyId } from '../../shared/models/families';
import type { IExploreAgentCapabilitiesCopilotComponentProperties } from '../ExploreAgentCapabilitiesCopilotComponentProperties';

export interface IEmployeeExplorerSnapshot extends Record<string, unknown> {
  readonly intent: 'ExploreAgentCapabilitiesTool';
  readonly query: string;
  readonly category: string;
  readonly visibleTools: readonly string[];
  readonly summary: string;
}
interface IProps extends IExploreAgentCapabilitiesCopilotComponentProperties {
  readonly onSendPrompt?: (prompt: string) => Promise<void>;
  readonly onUpdateContext?: (snapshot: IEmployeeExplorerSnapshot) => Promise<void>;
  readonly onRequestFullscreen?: () => Promise<void>;
}
const useStyles = makeStyles({
  root: { boxSizing: 'border-box', width: '100%', padding: '16px', minWidth: 0, color: tokens.colorNeutralForeground1, fontFamily: tokens.fontFamilyBase },
  title: { fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, margin: '6px 0' },
  filters: { display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: '12px', marginBottom: '16px', '@media(max-width:520px)': { gridTemplateColumns: '1fr' } },
  field: { display: 'grid', gap: '6px', fontWeight: tokens.fontWeightSemibold },
  input: { boxSizing: 'border-box', width: '100%', minWidth: 0, padding: '8px', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusMedium, font: 'inherit' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: '12px' },
  card: { padding: '14px', minWidth: 0, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1 },
  heading: { margin: '6px 0', fontSize: tokens.fontSizeBase400 },
  muted: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' },
  button: { padding: '8px 12px', maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere', color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackground, border: 'none', borderRadius: tokens.borderRadiusMedium, cursor: 'pointer', font: 'inherit', ':hover': { backgroundColor: tokens.colorBrandBackgroundHover }, ':disabled': { cursor: 'wait', opacity: 0.6 } },
  prompt: { padding: '10px', backgroundColor: tokens.colorNeutralBackground3, overflowWrap: 'anywhere' }
});
export default function EmployeeCapabilityExplorer(props: IProps): React.ReactElement {
  const s = useStyles();
  const [query, setQuery] = React.useState(props.query || '');
  const [category, setCategory] = React.useState<ZavaFamilyId | undefined>(props.category);
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const live = React.useRef(true);
  const lastSnapshot = React.useRef('');
  const matches = findEmployeeCapabilities(query, category);
  const tools = matches.map(item => item.tool).join('|');
  React.useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  React.useEffect(() => {
    const signature = JSON.stringify([query, category, tools]);
    if (signature === lastSnapshot.current) return;
    lastSnapshot.current = signature;
    props.onUpdateContext?.({
      intent: 'ExploreAgentCapabilitiesTool', query, category: category || 'all',
      visibleTools: matches.map(item => item.tool),
      summary: `${matches.length} employee scenarios match the current feature search. Browsing features does not read or change private HR records.`
    }).catch(reason => { if (live.current) setError(`Could not update the capability context: ${String(reason)}`); });
  }, [query, category, tools, props.onUpdateContext]);
  const send = async (prompt: string): Promise<void> => {
    if (!props.onSendPrompt || sending) return;
    setSending(true); setError(''); setNotice('');
    try {
      await props.onSendPrompt(prompt);
      if (live.current) setNotice('Prompt sent to Copilot. The selected scenario will open through normal tool routing.');
    } catch (reason) {
      if (live.current) setError(`Copilot could not accept the prompt: ${String(reason)}`);
    } finally {
      if (live.current) setSending(false);
    }
  };
  return <section className={s.root} aria-label="Employee agent capability explorer" data-employee-capability-explorer>
    <p className={s.muted}>Zava Employee Agent · Feature discovery</p>
    <h1 className={s.title}>Explore employee features</h1>
    <p>Choose the HR experience for your next job. This catalog shows capabilities and example prompts, not private employee records.</p>
    <div className={s.actions}>{props.onRequestFullscreen && <button type="button" className={s.button} onClick={() => { props.onRequestFullscreen?.().catch(reason => { if (live.current) setError(`Full screen was unavailable: ${String(reason)}`); }); }}>Expand feature explorer</button>}</div>
    <div className={s.filters}>
      <label className={s.field}>Search employee features<input className={s.input} value={query} onChange={event => setQuery(event.target.value)} /></label>
      <label className={s.field}>Feature family<select className={s.input} value={category || 'all'} onChange={event => {
        const value = event.target.value;
        if (value === 'all') setCategory(undefined);
        else if (isZavaFamilyId(value)) setCategory(value);
        else setError('Choose one of the available employee feature families.');
      }}><option value="all">All employee features</option>{ZAVA_FAMILIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    </div>
    <p role="status">{matches.length} matching scenarios</p>
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    <div className={s.grid}>{matches.map(item => <article key={item.key} className={s.card}>
      <span className={s.muted}>{getZavaFamily(item.family).label} · {item.operation}</span>
      <h2 className={s.heading}>{item.title}</h2><p>{item.purpose}</p>
      <p className={s.prompt}>{item.prompt}</p>
      {props.onSendPrompt ? <button type="button" className={s.button} disabled={sending} onClick={() => { send(item.prompt).catch(reason => { if (live.current) setError(String(reason)); }); }}>Try {item.title.toLowerCase()}</button> : <p className={s.muted}>Copy this example into Copilot to open its dedicated component.</p>}
    </article>)}</div>
    {matches.length === 0 && <p role="status">No scenario matches. Try a term such as leave, benefits, learning, policy, or approvals.</p>}
    <p className={s.muted}>Opening a scenario never submits, approves or changes HR data. Requests and decisions retain their own review and confirmation steps.</p>
  </section>;
}
