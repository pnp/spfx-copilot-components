import * as React from 'react';
import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Add24Regular,
  Calendar24Regular,
  DismissCircle24Regular,
  Document24Regular,
  Search24Regular,
  ShieldLock24Regular
} from '@fluentui/react-icons';
import {
  approvalFixtures,
  businessDays,
  equityData,
  initialPersonalIssues,
  initialTimeOff,
  knownIssues,
  roomsByOffice
} from '../mockData/personalWorkflows';
import { getZavaPerson } from '../mockData/personas';
import { dateOnlyAtDayOffset, formatDate } from '../utils/evergreenDates';
import type { IZavaExperienceProps, IZavaModelContextSnapshot } from '../models/zavaOne';
import { ResponsiveExpandButton } from './ResponsiveExpandButton';
import { SubmissionReceipt } from './SubmissionReceipt';

const useStyles = makeStyles({
  root: { width: '100%', minWidth: 0, boxSizing: 'border-box', containerType: 'inline-size', containerName: 'zava-experience', overflowWrap: 'anywhere' },
  inline: { maxWidth: '720px', marginRight: 'auto', marginLeft: 'auto', padding: tokens.spacingHorizontalM },
  frame: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: tokens.spacingVerticalL, overflow: 'hidden', padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow4 },
  strip: { height: '5px', marginTop: `calc(-1 * ${tokens.spacingHorizontalL})`, marginRight: `calc(-1 * ${tokens.spacingHorizontalL})`, marginLeft: `calc(-1 * ${tokens.spacingHorizontalL})`, backgroundImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%)' },
  header: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', gap: tokens.spacingHorizontalL },
  heading: { display: 'grid', gap: tokens.spacingVerticalXXS },
  overline: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { margin: 0, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold },
  subtitle: { margin: 0, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  source: { paddingTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  actions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: tokens.spacingHorizontalXS, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, flexWrap: 'wrap' },
  tab: { padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`, color: tokens.colorNeutralForeground2, backgroundColor: 'transparent', border: 0, borderBottom: '3px solid transparent', cursor: 'pointer' },
  tabSelected: { color: tokens.colorBrandForeground1, borderBottomColor: tokens.colorBrandStroke1, fontWeight: tokens.fontWeightSemibold },
  list: { display: 'grid', gap: tokens.spacingVerticalS },
  row: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left' },
  rowButton: { cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` } },
  itemCopy: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  secondary: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  detail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  evidenceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: tokens.spacingHorizontalM },
  evidence: { display: 'grid', gap: tokens.spacingVerticalXXS, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusMedium },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: tokens.spacingHorizontalM },
  risk: { padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorPaletteYellowBackground1, borderLeft: `4px solid ${tokens.colorPaletteYellowBorder2}`, borderRadius: tokens.borderRadiusMedium },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: tokens.spacingHorizontalM },
  metric: { display: 'grid', gap: tokens.spacingVerticalXXS, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  metricValue: { fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold },
  chart: { display: 'grid', gap: tokens.spacingVerticalM },
  svg: { width: '100%', height: 'auto', minHeight: '250px', overflow: 'visible' },
  axisLabel: { fill: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  actualBar: { fill: '#0f6cbd', cursor: 'pointer' },
  estimateBar: { fill: '#b32687', cursor: 'pointer' },
  chartTable: { width: '100%', borderCollapse: 'collapse' },
  cell: { padding: tokens.spacingHorizontalS, textAlign: 'left', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  roomGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: tokens.spacingHorizontalM },
  room: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer' },
  roomSelected: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}` },
  loading: { display: 'grid', placeItems: 'center', gap: tokens.spacingVerticalM, minHeight: '180px', color: tokens.colorNeutralForeground3 },
  privacy: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorPaletteCranberryBackground2, borderRadius: tokens.borderRadiusLarge }
});

function usePublish(props: IZavaExperienceProps, snapshot: IZavaModelContextSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const ref = React.useRef(snapshot);
  ref.current = snapshot;
  React.useEffect(() => { props.publishContext?.(ref.current).catch(() => undefined); }, [props.publishContext, signature]);
}

function WorkflowFrame(props: { experience: IZavaExperienceProps; layout: string; eyebrow: string; title: string; subtitle: string; source: string; children: React.ReactNode }): React.ReactElement {
  const styles = useStyles();
  const inline = props.experience.surface === 'copilotInline';
  return <section className={mergeClasses(styles.root, inline && styles.inline)} data-layout={props.layout}><div className={styles.frame}><div className={styles.strip} /><header className={styles.header}><div className={styles.heading}><span className={styles.overline}>{props.eyebrow}</span><h2 className={styles.title}>{props.experience.title || props.title}</h2><p className={styles.subtitle}>{props.subtitle}</p></div>{inline && <ResponsiveExpandButton onExpand={props.experience.requestFullscreen} />}</header>{props.children}{props.experience.showSource !== false && <div className={styles.source}>{props.source}</div>}</div></section>;
}

type ApprovalStatus = 'pending' | 'approved' | 'declined';
type ApprovalStage = 'queue' | 'review' | 'confirm' | 'decided';

export function ApprovalsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const requestedId = typeof props.toolProperties?.approvalId === 'string' ? props.toolProperties.approvalId : undefined;
  const [statuses, setStatuses] = React.useState<Record<string, ApprovalStatus>>({});
  const [selectedId, setSelectedId] = React.useState(requestedId || approvalFixtures[0].id);
  const [stage, setStage] = React.useState<ApprovalStage>(requestedId ? 'review' : 'queue');
  const [decision, setDecision] = React.useState<'approved' | 'declined'>('approved');
  const [reason, setReason] = React.useState('');
  const selected = approvalFixtures.find((approval) => approval.id === selectedId) || approvalFixtures[0];
  const selectedStatus = statuses[selected.id] || 'pending';
  const open = (id: string): void => { setSelectedId(id); setStage('review'); setReason(''); };
  const confirm = (): void => { setStatuses((current) => ({ ...current, [selected.id]: decision })); setStage('decided'); };
  usePublish(props, { intent: 'approvals', surface: props.surface, route: `personal/approvals/${stage}`, stage, summary: `${selected.title}: ${selectedStatus}`, visibleIds: approvalFixtures.map((approval) => approval.id), selectedId: selected.id, nextActions: stage === 'queue' ? ['Open approval'] : stage === 'review' ? ['Approve', 'Decline', 'Back'] : stage === 'confirm' ? ['Confirm decision', 'Edit'] : ['Back to approvals'] });
  return <WorkflowFrame experience={props} layout={`personal-approvals-${stage}`} eyebrow="My approvals / Decisions" title="Approvals that need you" subtitle="Review evidence, risk, and source details before making a decision." source="C05 / Session-local approval fixtures / Vacation approvals remain in C35">
    {stage === 'queue' && <div className={styles.list}>{approvalFixtures.map((approval) => { const person = getZavaPerson(approval.personId); const status = statuses[approval.id] || 'pending'; return <button key={approval.id} type="button" className={mergeClasses(styles.row, styles.rowButton)} onClick={() => open(approval.id)}><Avatar size={40} name={person.displayName} image={{ src: person.photoUrl }} /><span className={styles.itemCopy}><strong>{approval.title}</strong><span>{person.displayName} / {approval.due}</span><span className={styles.secondary}>{approval.summary}</span></span><Badge color={status === 'pending' ? 'warning' : status === 'approved' ? 'success' : 'danger'}>{status}</Badge></button>; })}</div>}
    {stage === 'review' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('queue')}>Back to approvals</Button><h3 className={styles.title}>{selected.title}</h3><p className={styles.subtitle}>{selected.summary}</p><div className={styles.evidenceGrid}>{selected.details.map(([label, value]) => <span key={label} className={styles.evidence}><span className={styles.secondary}>{label}</span><strong>{value}</strong></span>)}</div><div className={styles.risk}><strong>Decision context</strong><br />{selected.risk}</div>{selectedStatus === 'pending' && <div className={styles.actions}><Button appearance="primary" onClick={() => { setDecision('approved'); setStage('confirm'); }}>Approve</Button><Button onClick={() => { setDecision('declined'); setStage('confirm'); }}>Decline</Button></div>}{selectedStatus !== 'pending' && <Badge color={selectedStatus === 'approved' ? 'success' : 'danger'}>Already {selectedStatus}</Badge>}</div>}
    {stage === 'confirm' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('review')}>Edit decision</Button><h3 className={styles.title}>{decision === 'approved' ? 'Approve' : 'Decline'} {selected.title}</h3>{decision === 'declined' && <Field label="Reason" required><Textarea value={reason} onChange={(event) => setReason(event.currentTarget.value)} /></Field>}<Button appearance="primary" disabled={decision === 'declined' && !reason.trim()} onClick={confirm}>Confirm {decision === 'approved' ? 'approval' : 'decline'}</Button></div>}
    {stage === 'decided' && <SubmissionReceipt eyebrow="Decision recorded" title={`Approval ${decision}`} description={selected.title}
      tone={decision === 'declined' ? 'neutral' : 'success'} icon={decision === 'declined' ? <DismissCircle24Regular /> : undefined}
      details={[{ label: 'Reference', value: selected.id }, { label: 'Decision', value: decision === 'approved' ? 'Approved' : 'Declined' }, ...(decision === 'declined' ? [{ label: 'Reason', value: reason }] : [])]}
      note="Decision recorded for this session only. No external approval was submitted."
      actions={<Button appearance="primary" onClick={() => setStage('queue')}>Back to approvals</Button>} />}
  </WorkflowFrame>;
}

type TimeOffStage = 'list' | 'form' | 'review' | 'receipt';
type LeaveType = 'vacation' | 'sick' | 'personal';

export function TimeOffExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const initialStart = typeof props.toolProperties?.startDate === 'string' ? props.toolProperties.startDate : '';
  const initialEnd = typeof props.toolProperties?.endDate === 'string' ? props.toolProperties.endDate : '';
  const [stage, setStage] = React.useState<TimeOffStage>(initialStart || initialEnd ? 'form' : 'list');
  const [leaveType, setLeaveType] = React.useState<LeaveType>((props.toolProperties?.leaveType as LeaveType) || 'vacation');
  const [startDate, setStartDate] = React.useState(initialStart);
  const [endDate, setEndDate] = React.useState(initialEnd);
  const [reason, setReason] = React.useState(typeof props.toolProperties?.reason === 'string' ? props.toolProperties.reason : '');
  const [requests, setRequests] = React.useState<readonly { id: string; leaveType: string; dates: string; days: number; status: string }[]>(initialTimeOff);
  const days = businessDays(startDate, endDate);
  const submit = (): void => { const id = `PTO-2026-${String(900 + requests.length)}`; setRequests((current) => [{ id, leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1), dates: `${startDate} to ${endDate}`, days, status: 'Pending approval' }, ...current]); setStage('receipt'); };
  const resetForm = (): void => { setStartDate(''); setEndDate(''); setReason(''); setStage('form'); };
  usePublish(props, { intent: 'timeOff', surface: props.surface, route: `personal/time-off/${stage}`, stage, summary: stage === 'list' ? `${requests.length} submitted time-off requests` : `${days} working days / ${leaveType}`, visibleIds: requests.map((request) => request.id), nextActions: stage === 'list' ? ['Request new time off'] : stage === 'form' ? ['Review request'] : stage === 'review' ? ['Edit', 'Submit request'] : ['Back to requests'] });
  return <WorkflowFrame experience={props} layout={`personal-time-off-${stage}`} eyebrow="Time off / Private to you" title="Time off" subtitle="Review submitted requests or create a complete request for manager approval." source="C16 / Session-local leave fixture / Reload resets new requests">
    {stage === 'list' && <><div className={styles.actions}><Button appearance="primary" onClick={resetForm}>Request new time off</Button><Badge appearance="outline">18 vacation days available</Badge></div><div className={styles.list}>{requests.map((request) => <div key={request.id} className={styles.row}><Calendar24Regular /><span className={styles.itemCopy}><strong>{request.leaveType} / {request.dates}</strong><span className={styles.secondary}>{request.days} working day{request.days === 1 ? '' : 's'} / {request.id}</span></span><Badge color={request.status === 'Approved' ? 'success' : 'warning'}>{request.status}</Badge></div>)}</div></>}
    {stage === 'form' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('list')}>Back to requests</Button><div className={styles.formGrid}><Field label="Leave type" required><Select value={leaveType} onChange={(event) => setLeaveType(event.currentTarget.value as LeaveType)}><option value="vacation">Vacation</option><option value="sick">Sick leave</option><option value="personal">Personal day</option></Select></Field><Field label="Start date" required><Input type="date" value={startDate} onChange={(_, data) => setStartDate(data.value)} /></Field><Field label="End date" required><Input type="date" value={endDate} onChange={(_, data) => setEndDate(data.value)} /></Field></div><Field label="Reason" required><Textarea value={reason} onChange={(event) => setReason(event.currentTarget.value)} placeholder="Add the context your manager needs." /></Field><div className={styles.risk}><strong>{days} working day{days === 1 ? '' : 's'}</strong><br />Projected vacation balance: {Math.max(0, 18 - days)} days. Team coverage remains healthy.</div><Button appearance="primary" disabled={!days || reason.trim().length < 4} onClick={() => setStage('review')}>Review request</Button></div>}
    {stage === 'review' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('form')}>Edit request</Button><h3 className={styles.title}>Review time-off request</h3><div className={styles.evidenceGrid}><span className={styles.evidence}><span className={styles.secondary}>Leave type</span><strong>{leaveType}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Dates</span><strong>{startDate} to {endDate}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Working days</span><strong>{days}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Approver</span><strong>Manager / Megan Bowen</strong></span></div><p>{reason}</p><Button appearance="primary" onClick={submit}>Submit time-off request</Button></div>}
    {stage === 'receipt' && <SubmissionReceipt eyebrow="Request recorded" title="Time-off request submitted" description="Your request is ready for manager review."
      details={[{ label: 'Dates', value: `${startDate} to ${endDate}` }, { label: 'Working days', value: days }, { label: 'Status', value: 'Pending manager approval' }]}
      note="Session-only demo request. No leave request was sent to HR."
      actions={<Button appearance="primary" onClick={() => setStage('list')}>View submitted requests</Button>} />}
  </WorkflowFrame>;
}

export function EquityExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [selectedQuarter, setSelectedQuarter] = React.useState(equityData[equityData.length - 1].quarter);
  const selected = equityData.find((item) => item.quarter === selectedQuarter) || equityData[equityData.length - 1];
  const currency = typeof props.toolProperties?.currency === 'string' ? props.toolProperties.currency : 'EUR';
  const symbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€';
  const width = 620; const height = 280; const margin = { top: 20, right: 20, bottom: 48, left: 64 };
  const x = scaleBand<string>().domain(equityData.map((item) => item.quarter)).range([margin.left, width - margin.right]).padding(0.24);
  const y = scaleLinear().domain([0, max(equityData, (item) => item.value) || 16000]).nice().range([height - margin.bottom, margin.top]);
  const pastYear = equityData.slice(0, 4).reduce((sum, item) => sum + item.value, 0);
  usePublish(props, { intent: 'equity', surface: props.surface, route: `personal/equity/${selected.quarter}`, stage: 'valuation', summary: `${selected.quarter}: ${symbol}${selected.value.toLocaleString()} ${selected.kind.toLowerCase()}`, visibleIds: equityData.map((item) => item.quarter), selectedId: selected.quarter, nextActions: ['Select quarter', 'Review grant details', 'Expand'] });
  return <WorkflowFrame experience={props} layout="personal-equity-valuation" eyebrow="Equity / Estimated values" title="Equity and vesting" subtitle="Received value and forward estimates are separated clearly; values are not tax or investment advice." source="C19 / Fictional equity fixture / Estimate based on current share value">
    <div className={styles.metricGrid}><span className={styles.metric}><span className={styles.secondary}>Current share value</span><strong className={styles.metricValue}>{symbol}65.00</strong><span>As of {formatDate(dateOnlyAtDayOffset(-1), { month: 'short', day: 'numeric', year: 'numeric' })}</span></span><span className={styles.metric}><span className={styles.secondary}>Past year value received</span><strong className={styles.metricValue}>{symbol}{pastYear.toLocaleString()}</strong><span>960 vested units</span></span><span className={styles.metric}><span className={styles.secondary}>Next quarter estimate</span><strong className={styles.metricValue}>{symbol}15,600</strong><span>240 units / {formatDate(dateOnlyAtDayOffset(75))}</span></span></div>
    <figure className={styles.chart} aria-label="Quarterly equity value"><svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img"><title>Quarterly received and estimated equity value</title>{equityData.map((item) => { const barX = x(item.quarter) || 0; const barY = y(item.value); return <g key={item.quarter} role="button" tabIndex={0} aria-label={`${item.quarter}: ${symbol}${item.value.toLocaleString()} ${item.kind}`} onClick={() => setSelectedQuarter(item.quarter)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedQuarter(item.quarter); }}><rect className={item.kind === 'Estimate' ? styles.estimateBar : styles.actualBar} x={barX} y={barY} width={x.bandwidth()} height={height - margin.bottom - barY} rx={4} /><text className={styles.axisLabel} x={barX + x.bandwidth() / 2} y={height - 24} textAnchor="middle">{item.quarter}</text><text className={styles.axisLabel} x={barX + x.bandwidth() / 2} y={barY - 6} textAnchor="middle">{symbol}{Math.round(item.value / 1000)}k</text></g>; })}</svg><table className={styles.chartTable}><caption>Exact quarterly equity values</caption><thead><tr><th className={styles.cell}>Quarter</th><th className={styles.cell}>Type</th><th className={styles.cell}>Value</th></tr></thead><tbody>{equityData.map((item) => <tr key={item.quarter}><td className={styles.cell}>{item.quarter}</td><td className={styles.cell}>{item.kind}</td><td className={styles.cell}>{symbol}{item.value.toLocaleString()}</td></tr>)}</tbody></table></figure>
    <div className={styles.detail}><h3 className={styles.title}>{selected.quarter} details</h3><div className={styles.evidenceGrid}><span className={styles.evidence}><span className={styles.secondary}>Value</span><strong>{symbol}{selected.value.toLocaleString()}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Status</span><strong>{selected.kind}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Units</span><strong>240</strong></span><span className={styles.evidence}><span className={styles.secondary}>Reference price</span><strong>{symbol}65.00</strong></span></div><Button>Review grant details</Button></div>
  </WorkflowFrame>;
}

type BookingStage = 'criteria' | 'loading' | 'results' | 'confirm' | 'receipt';

export function WorkplaceSpaceExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [stage, setStage] = React.useState<BookingStage>('criteria');
  const [office, setOffice] = React.useState(typeof props.toolProperties?.office === 'string' ? props.toolProperties.office : 'Helsinki');
  const [date, setDate] = React.useState(typeof props.toolProperties?.date === 'string' ? props.toolProperties.date : dateOnlyAtDayOffset(7));
  const [time, setTime] = React.useState(typeof props.toolProperties?.time === 'string' ? props.toolProperties.time : '14:00');
  const [duration, setDuration] = React.useState(String(typeof props.toolProperties?.durationMinutes === 'number' ? props.toolProperties.durationMinutes : 60));
  const [capacity, setCapacity] = React.useState(String(typeof props.toolProperties?.capacity === 'number' ? props.toolProperties.capacity : 4));
  const [selectedId, setSelectedId] = React.useState<string>();
  const rooms = (roomsByOffice[office] || []).filter((room) => room.capacity >= Number(capacity));
  const selected = rooms.find((room) => room.id === selectedId);
  const search = (): void => { setStage('loading'); globalThis.setTimeout(() => setStage('results'), 700); };
  usePublish(props, { intent: 'workplaceSpace', surface: props.surface, route: `personal/workplace/${stage}`, stage, summary: `${office} / ${date} ${time} / ${rooms.length} rooms`, visibleIds: rooms.map((room) => room.id), selectedId, filters: { office, date, time, capacity }, nextActions: stage === 'criteria' ? ['Search rooms'] : stage === 'results' ? ['Select room'] : stage === 'confirm' ? ['Confirm booking', 'Back'] : ['Book another room'] });
  return <WorkflowFrame experience={props} layout={`personal-workplace-${stage}`} eyebrow="Workplace / Room booking" title="Find a room" subtitle="Choose office and local time, wait for availability, then review and confirm one room." source="C22 / Session-local workplace fixture / Availability rechecked during confirmation">
    {stage === 'criteria' && <div className={styles.detail}><div className={styles.formGrid}><Field label="Office"><Select value={office} onChange={(event) => setOffice(event.currentTarget.value)}>{Object.keys(roomsByOffice).map((name) => <option key={name}>{name}</option>)}</Select></Field><Field label="Date"><Input type="date" value={date} onChange={(_, data) => setDate(data.value)} /></Field><Field label="Start time"><Input type="time" value={time} onChange={(_, data) => setTime(data.value)} /></Field><Field label="Duration"><Select value={duration} onChange={(event) => setDuration(event.currentTarget.value)}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></Select></Field><Field label="People"><Input type="number" min={1} max={20} value={capacity} onChange={(_, data) => setCapacity(data.value)} /></Field></div><Button appearance="primary" icon={<Search24Regular />} disabled={!date || !time || Number(capacity) < 1} onClick={search}>Search available rooms</Button></div>}
    {stage === 'loading' && <div className={styles.loading} role="status"><Spinner /><span>Checking {office} rooms for {date} at {time}…</span></div>}
    {stage === 'results' && <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('criteria')}>Change search</Button><div className={styles.roomGrid}>{rooms.map((room) => <button key={room.id} type="button" className={mergeClasses(styles.room, selectedId === room.id && styles.roomSelected)} onClick={() => setSelectedId(room.id)}><strong>{room.name}</strong><span>{room.capacity} people</span><span className={styles.secondary}>{room.features}</span><Badge color="success">Available</Badge></button>)}</div>{!rooms.length && <div className={styles.risk}>No rooms match this capacity. Change office, time, or people count.</div>}<Button appearance="primary" disabled={!selected} onClick={() => setStage('confirm')}>Review booking</Button></>}
    {stage === 'confirm' && selected && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('results')}>Back to rooms</Button><h3 className={styles.title}>{selected.name}</h3><div className={styles.evidenceGrid}><span className={styles.evidence}><span className={styles.secondary}>Office</span><strong>{office}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Date and time</span><strong>{date} / {time}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Duration</span><strong>{duration} minutes</strong></span><span className={styles.evidence}><span className={styles.secondary}>Capacity</span><strong>{selected.capacity}</strong></span></div><Button appearance="primary" onClick={() => setStage('receipt')}>Confirm room booking</Button></div>}
    {stage === 'receipt' && selected && <SubmissionReceipt eyebrow="Booking recorded" title="Room booked" description={`${selected.name} in ${office} is selected for your meeting.`}
      details={[{ label: 'Date and time', value: `${date} at ${time}` }, { label: 'Duration', value: `${duration} minutes` }, { label: 'Reference', value: `ROOM-${selected.id}-2026` }]}
      note="Session-only demo booking. No room reservation was sent to a workplace service."
      actions={<Button appearance="primary" onClick={() => { setSelectedId(undefined); setStage('criteria'); }}>Book another room</Button>} />}
  </WorkflowFrame>;
}

type ItView = 'mine' | 'known' | 'new';
type ItStage = 'form' | 'review' | 'receipt';

export function ItHelpExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const hasDraft = ['category', 'impact', 'summary', 'description'].some((property) => props.toolProperties?.[property] !== undefined);
  const [view, setView] = React.useState<ItView>(hasDraft ? 'new' : 'mine');
  const [stage, setStage] = React.useState<ItStage>('form');
  const [issues, setIssues] = React.useState(initialPersonalIssues);
  const [selectedId, setSelectedId] = React.useState<string>();
  const [category, setCategory] = React.useState(typeof props.toolProperties?.category === 'string' ? props.toolProperties.category : 'Device');
  const [impact, setImpact] = React.useState(typeof props.toolProperties?.impact === 'string' ? props.toolProperties.impact : 'Medium');
  const [summary, setSummary] = React.useState(typeof props.toolProperties?.summary === 'string' ? props.toolProperties.summary : '');
  const [description, setDescription] = React.useState(typeof props.toolProperties?.description === 'string' ? props.toolProperties.description : '');
  const selectedPersonal = issues.find((issue) => issue.id === selectedId);
  const selectedKnown = knownIssues.find((issue) => issue.id === selectedId);
  const submit = (): void => { const id = `ZIT-${2850 + issues.length}`; setIssues((current) => [{ id, title: summary, category, impact, status: 'Open', detail: description }, ...current]); setSelectedId(id); setStage('receipt'); };
  const openNew = (): void => { setView('new'); setStage(summary ? 'review' : 'form'); setSelectedId(undefined); };
  const closeNew = (): void => { setView('mine'); setStage('form'); setSelectedId(undefined); };
  usePublish(props, { intent: 'itHelp', surface: props.surface, route: `personal/it/${view}/${stage}`, stage: view === 'new' ? stage : view, summary: view === 'mine' ? `${issues.length} personal IT issues` : view === 'known' ? `${knownIssues.length} known issues` : summary || 'New IT issue', visibleIds: view === 'mine' ? issues.map((issue) => issue.id) : view === 'known' ? knownIssues.map((issue) => issue.id) : selectedId ? [selectedId] : [], selectedId, nextActions: view === 'mine' ? ['Open issue', 'Submit new IT issue'] : view === 'known' ? ['Open known issue'] : stage === 'form' ? ['Review issue'] : stage === 'review' ? ['Edit', 'Submit IT issue'] : ['View my issues'] });
  return <WorkflowFrame experience={props} layout={`personal-it-${view}-${stage}`} eyebrow="IT support / Private requests" title="IT help" subtitle="Review your issues, check known service incidents, or submit a complete new issue." source="C23 / Session-local ITSM fixture / Secrets and unrestricted logs are never requested">
    {view !== 'new' && <><div className={styles.actions}><Button appearance="primary" icon={<Add24Regular />} onClick={openNew}>Submit new issue</Button></div><div className={styles.tabs} role="tablist"><button className={mergeClasses(styles.tab, view === 'mine' && styles.tabSelected)} role="tab" aria-selected={view === 'mine'} onClick={() => { setView('mine'); setSelectedId(undefined); }}>My issues</button><button className={mergeClasses(styles.tab, view === 'known' && styles.tabSelected)} role="tab" aria-selected={view === 'known'} onClick={() => { setView('known'); setSelectedId(undefined); }}>Known issues</button></div></>}
    {view === 'mine' && !selectedPersonal && <div className={styles.list}>{issues.map((issue) => <button key={issue.id} type="button" className={mergeClasses(styles.row, styles.rowButton)} onClick={() => setSelectedId(issue.id)}><Document24Regular /><span className={styles.itemCopy}><strong>{issue.title}</strong><span className={styles.secondary}>{issue.category} / {issue.impact} impact / {issue.id}</span></span><Badge color={issue.status === 'Open' ? 'warning' : 'informative'}>{issue.status}</Badge></button>)}</div>}
    {view === 'mine' && selectedPersonal && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setSelectedId(undefined)}>Back to my issues</Button><h3 className={styles.title}>{selectedPersonal.title}</h3><p>{selectedPersonal.detail}</p><div className={styles.evidenceGrid}><span className={styles.evidence}><span className={styles.secondary}>Reference</span><strong>{selectedPersonal.id}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Category</span><strong>{selectedPersonal.category}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Impact</span><strong>{selectedPersonal.impact}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Status</span><strong>{selectedPersonal.status}</strong></span></div></div>}
    {view === 'known' && !selectedKnown && <div className={styles.list}>{knownIssues.map((issue) => <button key={issue.id} type="button" className={mergeClasses(styles.row, styles.rowButton)} onClick={() => setSelectedId(issue.id)}><ShieldLock24Regular /><span className={styles.itemCopy}><strong>{issue.title}</strong><span className={styles.secondary}>{issue.id}</span></span><Badge color={issue.status === 'Resolved' ? 'success' : 'warning'}>{issue.status}</Badge></button>)}</div>}
    {view === 'known' && selectedKnown && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setSelectedId(undefined)}>Back to known issues</Button><h3 className={styles.title}>{selectedKnown.title}</h3><p>{selectedKnown.detail}</p><Badge color={selectedKnown.status === 'Resolved' ? 'success' : 'warning'}>{selectedKnown.status}</Badge></div>}
    {view === 'new' && stage === 'form' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={closeNew}>Back to my issues</Button><div className={styles.privacy}><ShieldLock24Regular /><span><strong>Private IT intake</strong><br />Do not include passwords, access tokens, or unrelated personal data.</span></div><div className={styles.formGrid}><Field label="Category" required><Select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>{['Access', 'Device', 'Network', 'Software', 'Other'].map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Impact" required><Select value={impact} onChange={(event) => setImpact(event.currentTarget.value)}>{['Low', 'Medium', 'High'].map((item) => <option key={item}>{item}</option>)}</Select></Field></div><Field label="Summary" required><Input value={summary} onChange={(_, data) => setSummary(data.value)} /></Field><Field label="Description" required><Textarea value={description} onChange={(event) => setDescription(event.currentTarget.value)} /></Field><Button appearance="primary" disabled={summary.trim().length < 5 || description.trim().length < 12} onClick={() => setStage('review')}>Review IT issue</Button></div>}
    {view === 'new' && stage === 'review' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('form')}>Edit issue</Button><h3 className={styles.title}>{summary}</h3><p>{description}</p><div className={styles.evidenceGrid}><span className={styles.evidence}><span className={styles.secondary}>Category</span><strong>{category}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Impact</span><strong>{impact}</strong></span><span className={styles.evidence}><span className={styles.secondary}>Destination</span><strong>Zava IT service desk</strong></span></div><Button appearance="primary" onClick={submit}>Submit IT issue</Button></div>}
    {view === 'new' && stage === 'receipt' && <SubmissionReceipt eyebrow="Issue recorded" title="IT issue submitted" description={summary}
      details={[{ label: 'Reference', value: selectedId }, { label: 'Status', value: 'Open' }, { label: 'Target response', value: '4 business hours' }]}
      note="Session-only demo issue. No ticket was sent to the IT service."
      actions={<Button appearance="primary" onClick={() => { setView('mine'); setStage('form'); }}>View my issues</Button>} />}
  </WorkflowFrame>;
}