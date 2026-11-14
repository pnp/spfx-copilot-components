import * as React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  ProgressBar,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  DocumentPdf24Regular,
  DocumentText24Regular,
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Flag16Filled,
  Food24Regular,
  PlayCircle24Regular,
  ReceiptMoney24Regular,
  SlideText24Regular,
  TableSimple24Regular,
  VehicleCar24Regular
} from '@fluentui/react-icons';
import { zavaLearningAssignments } from '../mockData/learning';
import { zavaNews } from '../mockData/news';
import { getZavaPerson, zavaPeople } from '../mockData/personas';
import type { IZavaExperienceProps, IZavaModelContextSnapshot } from '../models/zavaOne';
import { formatRecentDateTime, isoAtDayOffset } from '../utils/evergreenDates';
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
  summary: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL },
  progressRing: { display: 'grid', placeItems: 'center', width: '58px', height: '58px', flexShrink: 0, color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, border: `6px solid ${tokens.colorBrandStroke2}`, borderRadius: tokens.borderRadiusCircular, fontWeight: tokens.fontWeightSemibold },
  summaryCopy: { display: 'grid', gap: tokens.spacingVerticalXXS },
  list: { display: 'grid', gap: tokens.spacingVerticalXS },
  taskRow: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalS, borderRadius: tokens.borderRadiusMedium, ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover } },
  done: { textDecorationLine: 'line-through', color: tokens.colorNeutralForeground3 },
  itemCopy: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  secondary: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  priority: { color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold },
  mailRow: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'start', width: '100%', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: 'transparent', border: 0, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover } },
  avatarWrap: { position: 'relative' },
  unreadDot: { position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', backgroundColor: tokens.colorBrandBackground, border: `2px solid ${tokens.colorNeutralBackground1}`, borderRadius: tokens.borderRadiusCircular },
  mailTop: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  sender: { flexGrow: 1, minWidth: 0, fontWeight: tokens.fontWeightSemibold },
  mailSubject: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  flag: { color: tokens.colorPaletteRedForeground1 },
  selected: { backgroundColor: tokens.colorBrandBackground2 },
  detail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  learningRow: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, '@container zava-experience (max-width: 420px)': { gridTemplateColumns: 'auto minmax(0, 1fr)', '& > :last-child': { gridColumn: '2' } } },
  learningVideo: { display: 'grid', placeItems: 'center', width: '44px', height: '44px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusCircular },
  learningProgress: { display: 'grid', gap: tokens.spacingVerticalXXS, marginTop: tokens.spacingVerticalXS },
  learningDetail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  newsRow: { display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium },
  newsImage: { width: '72px', height: '56px', objectFit: 'cover', borderRadius: tokens.borderRadiusMedium },
  expenseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: tokens.spacingHorizontalM },
  expenseCard: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge },
  expenseSelected: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}` },
  carouselHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
  carouselControls: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: tokens.spacingHorizontalM },
  expenseIcon: { display: 'grid', placeItems: 'center', width: '44px', height: '44px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusCircular },
  amount: { fontSize: tokens.fontSizeBase600, fontWeight: tokens.fontWeightSemibold },
  shiftList: { display: 'grid', gap: tokens.spacingVerticalS },
  shiftRow: { display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, '@container zava-experience (max-width: 420px)': { gridTemplateColumns: '72px minmax(0, 1fr)', '& > :last-child': { gridColumn: '2' } } },
  shiftNext: { backgroundColor: tokens.colorBrandBackground2, border: `1px solid ${tokens.colorBrandStroke2}` },
  shiftTime: { fontVariantNumeric: 'tabular-nums', fontWeight: tokens.fontWeightSemibold },
  fileList: { display: 'grid', gap: tokens.spacingVerticalS },
  fileRow: { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, '@container zava-experience (max-width: 420px)': { gridTemplateColumns: '40px minmax(0, 1fr)', '& > :last-child': { gridColumn: '2' } } },
  fileIcon: { display: 'grid', placeItems: 'center', width: '40px', height: '40px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusMedium },
  wordIcon: { color: '#ffffff', backgroundColor: '#185abd' },
  powerPointIcon: { color: '#ffffff', backgroundColor: '#c43e1c' },
  excelIcon: { color: '#ffffff', backgroundColor: '#107c41' },
  pdfIcon: { color: '#ffffff', backgroundColor: '#d13438' },
  empty: { padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground3, textAlign: 'center', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge }
});

function usePublish(props: IZavaExperienceProps, snapshot: IZavaModelContextSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const ref = React.useRef(snapshot);
  ref.current = snapshot;
  React.useEffect(() => {
    props.publishContext?.(ref.current).catch(() => undefined);
  }, [props.publishContext, signature]);
}

function PersonalFrame(props: { experience: IZavaExperienceProps; layout: string; eyebrow: string; title: string; subtitle: string; source: string; children: React.ReactNode }): React.ReactElement {
  const styles = useStyles();
  const inline = props.experience.surface === 'copilotInline';
  return (
    <section className={mergeClasses(styles.root, inline && styles.inline)} data-layout={props.layout}>
      <div className={styles.frame}>
        <div className={styles.strip} />
        <header className={styles.header}><div className={styles.heading}><span className={styles.overline}>{props.eyebrow}</span><h2 className={styles.title}>{props.experience.title || props.title}</h2><p className={styles.subtitle}>{props.subtitle}</p></div>{inline && <ResponsiveExpandButton onExpand={props.experience.requestFullscreen} />}</header>
        {props.children}
        {props.experience.showSource !== false && <div className={styles.source}>{props.source}</div>}
      </div>
    </section>
  );
}

const taskFixtures = [
  { id: 'launch-brief', title: 'Review Aurora launch brief', due: 'Due 11:00', source: 'Planner', high: true },
  { id: 'customer-proposal', title: 'Prepare customer proposal', due: 'Due 16:00', source: 'To Do', high: true },
  { id: 'accessibility-review', title: 'Book accessibility review', due: 'Due tomorrow', source: 'To Do', high: false }
] as const;

export function PersonalTaskList(): React.ReactElement {
  const styles = useStyles();
  const [completed, setCompleted] = React.useState<ReadonlySet<string>>(() => new Set());
  const toggle = (id: string): void => setCompleted((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const percent = Math.round((completed.size / taskFixtures.length) * 100);
  return (
    <>
      <div className={styles.summary}><span className={styles.progressRing}>{percent}%</span><span className={styles.summaryCopy}><strong>{completed.size} of {taskFixtures.length} done</strong><span className={styles.secondary}>{taskFixtures.length - completed.size} open personal tasks</span></span></div>
      <div className={styles.list}>{taskFixtures.map((task) => { const done = completed.has(task.id); return <div key={task.id} className={styles.taskRow}><Checkbox checked={done} aria-label={task.title} onChange={() => toggle(task.id)} /><span className={mergeClasses(styles.itemCopy, done && styles.done)}><strong>{task.title}</strong><span className={styles.secondary}>{task.source} / {task.due}</span></span>{!done && task.high && <span className={styles.priority}>High</span>}</div>; })}</div>
      <div className={styles.actions}><Button>Review in To Do</Button><Button>Review in Planner</Button></div>
    </>
  );
}

export function TasksExperience(props: IZavaExperienceProps): React.ReactElement {
  usePublish(props, { intent: 'tasks', surface: props.surface, route: 'personal/tasks', stage: 'checklist', summary: 'Three personal tasks with local completion state', visibleIds: taskFixtures.map((task) => task.id), nextActions: ['Complete task', 'Review in To Do', 'Review in Planner', 'Expand'] });
  return <PersonalFrame experience={props} layout="personal-tasks-checklist" eyebrow="My work / Personal tasks" title="Tasks that need your attention" subtitle="Complete demo tasks locally while preserving their source and due date." source="C04 / Planner + To Do fixtures / Local completion state"><PersonalTaskList /></PersonalFrame>;
}

const mailFixtures = [
  { id: 'town-hall', person: zavaPeople.miriam, subject: 'Town hall narrative ready', preview: 'The final leadership narrative and captions checklist are ready for review.', receivedAt: isoAtDayOffset(0, 8, 12), flagged: true, unread: true },
  { id: 'aurora-handoff', person: zavaPeople.diego, subject: 'Aurora handoff complete', preview: 'Customer deployment evidence and accessibility follow-ups are attached.', receivedAt: isoAtDayOffset(-1, 16, 35), flagged: false, unread: true },
  { id: 'lab-checklist', person: zavaPeople.johanna, subject: 'Accessibility lab checklist', preview: 'Three remaining actions need owners before the opening.', receivedAt: isoAtDayOffset(-3, 10, 20), flagged: true, unread: false }
] as const;

export function ImportantMailList(): React.ReactElement {
  const styles = useStyles();
  const [selectedId, setSelectedId] = React.useState<string>(mailFixtures[0].id);
  const selected = mailFixtures.find((mail) => mail.id === selectedId) || mailFixtures[0];
  return (
    <>
      <div className={styles.list}>{mailFixtures.map((mail) => <button key={mail.id} type="button" className={mergeClasses(styles.mailRow, mail.id === selectedId && styles.selected)} onClick={() => setSelectedId(mail.id)}><span className={styles.avatarWrap}><Avatar size={40} name={mail.person.displayName} image={{ src: mail.person.photoUrl }} />{mail.unread && <span className={styles.unreadDot} />}</span><span className={styles.itemCopy}><span className={styles.mailTop}><strong className={styles.sender}>{mail.person.displayName}</strong><span className={styles.secondary}>{formatRecentDateTime(mail.receivedAt)}</span></span><span className={styles.mailSubject}>{mail.flagged && <Flag16Filled className={styles.flag} />}<strong>{mail.subject}</strong></span><span className={styles.secondary}>{mail.preview}</span></span></button>)}</div>
      <div className={styles.detail}><div className={styles.mailTop}><Avatar size={32} name={selected.person.displayName} image={{ src: selected.person.photoUrl }} /><strong>{selected.subject}</strong></div><p className={styles.subtitle}>{selected.preview}</p><Button appearance="primary">Review in Outlook</Button></div>
    </>
  );
}

export function ImportantMailExperience(props: IZavaExperienceProps): React.ReactElement {
  usePublish(props, { intent: 'importantMail', surface: props.surface, route: 'personal/mail', stage: 'triage', summary: 'Three explainable important messages', visibleIds: mailFixtures.map((mail) => mail.id), selectedId: mailFixtures[0].id, nextActions: ['Select message', 'Review in Outlook', 'Expand'] });
  return <PersonalFrame experience={props} layout="personal-important-mail" eyebrow="Outlook / Private to you" title="Important mail" subtitle="Flagged, unread, or high-importance messages with sender identity and reason." source="C03 / Outlook-shaped fixture / Message bodies minimized"><ImportantMailList /></PersonalFrame>;
}

export function PersonalLearningList(props: { initialAssignmentId?: string } = {}): React.ReactElement {
  const styles = useStyles();
  const [selectedId, setSelectedId] = React.useState<string | undefined>(props.initialAssignmentId);
  const selected = zavaLearningAssignments.find((assignment) => assignment.id === selectedId);
  if (selected) {
    return <div className={styles.learningDetail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setSelectedId(undefined)}>Back to learning</Button><div className={styles.actions}><span className={styles.learningVideo}><PlayCircle24Regular /></span><Badge color={selected.required ? 'warning' : 'informative'}>{selected.required ? 'Required video' : 'Recommended video'}</Badge></div><h3 className={styles.title}>{selected.title}</h3><p className={styles.subtitle}>{selected.description}</p><div className={styles.reviewGrid}><span className={styles.itemCopy}><span className={styles.secondary}>Progress</span><strong>{selected.progress}% complete</strong></span><span className={styles.itemCopy}><span className={styles.secondary}>Duration</span><strong>{selected.durationMinutes} minutes</strong></span><span className={styles.itemCopy}><span className={styles.secondary}>Due date</span><strong>{selected.dueDate || 'No due date'}</strong></span></div>{selected.progress > 0 && <ProgressBar value={selected.progress / 100} aria-label={`${selected.progress}% complete`} />}<div className={styles.actions}><Button appearance="primary" icon={<PlayCircle24Regular />}>Continue video</Button><Button>Open learning source</Button></div></div>;
  }
  return <div className={styles.list}>{zavaLearningAssignments.map((assignment) => <div key={assignment.id} className={styles.learningRow}><span className={styles.learningVideo}><PlayCircle24Regular /></span><span className={styles.itemCopy}><strong>{assignment.title}</strong><span className={styles.secondary}>Video / {assignment.durationMinutes} minutes / Due {assignment.dueDate || 'No due date'}</span>{assignment.progress > 0 && <span className={styles.learningProgress}><ProgressBar value={assignment.progress / 100} aria-label={`${assignment.progress}% complete`} /><strong>{assignment.progress}% complete</strong></span>}</span><Button onClick={() => setSelectedId(assignment.id)}>Open details</Button></div>)}</div>;
}

export function PersonalLearningExperience(props: IZavaExperienceProps): React.ReactElement {
  usePublish(props, { intent: 'learning', surface: props.surface, route: 'personal/learning', stage: 'assignments', summary: 'Three required learning assignments', visibleIds: zavaLearningAssignments.map((assignment) => assignment.id), nextActions: ['Continue course', 'Open assignment', 'Expand'] });
  const assignmentId = typeof props.toolProperties?.assignmentId === 'string' ? props.toolProperties.assignmentId : undefined;
  return <PersonalFrame experience={props} layout="personal-required-learning" eyebrow="Learning / Private progress" title="Required learning" subtitle="Assignments prioritized by due date, progress, and source status." source="C13 / LMS-shaped fixture / Navigation never completes a course"><PersonalLearningList initialAssignmentId={assignmentId} /></PersonalFrame>;
}

export function PersonalNewsList(): React.ReactElement {
  const styles = useStyles();
  return <div className={styles.list}>{zavaNews.slice(0, 3).map((story) => { const author = getZavaPerson(story.authorId); return <div key={story.id} className={styles.newsRow}><img className={styles.newsImage} src={story.imageUrl} alt="" /><span className={styles.itemCopy}><strong>{story.title}</strong><span className={styles.secondary}>{story.category} / {author.displayName}</span><span>{story.summary}</span><Button appearance="subtle">Read story</Button></span></div>; })}</div>;
}

const expenseFixtures = [
  { id: 'hotel', title: 'Hotel / Berlin', amount: 365, status: 'Verified', icon: <ReceiptMoney24Regular /> },
  { id: 'taxi', title: 'Airport taxi', amount: 62.4, status: 'Category review', icon: <VehicleCar24Regular /> },
  { id: 'meal', title: 'Customer dinner', amount: 55.2, status: 'Receipt attached', icon: <Food24Regular /> },
  { id: 'rail', title: 'Airport rail ticket', amount: 28.5, status: 'Verified', icon: <ReceiptMoney24Regular /> },
  { id: 'lunch', title: 'Team lunch', amount: 74.8, status: 'Receipt attached', icon: <Food24Regular /> }
] as const;

type ExpenseStage = 'open' | 'create' | 'review' | 'receipt';

export function ExpensesTravelExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [stage, setStage] = React.useState<ExpenseStage>('open');
  const [openIds, setOpenIds] = React.useState<readonly string[]>(() => expenseFixtures.map((expense) => expense.id));
  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(() => new Set());
  const [offset, setOffset] = React.useState(0);
  const reportNameDefault = typeof props.toolProperties?.reportName === 'string' ? props.toolProperties.reportName : 'Berlin customer visit';
  const [reportName, setReportName] = React.useState(reportNameDefault);
  const openExpenses = expenseFixtures.filter((expense) => openIds.indexOf(expense.id) >= 0);
  const visibleExpenses = openExpenses.slice(offset, offset + 3);
  const selectedExpenses = expenseFixtures.filter((expense) => selectedIds.has(expense.id));
  const total = selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const toggleExpense = (id: string): void => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const submit = (): void => { setOpenIds((current) => current.filter((id) => !selectedIds.has(id))); setStage('receipt'); };
  usePublish(props, { intent: 'expensesTravel', surface: props.surface, route: `personal/expenses/${stage}`, stage, summary: stage === 'open' ? `${openExpenses.length} open expenses to submit` : `${selectedExpenses.length} expenses / €${total.toFixed(2)}`, visibleIds: stage === 'open' ? [...openIds] : selectedExpenses.map((expense) => expense.id), nextActions: stage === 'open' ? ['Browse open expenses', 'Create expense report'] : stage === 'create' ? ['Select expenses', 'Review report'] : stage === 'review' ? ['Edit report', 'Submit expense report'] : ['Back to open expenses'] });
  return <PersonalFrame experience={props} layout={`personal-expenses-${stage}`} eyebrow="Expenses / Private to you" title="Open expenses to submit" subtitle="Create a report from unsubmitted expenses, review the total, and submit it explicitly." source="C20 / Session-local expense fixture / Reload resets submissions">
    {stage === 'open' && <><div className={styles.carouselHeader}><span className={styles.itemCopy}><strong>{openExpenses.length} open expenses</strong><span className={styles.secondary}>Showing {openExpenses.length ? offset + 1 : 0}-{Math.min(offset + 3, openExpenses.length)}</span></span><span className={styles.carouselControls}><Button appearance="subtle" icon={<ArrowLeft24Regular />} aria-label="Previous expenses" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 1))} /><Button appearance="subtle" icon={<ArrowRight24Regular />} aria-label="Next expenses" disabled={offset + 3 >= openExpenses.length} onClick={() => setOffset(Math.min(Math.max(0, openExpenses.length - 3), offset + 1))} /></span></div><div className={styles.expenseGrid}>{visibleExpenses.map((expense) => <article key={expense.id} className={styles.expenseCard}><span className={styles.expenseIcon}>{expense.icon}</span><strong>{expense.title}</strong><span className={styles.amount}>€{expense.amount.toFixed(2)}</span><Badge color={expense.status === 'Category review' ? 'warning' : 'success'}>{expense.status}</Badge></article>)}</div><Button appearance="primary" disabled={!openExpenses.length} onClick={() => setStage('create')}>Create expense report</Button></>}
    {stage === 'create' && <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('open')}>Back to open expenses</Button><Field label="Report name"><Input value={reportName} onChange={(_, data) => setReportName(data.value)} /></Field><div className={styles.list}>{openExpenses.map((expense) => <label key={expense.id} className={mergeClasses(styles.expenseCard, selectedIds.has(expense.id) && styles.expenseSelected)}><Checkbox checked={selectedIds.has(expense.id)} onChange={() => toggleExpense(expense.id)} label={`${expense.title} / €${expense.amount.toFixed(2)}`} /><Badge appearance="outline">{expense.status}</Badge></label>)}</div><Button appearance="primary" disabled={!selectedIds.size || !reportName.trim()} onClick={() => setStage('review')}>Review expense report</Button></>}
    {stage === 'review' && <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('create')}>Edit report</Button><h3 className={styles.title}>{reportName}</h3><div className={styles.reviewGrid}><span className={styles.itemCopy}><span className={styles.secondary}>Expenses</span><strong>{selectedExpenses.length}</strong></span><span className={styles.itemCopy}><span className={styles.secondary}>Total</span><strong>€{total.toFixed(2)}</strong></span><span className={styles.itemCopy}><span className={styles.secondary}>Destination</span><strong>Manager approval</strong></span></div><Button appearance="primary" onClick={submit}>Submit expense report</Button></div>}
    {stage === 'receipt' && <SubmissionReceipt eyebrow="Report recorded" title="Expense report submitted" description={reportName}
      details={[{ label: 'Total', value: `€${total.toFixed(2)}` }, { label: 'Expenses', value: selectedExpenses.length }, { label: 'Reference', value: 'EXP-2026-0942' }, { label: 'Status', value: 'Pending manager approval' }]}
      note="Session-only demo report. No expenses were submitted to a finance service."
      actions={<Button appearance="primary" onClick={() => { setSelectedIds(new Set()); setOffset(0); setStage('open'); }}>Back to open expenses</Button>} />}
  </PersonalFrame>;
}

const shiftFixtures = [
  { id: 'sun', day: 'Sunday', time: '07:00-15:00', site: 'Seattle service desk', status: 'Next shift' },
  { id: 'mon', day: 'Monday', time: '09:00-17:00', site: 'Remote support', status: 'Scheduled' },
  { id: 'wed', day: 'Wednesday', time: '12:00-20:00', site: 'Seattle service desk', status: 'Swap available' }
] as const;

export function ShiftsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  usePublish(props, { intent: 'shifts', surface: props.surface, route: 'personal/shifts', stage: 'schedule', summary: 'Next shift Sunday at 07:00', visibleIds: shiftFixtures.map((shift) => shift.id), nextActions: ['Open shift', 'Review schedule', 'Expand'] });
  return <PersonalFrame experience={props} layout="personal-shifts-schedule" eyebrow="My schedule / Local time" title="Upcoming shifts" subtitle="Schedule, site, and swap status without claiming clock-in from conversation." source="C25 / Workforce fixture / Local times"><div className={styles.shiftList}>{shiftFixtures.map((shift, index) => <div key={shift.id} className={mergeClasses(styles.shiftRow, index === 0 && styles.shiftNext)}><span className={styles.shiftTime}>{shift.time}</span><span className={styles.itemCopy}><strong>{shift.day}</strong><span className={styles.secondary}>{shift.site}</span></span><Badge color={index === 0 ? 'informative' : 'subtle'}>{shift.status}</Badge></div>)}</div><Button>Review full schedule</Button></PersonalFrame>;
}

const fileFixtures = [
  { id: 'brief', name: 'Aurora launch brief.docx', type: 'Word', changedAt: isoAtDayOffset(0, 9, 20), change: 'Modified', location: 'Project Aurora' },
  { id: 'notes', name: 'Customer review notes.pptx', type: 'PowerPoint', changedAt: isoAtDayOffset(-1, 15, 10), change: 'Modified', location: 'Customer team' },
  { id: 'checklist', name: 'Accessibility checklist.xlsx', type: 'Excel', changedAt: isoAtDayOffset(-2, 11, 45), change: 'Modified', location: 'Helsinki lab' },
  { id: 'policy', name: 'Deployment policy.pdf', type: 'PDF', changedAt: isoAtDayOffset(-5, 13), change: 'Published', location: 'Operations' }
] as const;

function fileIcon(name: string, styles: ReturnType<typeof useStyles>): React.ReactElement {
  if (name.endsWith('.pptx')) return <span className={mergeClasses(styles.fileIcon, styles.powerPointIcon)}><SlideText24Regular /></span>;
  if (name.endsWith('.xlsx')) return <span className={mergeClasses(styles.fileIcon, styles.excelIcon)}><TableSimple24Regular /></span>;
  if (name.endsWith('.pdf')) return <span className={mergeClasses(styles.fileIcon, styles.pdfIcon)}><DocumentPdf24Regular /></span>;
  return <span className={mergeClasses(styles.fileIcon, styles.wordIcon)}><DocumentText24Regular /></span>;
}

export function WorkFilesExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const initialQuery = typeof props.toolProperties?.query === 'string' ? props.toolProperties.query : '';
  const [query, setQuery] = React.useState(initialQuery);
  const matches = fileFixtures.filter((file) => `${file.name} ${file.type} ${file.location}`.toLowerCase().includes(query.toLowerCase()));
  usePublish(props, { intent: 'workFiles', surface: props.surface, route: 'personal/files', stage: query ? 'search' : 'recent', summary: `${matches.length} matching work files`, visibleIds: matches.map((file) => file.id), filters: { query }, nextActions: ['Search files', 'Open file', 'Review in Microsoft 365', 'Expand'] });
  return <PersonalFrame experience={props} layout="personal-work-files" eyebrow="Microsoft 365 / Private to you" title="Recent files" subtitle="Search your accessible recent files with type, location, and modified time preserved." source="C29 / SharePoint + OneDrive-shaped fixture / Access preserved"><Field label="Search recent files"><Input value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Search by file name, project, or type" /></Field><div className={styles.fileList}>{matches.map((file) => <div key={file.id} className={styles.fileRow}>{fileIcon(file.name, styles)}<span className={styles.itemCopy}><strong>{file.name}</strong><span className={styles.secondary}>{file.type} / {file.change} {formatRecentDateTime(file.changedAt).toLowerCase()} / {file.location}</span></span><Button appearance="subtle">Open</Button></div>)}</div>{!matches.length && <div className={styles.empty}>No recent files match “{query}”.</div>}<Button>Review in Microsoft 365</Button></PersonalFrame>;
}