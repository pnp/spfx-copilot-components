import * as React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  BookOpen24Regular,
  Calendar24Regular,
  CheckmarkCircle24Filled,
  ChevronRight20Regular,
  Clock24Regular,
  Document24Regular,
  Mail24Regular,
  News24Regular,
  Search24Regular,
  Settings24Regular,
  ShieldLock24Regular,
  Sparkle24Regular
} from '@fluentui/react-icons';
import { zavaCapabilities } from '../catalog/capabilities';
import { zavaPeople } from '../mockData/personas';
import { zavaLearningAssignments } from '../mockData/learning';
import { zavaNews } from '../mockData/news';
import { dateOnlyAtDayOffset, EVERGREEN_NOW, formatDate } from '../utils/evergreenDates';
import type { IZavaExperienceProps, IZavaModelContextSnapshot } from '../models/zavaOne';
import { personalPortalColumnAssignments } from '../models/workspacePortalDefaults';
import {
  ImportantMailList,
  PersonalLearningList,
  PersonalNewsList,
  PersonalTaskList
} from './PersonalDetailExperiences';
import { PersonalPortalDnd } from './PersonalPortalDnd';
import { PersonalRightPanel } from './PersonalRightPanel';
import { ResponsiveExpandButton } from './ResponsiveExpandButton';
import { SubmissionReceipt } from './SubmissionReceipt';

const useStyles = makeStyles({
  root: { width: '100%', minWidth: 0, boxSizing: 'border-box', containerType: 'inline-size', containerName: 'zava-experience', overflowWrap: 'anywhere' },
  inline: { maxWidth: '720px', marginRight: 'auto', marginLeft: 'auto', padding: tokens.spacingHorizontalM },
  frame: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: tokens.spacingVerticalL, overflow: 'hidden', padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow4 },
  strip: { height: '5px', marginTop: `calc(-1 * ${tokens.spacingHorizontalL})`, marginRight: `calc(-1 * ${tokens.spacingHorizontalL})`, marginLeft: `calc(-1 * ${tokens.spacingHorizontalL})`, backgroundImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%)' },
  greeting: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForegroundOnBrand, backgroundImage: 'linear-gradient(135deg, #0f6cbd 0%, #8b3d88 100%)', borderRadius: tokens.borderRadiusLarge },
  greetingCopy: { display: 'grid', gap: tokens.spacingVerticalXXS, flexGrow: 1, minWidth: 0 },
  overline: { fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { marginTop: 0, marginBottom: 0, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold },
  heroTitle: { marginTop: 0, marginBottom: 0, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForegroundOnBrand },
  subtitle: { marginTop: 0, marginBottom: 0, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  invertedSubtitle: { marginTop: 0, marginBottom: 0, color: tokens.colorNeutralForegroundOnBrand, opacity: 0.88 },
  header: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'start', gap: tokens.spacingHorizontalL },
  heading: { display: 'grid', gap: tokens.spacingVerticalXXS },
  actions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  tileList: { display: 'grid', gap: tokens.spacingVerticalS },
  tile: { display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) auto', alignItems: 'center', gap: tokens.spacingHorizontalM, width: '100%', minWidth: 0, padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, textAlign: 'left', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  tileIcon: { display: 'grid', placeItems: 'center', width: '40px', height: '40px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusCircular },
  tileCopy: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  secondary: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  plan: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusLarge },
  planItem: { display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusMedium },
  rank: { display: 'grid', placeItems: 'center', width: '28px', height: '28px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusCircular, fontWeight: tokens.fontWeightSemibold },
  timeline: { display: 'grid' },
  timelineRow: { display: 'grid', gridTemplateColumns: '52px 16px minmax(0, 1fr)', gap: tokens.spacingHorizontalS, minWidth: 0 },
  time: { paddingTop: tokens.spacingVerticalM, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  rail: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  dot: { width: '10px', height: '10px', marginTop: tokens.spacingVerticalL, flexShrink: 0, backgroundColor: tokens.colorNeutralBackground1, border: `2px solid ${tokens.colorNeutralStroke1}`, borderRadius: tokens.borderRadiusCircular },
  dotActive: { backgroundColor: tokens.colorBrandBackground, border: `2px solid ${tokens.colorBrandBackground}` },
  line: { width: '2px', flexGrow: 1, backgroundColor: tokens.colorNeutralStroke2 },
  meeting: { display: 'grid', gap: tokens.spacingVerticalXS, marginBottom: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge },
  meetingActive: { backgroundColor: tokens.colorBrandBackground2, border: `1px solid ${tokens.colorBrandStroke2}` },
  glossaryGrid: { display: 'grid', gridTemplateColumns: 'minmax(180px, .65fr) minmax(0, 1.35fr)', gap: tokens.spacingHorizontalL, '@container zava-experience (max-width: 620px)': { gridTemplateColumns: '1fr' } },
  termList: { display: 'grid', gap: tokens.spacingVerticalXS, alignContent: 'start' },
  termButton: { display: 'grid', gap: tokens.spacingVerticalXXS, padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, textAlign: 'left', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, cursor: 'pointer' },
  termSelected: { backgroundColor: tokens.colorBrandBackground2, border: `1px solid ${tokens.colorBrandStroke1}` },
  definition: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  term: { margin: 0, color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold },
  metadata: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: tokens.spacingHorizontalM },
  metadataItem: { display: 'grid', gap: tokens.spacingVerticalXXS },
  securityHero: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'start', padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorPaletteRedBackground1, borderLeft: `4px solid ${tokens.colorPaletteRedBorder2}`, borderRadius: tokens.borderRadiusLarge },
  securityChoices: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: tokens.spacingHorizontalM },
  securityChoice: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground1, textAlign: 'left', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, cursor: 'pointer' },
  selectedChoice: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}` },
  review: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  source: { paddingTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  personalShell: { display: 'flex', width: '100%', minHeight: '100%', minWidth: 0, overflow: 'visible', backgroundColor: tokens.colorNeutralBackground2, '@container zava-experience (max-width: 900px)': { flexDirection: 'column' } },
  personalMain: { flexGrow: 1, minWidth: 0, overflow: 'visible' },
  personalHome: { display: 'grid', gap: tokens.spacingVerticalXL, paddingRight: tokens.spacingHorizontalXS },
  personalHero: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL, padding: tokens.spacingHorizontalXL, color: tokens.colorNeutralForegroundOnBrand, backgroundImage: 'linear-gradient(135deg, #0f6cbd 0%, #6b3f91 100%)', borderRadius: tokens.borderRadiusLarge, flexWrap: 'wrap' },
  personalIdentity: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flexGrow: 1, minWidth: 0 },
  planBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalL, padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXL}`, color: tokens.colorNeutralForegroundOnBrand, backgroundImage: `linear-gradient(120deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorCompoundBrandBackgroundPressed} 100%)`, borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow8, flexWrap: 'wrap' },
  planBannerLead: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM, flex: '1 1 420px', minWidth: 0, textAlign: 'left' },
  planBannerIcon: { display: 'grid', placeItems: 'center', width: '44px', height: '44px', flexShrink: 0, color: tokens.colorNeutralForegroundOnBrand, backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: tokens.borderRadiusCircular },
  planBannerCopy: { flexGrow: 1, minWidth: 0, textAlign: 'left' },
  planBannerText: { color: tokens.colorNeutralForegroundOnBrand },
  planBannerButton: { flexShrink: 0, marginLeft: 'auto', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorNeutralBackground1, ':hover': { color: tokens.colorBrandForeground1, backgroundColor: tokens.colorNeutralBackground1Hover }, ':hover:active': { color: tokens.colorBrandForeground1, backgroundColor: tokens.colorNeutralBackground1Pressed } },
  dashboardTitle: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  compactList: { display: 'grid', gap: tokens.spacingVerticalXS },
  compactRow: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalS, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  settingsList: { display: 'grid', gap: tokens.spacingVerticalS },
  settingsBody: { display: 'grid', gap: tokens.spacingVerticalL, alignContent: 'start' },
  thinking: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: tokens.spacingVerticalM, minHeight: '200px', color: tokens.colorNeutralForeground3 },
  shimmer: { width: '100%', height: '3px', marginBottom: tokens.spacingVerticalM, backgroundImage: `linear-gradient(90deg, ${tokens.colorNeutralBackground3} 0%, ${tokens.colorBrandBackground} 50%, ${tokens.colorNeutralBackground3} 100%)`, backgroundSize: '200% 100%', backgroundRepeat: 'no-repeat', borderRadius: tokens.borderRadiusCircular, animationName: { from: { backgroundPositionX: '200%' }, to: { backgroundPositionX: '-200%' } }, animationDuration: '1.3s', animationIterationCount: 'infinite', animationTimingFunction: 'linear' },
  focusHeadline: { display: 'block', marginBottom: tokens.spacingVerticalL, color: tokens.colorNeutralForeground2 },
  focusList: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  focusItem: { position: 'relative', display: 'flex', gap: tokens.spacingHorizontalM, width: '100%', overflow: 'hidden', padding: tokens.spacingHorizontalM, boxSizing: 'border-box', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow2, animationName: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } }, animationDuration: tokens.durationSlow, animationTimingFunction: tokens.curveDecelerateMid, animationFillMode: 'both' },
  focusRail: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '4px', backgroundColor: tokens.colorBrandStroke1 },
  focusRank: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', flexShrink: 0, color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusCircular },
  focusCopy: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  focusTitle: { display: 'inline-flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, fontWeight: tokens.fontWeightSemibold },
  focusReason: { color: tokens.colorNeutralForeground3 },
  focusTime: { alignSelf: 'flex-start', marginTop: tokens.spacingVerticalXXS, padding: `1px ${tokens.spacingHorizontalS}`, color: tokens.colorNeutralForeground2, backgroundColor: tokens.colorNeutralBackground3, borderRadius: tokens.borderRadiusCircular }
});

function usePublish(props: IZavaExperienceProps, snapshot: IZavaModelContextSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const snapshotRef = React.useRef(snapshot);
  snapshotRef.current = snapshot;
  React.useEffect(() => {
    props.publishContext?.(snapshotRef.current).catch(() => undefined);
  }, [props.publishContext, signature]);
}

function SpectrumFrame(props: { children: React.ReactNode; inline: boolean; layout: string; showSource?: boolean; source: string }): React.ReactElement {
  const styles = useStyles();
  return (
    <section className={mergeClasses(styles.root, props.inline && styles.inline)} data-layout={props.layout}>
      <div className={styles.frame}>
        <div className={styles.strip} />
        {props.children}
        {props.showSource !== false && <div className={styles.source}>{props.source}</div>}
      </div>
    </section>
  );
}

const meetings = [
  { id: 'cx-review', time: '09:30', end: '10:15', title: 'Customer experience review', location: 'Teams', status: 'next' },
  { id: 'aurora', time: '11:00', end: '11:45', title: 'Aurora launch readiness', location: 'Studio 4', status: 'upcoming' },
  { id: 'accessibility', time: '14:00', end: '14:30', title: 'Accessibility lab opening', location: 'Helsinki lab', status: 'upcoming' },
  { id: 'coaching', time: '16:30', end: '17:00', title: 'Weekly coaching', location: 'Teams', status: 'upcoming' }
] as const;

function AgendaTimeline(props: { allowActions?: boolean; onlyNext?: boolean }): React.ReactElement {
  const styles = useStyles();
  const visibleMeetings = props.onlyNext ? meetings.slice(0, 1) : meetings;
  return (
    <div className={styles.timeline} aria-label="Agenda timeline">
      {visibleMeetings.map((meeting, index) => {
        const active = meeting.status === 'next';
        return (
          <div key={meeting.id} className={styles.timelineRow}>
            <span className={styles.time}>{meeting.time}</span>
            <span className={styles.rail}><span className={mergeClasses(styles.dot, active && styles.dotActive)} />{index < visibleMeetings.length - 1 && <span className={styles.line} />}</span>
            <div className={mergeClasses(styles.meeting, active && styles.meetingActive)}>
              <strong>{meeting.title}</strong>
              <span className={styles.secondary}>{meeting.time}-{meeting.end} / {meeting.location}</span>
              <div className={styles.actions}>{active && <Badge color="informative">Next</Badge>}{active && meeting.location === 'Teams' && props.allowActions !== false && <Button appearance="primary" size="small">Join meeting</Button>}<Button appearance="subtle" size="small">Review in Outlook</Button></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MyDayExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [view, setView] = React.useState<'summary' | 'agenda' | 'tasks' | 'mail' | 'learning' | 'news' | 'plan'>(props.primaryView === 'agenda' || (props.primaryView === 'plan' && props.showPlanMyDay !== false) ? props.primaryView as 'agenda' | 'plan' : 'summary');
  const firstName = props.currentUserName.split(' ')[0] || 'Megan';
  usePublish(props, {
    intent: 'myDay', surface: props.surface, route: `personal/my-day/${view}`, stage: view,
    summary: view === 'summary' ? 'One meeting, three priorities, and required learning' : view === 'agenda' ? 'Four meetings today' : view === 'tasks' ? 'Three personal tasks' : view === 'mail' ? 'Three important messages' : view === 'learning' ? 'Three required learning assignments' : view === 'news' ? 'Three current company stories' : 'Three-item focus plan',
    visibleIds: view === 'agenda' ? meetings.map((meeting) => meeting.id) : ['cx-review', 'launch-brief', 'learning-data-care'],
    nextActions: view === 'summary' ? ['Open agenda', 'Plan my day', 'View in full screen'] : ['Back to summary']
  });

  return (
    <SpectrumFrame inline={inline} layout={`my-day-${view}`} showSource={props.showSource} source="C01 / Personal briefing / Outlook, tasks, learning, and company signals / Demo data">
      {view === 'summary' ? (
        <>
          <div className={styles.greeting}>
            <span className={styles.tileIcon}><Clock24Regular /></span>
            <div className={styles.greetingCopy}><span className={styles.overline}>{formatDate(EVERGREEN_NOW, { weekday: 'long', month: 'long', day: 'numeric' })}</span><h2 className={styles.heroTitle}>Good afternoon, {firstName}.</h2><p className={styles.invertedSubtitle}>Your next customer review starts at 09:30. Three items deserve attention before then.</p></div>
            <Avatar name={props.currentUserName} image={{ src: zavaPeople.megan.photoUrl }} size={48} />
            {inline && <ResponsiveExpandButton onExpand={props.requestFullscreen} inverted />}
          </div>
          <div className={styles.actions}>{props.showPlanMyDay !== false && <Button appearance="primary" icon={<Sparkle24Regular />} onClick={() => setView('plan')}>Plan my day</Button>}<Badge appearance="outline">Private to you</Badge></div>
          <div className={styles.tileList}>
            {props.showAgenda !== false && <button className={styles.tile} type="button" onClick={() => setView('agenda')}><span className={styles.tileIcon}><Calendar24Regular /></span><span className={styles.tileCopy}><strong>Next meeting</strong><span>Customer experience review</span><span className={styles.secondary}>09:30-10:15 / Teams / Starts in 45 minutes</span></span><ChevronRight20Regular /></button>}
            {props.showTasks !== false && <button className={styles.tile} type="button" onClick={() => setView('tasks')}><span className={styles.tileIcon}><CheckmarkCircle24Filled /></span><span className={styles.tileCopy}><strong>Three priority tasks</strong><span>Review Aurora launch evidence</span><span className={styles.secondary}>Two due today / One due tomorrow</span></span><ChevronRight20Regular /></button>}
            {props.showMail !== false && <button className={styles.tile} type="button" onClick={() => setView('mail')}><span className={styles.tileIcon}><Mail24Regular /></span><span className={styles.tileCopy}><strong>Important mail</strong><span>Miriam: town hall narrative ready</span><span className={styles.secondary}>Three flagged messages</span></span><ChevronRight20Regular /></button>}
            {props.showLearning !== false && <button className={styles.tile} type="button" onClick={() => setView('learning')}><span className={styles.tileIcon}><BookOpen24Regular /></span><span className={styles.tileCopy}><strong>Required learning</strong><span>Protecting customer information</span><span className={styles.secondary}>42% complete / Due {formatDate(zavaLearningAssignments[0].dueDate || '')}</span></span><ChevronRight20Regular /></button>}
            {props.showCompanyHighlights !== false && <button className={styles.tile} type="button" onClick={() => setView('news')}><span className={styles.tileIcon}><News24Regular /></span><span className={styles.tileCopy}><strong>Across Zava</strong><span>One Zava, closer to every customer</span><span className={styles.secondary}>Leadership / Published {formatDate(zavaNews[0].publishedAt)}</span></span><ChevronRight20Regular /></button>}
          </div>
        </>
      ) : view === 'agenda' ? (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.heading}><span className={styles.overline}>Today / Helsinki time</span><h2 className={styles.title}>Your agenda</h2><p className={styles.subtitle}>Preparation context stays attached to each meeting.</p></div><AgendaTimeline allowActions={props.allowActions} /></>
      ) : view === 'tasks' ? (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.heading}><span className={styles.overline}>Personal tasks</span><h2 className={styles.title}>Tasks that need your attention</h2></div><PersonalTaskList /></>
      ) : view === 'mail' ? (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.heading}><span className={styles.overline}>Outlook / Private to you</span><h2 className={styles.title}>Important mail</h2></div><ImportantMailList /></>
      ) : view === 'learning' ? (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.heading}><span className={styles.overline}>Required learning</span><h2 className={styles.title}>Assignments and progress</h2></div><PersonalLearningList /></>
      ) : view === 'news' ? (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.heading}><span className={styles.overline}>Across Zava</span><h2 className={styles.title}>Latest company news</h2></div><PersonalNewsList /></>
      ) : (
        <><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setView('summary')}>Back to My Day</Button><div className={styles.plan}><div className={styles.heading}><span className={styles.overline}>Suggested focus plan</span><h2 className={styles.title}>Protect the customer review, then close the launch decisions.</h2><p className={styles.subtitle}>Suggestions are based on demo calendar, task, mail, and learning signals. Nothing is scheduled automatically.</p></div>{['08:45 / Review Aurora evidence before the customer meeting', '10:20 / Resolve the accessibility launch decision', '15:00 / Finish data-responsibility learning'].map((item, index) => <div key={item} className={styles.planItem}><span className={styles.rank}>{index + 1}</span><strong>{item}</strong></div>)}</div></>
      )}
    </SpectrumFrame>
  );
}

export function AgendaExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const period = props.defaultScope || 'Today';
  const visibleMeetings = props.primaryView === 'next' ? meetings.slice(0, 1) : meetings;
  usePublish(props, { intent: 'agenda', surface: props.surface, route: 'personal/agenda', stage: props.primaryView === 'next' ? 'next-meeting' : 'timeline', summary: `${visibleMeetings.length} meeting${visibleMeetings.length === 1 ? '' : 's'} ${period.toLowerCase()}`, visibleIds: visibleMeetings.map((meeting) => meeting.id), filters: { period }, nextActions: ['Open meeting', 'Join next meeting', 'View calendar'] });
  return (
    <SpectrumFrame inline={inline} layout="agenda-timeline" showSource={props.showSource} source="C02 / Calendar-shaped fixture / Helsinki time / Updated for this demo session">
      <header className={styles.header}><div className={styles.heading}><span className={styles.overline}>Personal agenda / {period}</span><h2 className={styles.title}>{props.title || 'A day you can prepare for'}</h2><p className={styles.subtitle}>Four meetings, with the next conversation and its preparation context highlighted.</p></div><div className={styles.actions}><Badge appearance="outline">Helsinki time</Badge>{inline && <ResponsiveExpandButton onExpand={props.requestFullscreen} />}</div></header>
      <AgendaTimeline allowActions={props.allowActions} onlyNext={props.primaryView === 'next'} />
    </SpectrumFrame>
  );
}

type PersonalPanel = string;
type PersonalDrawer = 'none' | 'plan' | 'settings';
type PlanPhase = 'thinking' | 'streaming' | 'done';

const personalCapabilities = zavaCapabilities.filter((capability) => capability.tab === 'personal');
const personalCoreIntents = ['agenda', 'tasks', 'importantMail', 'learning'];
const personalVisibilityStorageKey = 'zava-one:personal-portal-visibility:v1';
interface IPersonalFocusItem {
  id: string;
  title: string;
  reason: string;
  time?: string;
  source: 'meeting' | 'task' | 'mail' | 'learning';
}

const focusPlan: readonly IPersonalFocusItem[] = [
  { id: 'meeting', title: 'Prepare for Customer experience review', reason: 'Starts in 45 minutes · online', time: '09:30–10:15', source: 'meeting' },
  { id: 'launch', title: 'Review Aurora launch evidence', reason: 'High priority · due today', source: 'task' },
  { id: 'decision', title: 'Resolve the accessibility launch decision', reason: 'Approval evidence is ready for review', source: 'task' },
  { id: 'mail', title: 'Reply to Miriam Graham', reason: 'Flagged · Town hall narrative ready', source: 'mail' },
  { id: 'learning', title: 'Finish data-responsibility learning', reason: `42% complete · due ${formatDate(zavaLearningAssignments[0].dueDate || '')}`, time: '15:00', source: 'learning' }
];

export interface IPersonalWorkspaceHomeProps extends IZavaExperienceProps {
  renderExperience: (intent: string) => React.ReactNode;
  editMode: boolean;
  personalizeRequest: number;
}

export function PersonalWorkspaceHome(props: IPersonalWorkspaceHomeProps): React.ReactElement {
  const styles = useStyles();
  const firstName = props.currentUserName.split(' ')[0] || 'Megan';
  const [drawer, setDrawer] = React.useState<PersonalDrawer>('none');
  const [planPhase, setPlanPhase] = React.useState<PlanPhase>('thinking');
  const [revealedPlanItems, setRevealedPlanItems] = React.useState(0);
  const personalizeRequestRef = React.useRef(props.personalizeRequest);
  const [visiblePanels, setVisiblePanels] = React.useState<Readonly<Record<PersonalPanel, boolean>>>(() => {
    const defaults: Record<string, boolean> = {};
    personalCapabilities.forEach((capability) => {
      defaults[capability.intentKey] = capability.intentKey === 'agenda' ? props.showAgenda !== false
        : capability.intentKey === 'tasks' ? props.showTasks !== false
          : capability.intentKey === 'importantMail' ? props.showMail !== false
            : capability.intentKey === 'learning' ? props.showLearning !== false
              : true;
    });
    try {
      const saved = props.targetDocument.defaultView?.sessionStorage.getItem(personalVisibilityStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        Object.keys(defaults).forEach((panel) => { if (typeof parsed[panel] === 'boolean') defaults[panel] = parsed[panel] as boolean; });
      }
    } catch {
      // Restricted hosts can disable session storage; visibility remains local to this mount.
    }
    return defaults;
  });
  const visibleIds = personalCapabilities.filter((capability) => capability.intentKey === 'myDay' || visiblePanels[capability.intentKey]).map((capability) => capability.intentKey);

  usePublish(props, {
    intent: props.intent, surface: 'workspace', route: 'personal/home', stage: drawer === 'none' ? 'dashboard' : drawer,
    summary: `${visibleIds.length} personal experiences visible; Plan My Day ${drawer === 'plan' ? 'open' : 'available'}`,
    visibleIds,
    nextActions: drawer === 'plan' ? ['Review focus plan', 'Close plan'] : drawer === 'settings' ? ['Choose visible panels', 'Close settings'] : ['Plan my day', 'Configure dashboard']
  });

  const togglePanel = (panel: PersonalPanel, checked: boolean): void => {
    setVisiblePanels((current) => ({ ...current, [panel]: checked }));
  };

  React.useEffect(() => {
    try {
      props.targetDocument.defaultView?.sessionStorage.setItem(personalVisibilityStorageKey, JSON.stringify(visiblePanels));
    } catch {
      // Restricted hosts can disable session storage; visibility remains local to this mount.
    }
  }, [props.targetDocument, visiblePanels]);

  React.useEffect(() => {
    if (personalizeRequestRef.current === props.personalizeRequest) return;
    personalizeRequestRef.current = props.personalizeRequest;
    setDrawer('settings');
  }, [props.personalizeRequest]);

  React.useEffect(() => {
    if (drawer !== 'plan') return undefined;
    const view = props.targetDocument.defaultView;
    if (!view) return undefined;
    const timer = view.setTimeout(() => setPlanPhase('streaming'), 800);
    return () => view.clearTimeout(timer);
  }, [drawer, props.targetDocument]);

  React.useEffect(() => {
    if (drawer !== 'plan' || planPhase !== 'streaming') return undefined;
    const view = props.targetDocument.defaultView;
    if (!view) return undefined;
    if (revealedPlanItems >= focusPlan.length) {
      setPlanPhase('done');
      return undefined;
    }
    const timer = view.setTimeout(() => setRevealedPlanItems((count) => count + 1), 220);
    return () => view.clearTimeout(timer);
  }, [drawer, planPhase, props.targetDocument, revealedPlanItems]);

  const openPlan = (): void => {
    setPlanPhase('thinking');
    setRevealedPlanItems(0);
    setDrawer('plan');
  };

  const portalPanels = personalCapabilities.filter((capability) => capability.intentKey !== 'myDay').map((capability) => ({ id: capability.intentKey, title: capability.title, content: props.renderExperience(capability.intentKey), visible: visiblePanels[capability.intentKey] }));

  return (
    <div className={styles.personalShell} data-layout="personal-portal-dashboard">
      <main className={styles.personalMain}><section className={styles.personalHome}>
      <div className={styles.personalHero} data-personal-capability="myDay">
        <div className={styles.personalIdentity}><Avatar name={props.currentUserName} image={{ src: zavaPeople.megan.photoUrl }} size={72} /><div className={styles.greetingCopy}><span className={styles.overline}>{formatDate(EVERGREEN_NOW, { weekday: 'long', month: 'long', day: 'numeric' })}</span><h1 className={styles.heroTitle}>Good afternoon, {firstName}.</h1><p className={styles.invertedSubtitle}>One customer review and three priority tasks deserve your attention.</p></div></div>
      </div>
      {props.showPlanMyDay !== false && <div className={styles.planBanner}><span className={styles.planBannerLead}><span className={styles.planBannerIcon}><Sparkle24Regular /></span><span className={mergeClasses(styles.tileCopy, styles.planBannerCopy)}><Text size={500} weight="semibold" className={styles.planBannerText}>Start your day smart</Text><Text size={300} className={styles.planBannerText}>You have 4 meetings and 2 high-priority tasks ahead. Let me prioritize them for you.</Text></span></span><Button size="large" className={styles.planBannerButton} icon={<Sparkle24Regular />} onClick={openPlan}>Start planning</Button></div>}
      <PersonalPortalDnd panels={portalPanels} targetDocument={props.targetDocument} editMode={props.editMode} onHidePanel={(panelId) => togglePanel(panelId, false)} defaultColumnAssignments={personalPortalColumnAssignments} />
      </section></main>
      {drawer === 'plan' && <PersonalRightPanel title="Plan my day" icon={<Sparkle24Regular />} onDismiss={() => setDrawer('none')} footnote="AI-generated suggestions for this demo are based on sample data and are not saved.">{planPhase !== 'done' && <div className={styles.shimmer} aria-hidden="true" />}{planPhase === 'thinking' ? <div className={styles.thinking}><Spinner size="medium" /><Text>Prioritizing what matters most…</Text></div> : <><Text size={300} className={styles.focusHeadline}>Good afternoon, {firstName}. You have 4 meetings, 2 high-priority tasks, and 3 important messages today. Start with the customer review.</Text><div className={styles.focusList}>{focusPlan.slice(0, revealedPlanItems).map((item, index) => <div key={item.id} className={styles.focusItem}><span className={styles.focusRail} /><span className={styles.focusRank}>{index + 1}</span><span className={styles.focusCopy}><span className={styles.focusTitle}>{item.source === 'meeting' ? <Calendar24Regular /> : item.source === 'mail' ? <Mail24Regular /> : item.source === 'learning' ? <BookOpen24Regular /> : <CheckmarkCircle24Filled />}<Text weight="semibold">{item.title}</Text></span><Text size={200} className={styles.focusReason}>{item.reason}</Text>{item.time && <Text size={200} className={styles.focusTime}>{item.time}</Text>}</span></div>)}</div></>}</PersonalRightPanel>}
      {drawer === 'settings' && <PersonalRightPanel title="Personalize My Day" icon={<Settings24Regular />} onDismiss={() => setDrawer('none')} footnote="Stored in this browser session only — not saved permanently."><div className={styles.settingsBody}><Text className={styles.subtitle}>Choose the Personal experiences shown in this workspace. My Day remains the portal overview.</Text><div className={styles.actions}><Button appearance="subtle" onClick={() => setVisiblePanels((current) => Object.keys(current).reduce<Record<string, boolean>>((next, panel) => ({ ...next, [panel]: true }), {}))}>Show all</Button><Button appearance="subtle" onClick={() => setVisiblePanels((current) => Object.keys(current).reduce<Record<string, boolean>>((next, panel) => ({ ...next, [panel]: personalCoreIntents.indexOf(panel) >= 0 }), {}))}>Essentials only</Button></div><div className={styles.settingsList}>{personalCapabilities.filter((capability) => capability.intentKey !== 'myDay').map((capability) => <Checkbox key={capability.intentKey} label={capability.title} checked={visiblePanels[capability.intentKey]} onChange={(_, data) => togglePanel(capability.intentKey, data.checked === true)} />)}</div></div></PersonalRightPanel>}
    </div>
  );
}

const glossaryTerms = [
  { id: 'cxr', term: 'CXR', expansion: 'Customer Experience Review', domain: 'Customer experience', owner: 'Experience Operations', effective: formatDate(dateOnlyAtDayOffset(-30), { month: 'long', year: 'numeric' }), definition: 'A weekly evidence review that connects customer signals to owned product and service decisions.' },
  { id: 'aurora', term: 'Aurora', expansion: 'Project Aurora', domain: 'Product', owner: 'Program Management', effective: formatDate(dateOnlyAtDayOffset(-90), { month: 'long', year: 'numeric' }), definition: 'Zava’s guided customer deployment program and the reusable practices produced by its delivery teams.' },
  { id: 'one-zava', term: 'One Zava', expansion: 'One Zava operating model', domain: 'Company', owner: 'Corporate Strategy', effective: formatDate(dateOnlyAtDayOffset(-30), { month: 'long', year: 'numeric' }), definition: 'A company-wide model for connecting customer evidence, decisions, and accountable cross-team delivery.' },
  { id: 'customer-signal', term: 'Customer signal', expansion: 'Customer evidence signal', domain: 'Customer experience', owner: 'Experience Operations', effective: formatDate(dateOnlyAtDayOffset(-60), { month: 'long', year: 'numeric' }), definition: 'A sourced observation from customer interactions that is reviewed before becoming a product decision.' }
] as const;

export function GlossaryExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState(glossaryTerms.some((entry) => entry.id === props.primaryView) ? props.primaryView as string : 'cxr');
  const domain = props.defaultScope || 'All';
  const matches = glossaryTerms.filter((entry) => (domain === 'All' || entry.domain === domain) && `${entry.term} ${entry.expansion} ${entry.domain}`.toLowerCase().includes(query.toLowerCase())).slice(0, props.maxItems || glossaryTerms.length);
  const selected = matches.find((entry) => entry.id === selectedId) || matches[0] || glossaryTerms[0];
  usePublish(props, { intent: 'glossary', surface: props.surface, route: `company/glossary/${selected.id}`, stage: 'definition', summary: `${selected.term}: ${selected.expansion}`, visibleIds: matches.map((entry) => entry.id), selectedId: selected.id, filters: { query }, nextActions: ['Choose another term', 'Open verified source'] });
  return (
    <SpectrumFrame inline={inline} layout="glossary-definition" showSource={props.showSource} source="C32 / Publisher-approved terminology / Demo definitions / No inferred meanings">
      <header className={styles.header}><div className={styles.heading}><span className={styles.overline}>Speak Zava</span><h2 className={styles.title}>{props.title || 'Company glossary'}</h2><p className={styles.subtitle}>Definitions include an owner and effective date so shorthand never becomes guesswork.</p></div>{inline && <ResponsiveExpandButton onExpand={props.requestFullscreen} />}</header>
      <Field label="Find a company term"><Input contentBefore={<Search24Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Try CXR, Aurora, or customer signal" /></Field>
      <div className={styles.glossaryGrid}>
        <div className={styles.termList} aria-label="Matching glossary terms">{matches.map((entry) => <button key={entry.id} className={mergeClasses(styles.termButton, entry.id === selected.id && styles.termSelected)} type="button" onClick={() => setSelectedId(entry.id)}><strong>{entry.term}</strong><span className={styles.secondary}>{entry.expansion}</span></button>)}</div>
        <article className={styles.definition}><span className={styles.overline}>{selected.domain}</span><h3 className={styles.term}>{selected.term}</h3><strong>{selected.expansion}</strong><p className={styles.subtitle}>{selected.definition}</p><div className={styles.metadata}><span className={styles.metadataItem}><span className={styles.secondary}>Owner</span><strong>{selected.owner}</strong></span><span className={styles.metadataItem}><span className={styles.secondary}>Effective</span><strong>{selected.effective}</strong></span><span className={styles.metadataItem}><span className={styles.secondary}>Status</span><Badge color="success">Approved</Badge></span></div></article>
      </div>
    </SpectrumFrame>
  );
}

type SecurityStage = 'choose' | 'describe' | 'review' | 'receipt';

export function SecurityReportingExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [stage, setStage] = React.useState<SecurityStage>(props.primaryView === 'report' ? 'describe' : 'choose');
  const [concern, setConcern] = React.useState(props.defaultScope || 'Suspicious message');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [allowContact, setAllowContact] = React.useState(true);
  usePublish(props, { intent: 'securityReporting', surface: props.surface, route: `company/security/${stage}`, stage, summary: `${concern} security intake`, visibleIds: [concern.toLowerCase().replace(/\s/g, '-')], filters: { concern, location, allowContact: allowContact ? 'yes' : 'no' }, nextActions: stage === 'choose' ? ['Choose concern type'] : stage === 'describe' ? ['Review report'] : stage === 'review' ? ['Edit', 'Submit security report'] : ['Start another report'] });
  const choices = [
    { label: 'Suspicious message', description: 'Phishing, unusual sender, or unexpected link' },
    { label: 'Lost device', description: 'Company phone, laptop, or security key' },
    { label: 'Account concern', description: 'Unexpected sign-in or account behavior' },
    { label: 'Other', description: 'Another concern affecting Zava people, data, or systems' }
  ];
  const reset = (): void => {
    setConcern('Suspicious message');
    setDescription('');
    setLocation('');
    setAllowContact(true);
    setStage('choose');
  };
  return (
    <SpectrumFrame inline={inline} layout={`security-report-${stage}`} showSource={props.showSource} source="C33 / Confidential intake fixture / Explicit submit and receipt">
      <div className={styles.securityHero}><ShieldLock24Regular /><div className={styles.heading}><span className={styles.overline}>Confidential security intake</span><h2 className={styles.title}>{props.title || 'Report a security concern'}</h2><p className={styles.subtitle}>Share only what the security team needs. Never include passwords, access tokens, or unrelated personal information.</p></div>{inline && <ResponsiveExpandButton onExpand={props.requestFullscreen} />}</div>
      {stage === 'choose' && <><div className={styles.securityChoices}>{choices.map((choice) => <button key={choice.label} className={mergeClasses(styles.securityChoice, concern === choice.label && styles.selectedChoice)} type="button" onClick={() => setConcern(choice.label)}><Document24Regular /><strong>{choice.label}</strong><span className={styles.secondary}>{choice.description}</span></button>)}</div><div className={styles.actions}><Button appearance="primary" onClick={() => setStage('describe')}>Continue securely</Button><Badge color="danger">Immediate danger: use local emergency services</Badge></div></>}
      {stage === 'describe' && <div className={styles.review}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('choose')}>Back</Button><span className={styles.overline}>{concern}</span><Field label="What happened?" required validationMessage={description.length > 0 && description.trim().length < 12 ? 'Add a little more detail before continuing.' : undefined}><Textarea resize="vertical" value={description} onChange={(event) => setDescription(event.currentTarget.value)} placeholder="Describe what you observed without pasting secrets or sensitive attachments." /></Field><Field label="Office, device, or service (optional)"><Input value={location} onChange={(_, data) => setLocation(data.value)} placeholder="For example, Helsinki laptop or Outlook" /></Field><Checkbox checked={allowContact} onChange={(_, data) => setAllowContact(data.checked === true)} label="The security team may contact me for follow-up" /><Badge appearance="outline">Attachments and message forwarding are not included in this report.</Badge><Button appearance="primary" disabled={description.trim().length < 12} onClick={() => setStage('review')}>Review report</Button></div>}
      {stage === 'review' && <div className={styles.review}><span className={styles.overline}>Review before reporting</span><h3 className={styles.title}>{concern}</h3><p>{description}</p><div className={styles.metadata}><span className={styles.metadataItem}><span className={styles.secondary}>Context</span><strong>{location || 'Not provided'}</strong></span><span className={styles.metadataItem}><span className={styles.secondary}>Follow-up</span><strong>{allowContact ? 'Contact permitted' : 'No contact requested'}</strong></span></div><Badge color="informative">Ready to send securely to Zava Security</Badge><div className={styles.actions}><Button onClick={() => setStage('describe')}>Edit</Button>{props.allowActions === false ? <Badge appearance="outline">Read-only configuration</Badge> : <Button appearance="primary" icon={<ShieldLock24Regular />} onClick={() => setStage('receipt')}>Submit security report</Button>}</div></div>}
      {stage === 'receipt' && <SubmissionReceipt eyebrow="Confidential intake recorded" title="Security report submitted"
        description="Your report details are captured for confidential triage in this demo."
        details={[{ label: 'Reference', value: 'ZAVA-SEC-2026-1042' }, { label: 'Concern', value: concern }, { label: 'Follow-up', value: allowContact ? 'Contact permitted' : 'No contact requested' }]}
        note="Session-only demo report. No information was sent to Zava Security."
        actions={<Button appearance="primary" onClick={reset}>Start another report</Button>} />}
    </SpectrumFrame>
  );
}