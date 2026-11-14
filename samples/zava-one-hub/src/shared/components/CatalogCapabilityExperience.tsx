import * as React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  Airplane24Regular,
  Apps24Regular,
  ArrowLeft24Regular,
  BookOpen24Regular,
  Building24Regular,
  Calendar24Regular,
  ChevronRight20Regular,
  ClipboardTask24Regular,
  Clock24Regular,
  Desktop24Regular,
  Document24Regular,
  DocumentText24Regular,
  HeartPulse24Regular,
  Money24Regular,
  Open24Regular,
  Search24Regular,
  ShieldLock24Regular
} from '@fluentui/react-icons';
import { getCapabilityByIntent } from '../catalog/capabilities';
import { zavaPeople } from '../mockData/personas';
import type { IZavaExperienceProps, IZavaModelContextSnapshot } from '../models/zavaOne';
import { businessDateRange, dateOnlyAtDayOffset, EVERGREEN_NOW, formatDate } from '../utils/evergreenDates';
import { DecisionBarChart } from './DecisionBarChart';
import { OfficeMap } from './OfficeMap';
import { ResponsiveExpandButton } from './ResponsiveExpandButton';
import { SubmissionReceipt } from './SubmissionReceipt';

interface ICapabilityContent {
  metric: string;
  metricLabel: string;
  items: readonly string[];
  detail: string;
}

const currentYear = EVERGREEN_NOW.getUTCFullYear();
const upcomingLeave = businessDateRange(23, 5);
const nextTownHall = dateOnlyAtDayOffset(10);
const latestPayslip = dateOnlyAtDayOffset(-30);
const nextVesting = dateOnlyAtDayOffset(75);

const employeeServiceApps = [
  { name: 'Expenses and travel', category: 'Finance', owner: 'Travel Operations', detail: 'Create expense reports, attach receipts, and manage business travel bookings.', access: 'Available', icon: 'travel' },
  { name: 'IT support', category: 'Technology', owner: 'Zava IT', detail: 'Check service health, find guided fixes, or open and track an IT support request.', access: 'Available', icon: 'it' },
  { name: 'Benefits enrollment', category: 'People', owner: 'People Operations', detail: 'Review your benefits, report a life event, and manage annual enrollment choices.', access: 'Available', icon: 'benefits' },
  { name: 'Workplace booking', category: 'Workplace', owner: 'Global Workplace', detail: 'Reserve rooms and desks, review office services, and manage upcoming bookings.', access: 'Available', icon: 'workplace' },
  { name: 'Learning center', category: 'Growth', owner: 'Learning and Development', detail: 'Find required learning, browse development programs, and continue active courses.', access: 'Available', icon: 'learning' },
  { name: 'Pay and tax documents', category: 'Finance', owner: 'Payroll', detail: 'Open payslips, annual tax statements, and country-specific payroll guidance.', access: 'Additional sign-in', icon: 'documents' }
] as const;

const knowledgeSources = [
  { id: 'parental-leave', title: 'Finland parental leave policy', type: 'Policy', owner: 'People Operations', effective: `January 1, ${currentYear}`, source: 'People Hub / Finland policies', summary: 'Eligibility, leave periods, pay coordination, and employee notification steps for Finland.', detail: 'Applies to employees based in Finland. The policy explains statutory and Zava-provided leave, required notice, manager responsibilities, and the payroll handoff.', icon: 'policy' },
  { id: 'manager-checklist', title: 'Manager parental leave checklist', type: 'Checklist', owner: 'People Partner team', effective: formatDate(dateOnlyAtDayOffset(-14), { month: 'long', day: 'numeric', year: 'numeric' }), source: 'Manager Hub / Life events', summary: 'A practical sequence for planning coverage, communication, access, and return-to-work support.', detail: 'The checklist keeps employee privacy central while helping managers confirm coverage, workload transition, system access, and a supported return plan.', icon: 'checklist' },
  { id: 'payroll-guidance', title: 'Payroll effective-date guidance', type: 'Payroll guidance', owner: 'Finland Payroll', effective: formatDate(dateOnlyAtDayOffset(-30), { month: 'long', day: 'numeric', year: 'numeric' }), source: 'Payroll Hub / Finland', summary: 'Cutoff dates and payroll timing for approved family-leave changes in Finland.', detail: 'Payroll changes submitted by the monthly cutoff take effect in the next payroll cycle. Later changes are reconciled in the following cycle with an itemized adjustment.', icon: 'payroll' }
] as const;

const contentById: Readonly<Record<string, ICapabilityContent>> = {
  C01: { metric: '09:30', metricLabel: 'Next customer review', items: ['Review Aurora launch evidence', 'Prepare the customer experience discussion', 'Complete data responsibility learning'], detail: 'Your day is intentionally sequenced around the customer review, with protected preparation time before the meeting.' },
  C02: { metric: '4', metricLabel: 'Meetings tomorrow', items: ['09:30 Customer experience review', '11:00 Aurora launch readiness', '14:00 Accessibility lab opening', '16:30 Weekly coaching'], detail: 'The customer review includes the Aurora brief, accessibility checklist, and three open decisions.' },
  C03: { metric: '3', metricLabel: 'Flagged messages', items: ['Miriam: town hall narrative ready', 'Diego: Aurora handoff complete', 'Johanna: accessibility lab checklist'], detail: 'This message is included because it is flagged and tied to a meeting or project due this week.' },
  C04: { metric: '5', metricLabel: 'Tasks due today', items: ['Review launch brief', 'Prepare customer proposal', 'Book accessibility review'], detail: 'The task keeps its source, due time, and completion state. Completing it is an explicit local demo action.' },
  C05: { metric: '4', metricLabel: 'General approvals', items: ['Project Aurora budget change', 'Customer story publication', 'New supplier onboarding'], detail: 'This inbox excludes vacation requests, which route to the dedicated C35 decision experience.' },
  C07: { metric: '1', metricLabel: 'Active notice', items: [`Helsinki lab elevator maintenance / ${formatDate(dateOnlyAtDayOffset(2))}`, 'No other active notices for your locations'], detail: 'The notice applies to Helsinki visitors and expires automatically after the maintenance window.' },
  C08: { metric: '3', metricLabel: 'Verified sources', items: ['Finland parental leave policy', 'Manager checklist', 'Payroll effective-date guidance'], detail: `The Finland policy is effective January 1, ${currentYear} and owned by Zava People Operations.` },
  C09: { metric: '24', metricLabel: 'Employee services', items: employeeServiceApps.map((app) => app.name), detail: 'The service catalog shows purpose, owner, access status, and an allowlisted destination.' },
  C10: { metric: formatDate(nextTownHall), metricLabel: 'Next global town hall', items: ['08:00 Los Angeles / 18:00 Helsinki', 'Live captions and recording', 'Customer stories and Q&A'], detail: 'Registration and adding the event to a calendar remain separate, explicit actions.' },
  C11: { metric: '3', metricLabel: 'Accessibility experts', items: ['Johanna Lorenz / Program lead', 'Grady Archie / Service design', 'Lee Gu / Product design'], detail: 'Johanna matches through published accessibility program ownership and lab facilitation experience.' },
  C12: { metric: '72%', metricLabel: 'Onboarding complete', items: ['Meet your customer experience partner', 'Complete required learning', 'Set up Helsinki lab access'], detail: 'The next step names its owner, deadline, dependency, and approved help route.' },
  C15: { metric: '68%', metricLabel: 'Participation today', items: ['Clear ownership', 'Faster decisions', 'Better meeting focus'], detail: 'The poll is identified, closes at 17:00 local time, and publishes results only above the cohort threshold.' },
  C16: { metric: '18', metricLabel: 'Days available', items: [`${formatDate(upcomingLeave.start)}-${formatDate(upcomingLeave.end, { day: 'numeric' })} / 5 workdays`, 'Projected balance / 13 days', 'No team coverage conflict'], detail: 'Dates, leave type, workday calculation, and projected balance remain editable before review.' },
  C17: { metric: formatDate(latestPayslip, { month: 'short' }), metricLabel: 'Latest payslip available', items: [`${formatDate(latestPayslip, { month: 'long', year: 'numeric' })} payslip`, `${currentYear - 1} tax statement`, 'Payroll help'], detail: 'Amounts stay masked. Opening a document uses a secure source handoff and may require step-up authentication.' },
  C18: { metric: '14 days', metricLabel: 'Life-event deadline', items: ['Confirm employment country', 'Review eligible plans', 'Prepare supporting documents'], detail: 'Eligibility and effective date come from the benefits provider; no medical or financial recommendation is inferred.' },
  C19: { metric: '240', metricLabel: 'Units vest next quarter', items: [`Grant ZV-${currentYear - 2}-18`, `Vesting date / ${formatDate(nextVesting)}`, 'Estimated value hidden'], detail: 'The view separates vested and unvested units and does not provide exercise, tax, or trading advice.' },
  C20: { metric: '€482.60', metricLabel: 'Berlin claim draft', items: ['Hotel receipt verified', 'Taxi category needs review', 'Exchange-rate date confirmed'], detail: 'Receipt extraction is a suggestion. Currency, category, duplicate checks, and attachments remain reviewable.' },
  C21: { metric: '4', metricLabel: 'Vegetarian choices', items: ['Roasted tomato gnocchi / $12', 'Green curry bowl / $11', 'Miso mushroom ramen / $10'], detail: 'Menu data is valid for Redmond today. Allergen labels come from the caterer and are not guarantees.' },
  C22: { metric: '6', metricLabel: 'Rooms available at 14:00', items: ['Cedar / 4 people / Teams room', 'Orca / 6 people / Accessible', 'Rainier / 8 people / Whiteboard'], detail: 'Availability is current as of 13:40 and is rechecked before the explicit reservation step.' },
  C23: { metric: '1', metricLabel: 'Relevant service incident', items: ['VPN sign-in delays / Monitoring', 'My active ticket / ZIT-2841', 'Guided network check'], detail: 'Known incidents appear before ticket creation. Passwords, tokens, and unrestricted logs are never requested.' },
  C24: { metric: '2', metricLabel: 'Open site requests', items: ['Floor 3 east light / Draft', 'Kitchen water station / In progress', 'Local facilities contact'], detail: 'The location and category are confirmed before review. Emergency issues use the published emergency route.' },
  C25: { metric: '07:00', metricLabel: 'Next shift / Sunday', items: ['Seattle service desk', 'Break / 10:30', 'Shift swap window closes 18:00'], detail: 'The overnight and local-time rules come from the workforce fixture; no clock-in is claimed from conversation.' },
  C26: { metric: 'Amber', metricLabel: 'Project Aurora health', items: ['Accessibility review / At risk', 'Customer deployment / Complete', 'Data migration / On track'], detail: 'Aurora is amber because the accessibility decision is due before the next deployment wave.' },
  C27: { metric: '€18.4M', metricLabel: 'EMEA bookings / Q1', items: ['Target / €20.0M', 'Forecast / €19.6M', 'Enterprise segment / +8%'], detail: 'Bookings, revenue, forecast, and pipeline remain distinct; totals reconcile with the selected fiscal scope.' },
  C28: { metric: '82', metricLabel: 'Customer experience score', items: ['Target / 85', 'Q4 baseline / 78', 'Response-time driver / improving'], detail: 'This is a publisher-approved company outcome. Private team goals remain permission-trimmed.' },
  C29: { metric: '3', metricLabel: 'Relevant launch files', items: ['Aurora launch brief.docx', 'Customer review notes.pptx', 'Accessibility checklist.xlsx'], detail: 'Each result retains its source location, modified time, and access state. Pinning does not copy or share it.' },
  C30: { metric: '7 of 9', metricLabel: 'Available Friday', items: ['Design coverage / Clear', 'Customer support / Attention', 'Manager actions / 2 due'], detail: 'Coverage omits private absence reasons and delegates vacation decisions to C35.' },
  C31: { metric: '$128.40', metricLabel: 'ZAVA / Demo market', items: ['+0.94% vs previous close', 'Market closed', 'Quote delayed 15 minutes'], detail: 'ZAVA is fictional and source-labeled. The view provides no investment recommendation.' },
  C32: { metric: 'CXR', metricLabel: 'Customer Experience Review', items: ['Domain / Customer Experience', 'Owner / Experience Operations', `Effective / ${formatDate(dateOnlyAtDayOffset(-30), { month: 'short', year: 'numeric' })}`], detail: 'CXR is the weekly evidence review that connects customer signals to owned product decisions.' },
  C33: { metric: 'Private', metricLabel: 'Security intake', items: ['Suspicious message', 'Lost device', 'Account concern'], detail: 'The flow minimizes sensitive data and never forwards a message or attachment automatically.' },
  C34: { metric: '17:40', metricLabel: 'Helsinki / EEST', items: ['Los Angeles / 07:40 PDT', 'Helsinki / 17:40 EEST', 'Singapore / 22:40 SGT'], detail: 'Office time uses IANA zones. The equivalent office list is always available without geolocation.' }
};

const useStyles = makeStyles({
  root: { width: '100%', minWidth: 0, boxSizing: 'border-box', containerType: 'inline-size', containerName: 'zava-experience', overflowWrap: 'anywhere' },
  inline: { maxWidth: '720px', marginRight: 'auto', marginLeft: 'auto', padding: tokens.spacingHorizontalM },
  frame: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow4 },
  compactFrame: { gap: tokens.spacingVerticalS },
  strip: { height: '5px', marginTop: `calc(-1 * ${tokens.spacingHorizontalL})`, marginRight: `calc(-1 * ${tokens.spacingHorizontalL})`, marginLeft: `calc(-1 * ${tokens.spacingHorizontalL})`, backgroundImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%)' },
  header: { display: 'flex', justifyContent: 'space-between', gap: tokens.spacingHorizontalL, alignItems: 'flex-start', flexWrap: 'wrap' },
  heading: { display: 'grid', gap: tokens.spacingVerticalXXS },
  eyebrow: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { marginTop: 0, marginBottom: 0, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold },
  subtitle: { marginTop: 0, marginBottom: 0, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap', alignItems: 'center' },
  toolbar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: tokens.spacingHorizontalM, alignItems: 'end' },
  metricHero: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalXL, color: tokens.colorNeutralForegroundOnBrand, backgroundImage: 'linear-gradient(130deg, #0f5f9e, #007f73)', borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow16 },
  metric: { fontSize: tokens.fontSizeHero900, lineHeight: tokens.lineHeightHero900, fontWeight: tokens.fontWeightSemibold },
  list: { display: 'grid', gap: tokens.spacingVerticalS },
  tileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: tokens.spacingHorizontalM },
  featureCard: { display: 'grid', gap: tokens.spacingVerticalS, minHeight: '130px', padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer', ':hover': { border: `1px solid ${tokens.colorBrandStroke1}`, boxShadow: tokens.shadow4 } },
  serviceCatalog: { display: 'grid', gridTemplateColumns: 'minmax(220px, .9fr) minmax(260px, 1.1fr)', gap: tokens.spacingHorizontalL, alignItems: 'start', '@container zava-experience (max-width: 620px)': { gridTemplateColumns: '1fr' } },
  serviceList: { display: 'grid', gap: tokens.spacingVerticalS },
  serviceCard: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  serviceCardSelected: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}` },
  serviceIcon: { display: 'grid', placeItems: 'center', width: '40px', height: '40px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusMedium },
  serviceDetail: { display: 'grid', gap: tokens.spacingVerticalM, minHeight: '260px', padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  serviceDetailEmpty: { placeItems: 'center', alignContent: 'center', textAlign: 'center' },
  knowledgeList: { display: 'grid', gap: tokens.spacingVerticalS },
  knowledgeResult: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'start', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  knowledgeIcon: { display: 'grid', placeItems: 'center', width: '44px', height: '44px', color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderRadius: tokens.borderRadiusMedium },
  knowledgeMeta: { display: 'flex', gap: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, flexWrap: 'wrap' },
  knowledgeDetail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusLarge },
  knowledgeDetailMeta: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: tokens.spacingHorizontalM },
  knowledgeDetailMetaItem: { display: 'grid', gap: tokens.spacingVerticalXXS },
  noticePanel: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorPaletteYellowBackground1, borderLeft: `4px solid ${tokens.colorPaletteYellowBorder2}`, borderRadius: tokens.borderRadiusLarge },
  timelineList: { display: 'grid', gap: tokens.spacingVerticalS },
  timelineItem: { display: 'grid', gridTemplateColumns: '18px minmax(0, 1fr)', gap: tokens.spacingHorizontalM, padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer', boxShadow: tokens.shadow2, ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, boxShadow: tokens.shadow4 }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  timelineDot: { width: '12px', height: '12px', marginTop: tokens.spacingVerticalXS, backgroundColor: tokens.colorBrandBackground, borderRadius: tokens.borderRadiusCircular },
  queueRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, textAlign: 'left', cursor: 'pointer' },
  documentRow: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, textAlign: 'left', border: 0, cursor: 'pointer' },
  peopleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: tokens.spacingHorizontalM },
  personCard: { display: 'grid', justifyItems: 'start', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer' },
  row: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium, textAlign: 'left', cursor: 'pointer', ':hover': { border: `1px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorNeutralBackground1Hover }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  rowSelected: { border: `1px solid ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  copy: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  secondary: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  detail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusMedium },
  chart: { display: 'grid', gap: tokens.spacingVerticalM },
  barRow: { display: 'grid', gridTemplateColumns: 'minmax(110px, .6fr) minmax(0, 1.4fr)', gap: tokens.spacingHorizontalM, alignItems: 'center' },
  barTrack: { height: '18px', overflow: 'hidden', backgroundColor: tokens.colorNeutralBackground4, borderRadius: tokens.borderRadiusCircular },
  bar: { height: '100%', backgroundColor: tokens.colorBrandBackground, borderRadius: tokens.borderRadiusCircular },
  barOne: { width: '82%' }, barTwo: { width: '68%' }, barThree: { width: '54%' },
  map: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacingHorizontalM, minHeight: '220px', padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  mapPoint: { alignSelf: 'center', minHeight: '64px' },
  review: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  source: { paddingTop: tokens.spacingVerticalS, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  people: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM },
  error: { color: tokens.colorPaletteRedForeground1, fontWeight: tokens.fontWeightSemibold }
});

function useContext(props: IZavaExperienceProps, snapshot: IZavaModelContextSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const ref = React.useRef(snapshot);
  ref.current = snapshot;
  React.useEffect(() => {
    props.publishContext?.(ref.current).catch(() => undefined);
  }, [props.publishContext, signature]);
}

function isChartGrammar(grammar: string): boolean {
  return ['project', 'sales', 'outcomes', 'stock', 'equity'].indexOf(grammar) >= 0;
}

function isPeopleGrammar(grammar: string): boolean {
  return ['people', 'team'].indexOf(grammar) >= 0;
}

function isTimelineGrammar(grammar: string): boolean {
  return ['timeline', 'journey', 'events', 'shifts'].indexOf(grammar) >= 0;
}

function searchLabelFor(grammar: string): string | undefined {
  switch (grammar) {
    case 'search': return 'Search verified company knowledge';
    case 'directory': return 'Find an employee service';
    case 'people': return 'Find a person or expertise';
    case 'files': return 'Find a file by name or keyword';
    default: return undefined;
  }
}

function periodOptionsFor(grammar: string): readonly string[] | undefined {
  switch (grammar) {
    case 'journey': return ['Current', 'First week', 'All'];
    case 'events': return ['Upcoming', 'This month', 'Past'];
    case 'shifts': return ['Today', 'This week', 'Next week'];
    case 'menu': return ['Redmond', 'Helsinki', 'Singapore'];
    default: return undefined;
  }
}

function EmployeeServiceIcon(props: { icon: typeof employeeServiceApps[number]['icon'] }): React.ReactElement {
  switch (props.icon) {
    case 'travel': return <Airplane24Regular />;
    case 'it': return <Desktop24Regular />;
    case 'benefits': return <HeartPulse24Regular />;
    case 'workplace': return <Building24Regular />;
    case 'learning': return <BookOpen24Regular />;
    default: return <Document24Regular />;
  }
}

function KnowledgeSourceIcon(props: { icon: typeof knowledgeSources[number]['icon'] }): React.ReactElement {
  switch (props.icon) {
    case 'checklist': return <ClipboardTask24Regular />;
    case 'payroll': return <Money24Regular />;
    default: return <DocumentText24Regular />;
  }
}

export function CatalogCapabilityExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const capability = getCapabilityByIntent(props.intent);
  const content = capability ? contentById[capability.id] : undefined;
  const [scope, setScope] = React.useState<string>(props.defaultScope || 'Today');
  const [query, setQuery] = React.useState<string>('');
  const [selectedIndex, setSelectedIndex] = React.useState<number>();
  const [stage, setStage] = React.useState<'summary' | 'detail' | 'review' | 'receipt'>(props.primaryView === 'detail' ? 'detail' : 'summary');
  const [draft, setDraft] = React.useState<string>('');
  const [localStatus, setLocalStatus] = React.useState<string>('Ready');

  if (!capability || !content) {
    return <div className={styles.error} role="alert">This Zava One experience is not configured.</div>;
  }

  const inline = props.surface === 'copilotInline';
  const searchLabel = searchLabelFor(capability.grammar);
  const periodOptions = periodOptionsFor(capability.grammar);
  const visibleItems = content.items.filter((item) => item.toLowerCase().includes(query.toLowerCase())).slice(0, props.maxItems || content.items.length);
  const visibleKnowledgeSources = knowledgeSources.filter((source) => `${source.title} ${source.type} ${source.owner} ${source.summary}`.toLowerCase().includes(query.toLowerCase())).slice(0, props.maxItems || knowledgeSources.length);
  const selectedKnowledgeSource = selectedIndex === undefined ? undefined : knowledgeSources[selectedIndex];
  const visibleServiceApps = employeeServiceApps.filter((app) => `${app.name} ${app.category} ${app.owner}`.toLowerCase().includes(query.toLowerCase()));
  const selectedServiceApp = selectedIndex === undefined ? undefined : employeeServiceApps[selectedIndex];
  const selectedItem = capability.id === 'C08' ? selectedKnowledgeSource?.title : capability.id === 'C09' ? selectedServiceApp?.name : selectedIndex === undefined ? undefined : visibleItems[selectedIndex];
  const operation = capability.operation;
  const sourceText = `${capability.id} / Fictional ${capability.category} fixture / Updated ${formatDate(dateOnlyAtDayOffset(-1), { month: 'long', day: 'numeric', year: 'numeric' })}`;

  useContext(props, {
    intent: capability.intentKey,
    surface: props.surface,
    route: capability.route,
    stage,
    summary: selectedItem || `${content.metric} ${content.metricLabel}`,
    visibleIds: capability.id === 'C08' ? visibleKnowledgeSources.map((source) => source.id) : visibleItems.map((_, index) => `${capability.id.toLowerCase()}-${index + 1}`),
    selectedId: capability.id === 'C08' ? selectedKnowledgeSource?.id : selectedIndex === undefined ? undefined : `${capability.id.toLowerCase()}-${selectedIndex + 1}`,
    filters: { scope, query },
    nextActions: stage === 'receipt' ? ['Reset experience'] : operation === 'information' ? ['Open detail'] : ['Review', 'Edit', 'Confirm']
  });

  const reset = (): void => {
    setStage('summary');
    setSelectedIndex(undefined);
    setDraft('');
    setLocalStatus('Ready');
  };

  return (
    <section className={mergeClasses(styles.root, inline && styles.inline)} data-layout={`${capability.id.toLowerCase()}-${capability.grammar}-${props.primaryView || 'summary'}-${stage}`} data-density={props.density || 'comfortable'}>
      <div className={mergeClasses(styles.frame, props.density === 'compact' && styles.compactFrame)}>
        <div className={styles.strip} />
        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>{capability.category}</span>
            <h2 className={styles.title}>{props.title || capability.title}</h2>
            <p className={styles.subtitle}>{capability.outcome}</p>
          </div>
          <div className={styles.actions}>
            <Badge appearance="outline">{localStatus}</Badge>
            {inline && <ResponsiveExpandButton onExpand={props.requestFullscreen} />}
          </div>
        </header>

        {stage === 'summary' && (
          <>
            {(searchLabel || periodOptions) && (
              <div className={styles.toolbar}>
                {periodOptions && <Field label={capability.grammar === 'menu' ? 'Campus' : 'Period'}><Select value={scope} onChange={(event) => setScope(event.currentTarget.value)}>{periodOptions.map((option) => <option key={option}>{option}</option>)}</Select></Field>}
                {searchLabel && <Field label={searchLabel}><Input contentBefore={<Search24Regular />} value={query} onChange={(_, data) => setQuery(data.value)} /></Field>}
              </div>
            )}
            {capability.id === 'C08' ? (
              <div className={styles.knowledgeList} role="list" aria-label="Verified company knowledge sources">
                <div className={styles.actions}><Badge color="success">{visibleKnowledgeSources.length} verified sources</Badge><span className={styles.secondary}>Published by accountable content owners</span></div>
                {visibleKnowledgeSources.map((source) => {
                  const sourceIndex = knowledgeSources.indexOf(source);
                  return <button key={source.id} type="button" className={styles.knowledgeResult} onClick={() => { setSelectedIndex(sourceIndex); setStage('detail'); }}><span className={styles.knowledgeIcon}><KnowledgeSourceIcon icon={source.icon} /></span><span className={styles.copy}><strong>{source.title}</strong><span className={styles.subtitle}>{source.summary}</span><span className={styles.knowledgeMeta}><span>{source.type}</span><span>Owner: {source.owner}</span><span>Effective: {source.effective}</span></span></span><span className={styles.copy}><Badge color="success">Verified</Badge><ChevronRight20Regular /></span></button>;
                })}
              </div>
            ) : capability.id === 'C09' ? (
              <div className={styles.serviceCatalog}>
                <div className={styles.serviceList} role="list" aria-label="Employee apps and services">
                  {visibleServiceApps.map((app) => {
                    const appIndex = employeeServiceApps.indexOf(app);
                    return <button key={app.name} type="button" className={mergeClasses(styles.serviceCard, selectedIndex === appIndex && styles.serviceCardSelected)} aria-pressed={selectedIndex === appIndex} onClick={() => setSelectedIndex(appIndex)}><span className={styles.serviceIcon}><EmployeeServiceIcon icon={app.icon} /></span><span className={styles.copy}><strong>{app.name}</strong><span className={styles.secondary}>{app.category} / {app.owner}</span></span><ChevronRight20Regular /></button>;
                  })}
                </div>
                {selectedServiceApp ? (
                  <div className={styles.serviceDetail}>
                    <span className={styles.serviceIcon}><EmployeeServiceIcon icon={selectedServiceApp.icon} /></span>
                    <span className={styles.copy}><span className={styles.eyebrow}>{selectedServiceApp.category}</span><h3 className={styles.title}>{selectedServiceApp.name}</h3><span className={styles.subtitle}>{selectedServiceApp.detail}</span></span>
                    <div className={styles.actions}><Badge color="success">{selectedServiceApp.access}</Badge><Badge appearance="outline">Owned by {selectedServiceApp.owner}</Badge></div>
                    <Button appearance="primary" icon={<Open24Regular />}>Launch app</Button>
                    <span className={styles.secondary}>Opens the approved service in your browser.</span>
                  </div>
                ) : (
                  <div className={mergeClasses(styles.serviceDetail, styles.serviceDetailEmpty)}><span className={styles.serviceIcon}><Apps24Regular /></span><strong>Select an app or service</strong><span className={styles.secondary}>See what it is for, who owns it, and how you can access it.</span></div>
                )}
              </div>
            ) : capability.grammar === 'map' ? (
              <OfficeMap />
            ) : isChartGrammar(capability.grammar) ? (
              <div className={styles.chart} aria-label={`${capability.title} chart`}>
                <div className={styles.metricHero}><span className={styles.metric}>{content.metric}</span><strong>{content.metricLabel}</strong><span>{scope} / source-labeled demo data</span></div>
                <DecisionBarChart labels={visibleItems.slice(0, 3)} scope={scope} onSelect={(index) => { setSelectedIndex(index); setStage('detail'); }} />
              </div>
            ) : capability.grammar === 'alert' ? (
              <div className={styles.noticePanel}><ShieldLock24Regular /><span className={styles.copy}><strong>{visibleItems[0]}</strong><span>{content.detail}</span><span className={styles.secondary}>Active notice / Applies to your published office location</span></span></div>
            ) : isTimelineGrammar(capability.grammar) ? (
              <div className={styles.timelineList}>{visibleItems.map((item, index) => <button key={item} className={styles.timelineItem} type="button" onClick={() => { setSelectedIndex(index); setStage('detail'); }}><span className={styles.timelineDot} /><span className={styles.copy}><strong>{item}</strong><span className={styles.secondary}>{scope} / Owned next step and timing</span></span></button>)}</div>
            ) : isPeopleGrammar(capability.grammar) ? (
              <div className={styles.peopleGrid}>{visibleItems.map((item, index) => { const person = [zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni][index % 3]; return <button key={item} className={styles.personCard} type="button" onClick={() => { setSelectedIndex(index); setStage('detail'); }}>{props.showImages !== false && <Avatar size={48} name={person.displayName} image={{ src: person.photoUrl }} />}<strong>{item}</strong><span className={styles.secondary}>Published profile evidence</span></button>; })}</div>
            ) : ['directory', 'menu', 'booking', 'benefits'].indexOf(capability.grammar) >= 0 ? (
              <div className={styles.tileGrid}>{visibleItems.map((item, index) => <button key={item} className={styles.featureCard} type="button" onClick={() => { setSelectedIndex(index); setStage(capability.operation === 'information' ? 'detail' : 'review'); }}><Calendar24Regular /><strong>{item}</strong><span className={styles.secondary}>{capability.grammar === 'menu' ? `${scope} / Current menu` : 'Owned service / Access checked'}</span><span className={styles.actions}><Badge appearance="outline">Available</Badge><ChevronRight20Regular /></span></button>)}</div>
            ) : ['inbox', 'documents', 'files'].indexOf(capability.grammar) >= 0 ? (
              <div className={styles.list}>{visibleItems.map((item, index) => <button key={item} className={styles.documentRow} type="button" onClick={() => { setSelectedIndex(index); setStage('detail'); }}><Document24Regular /><span className={styles.copy}><strong>{item}</strong><span className={styles.secondary}>{capability.grammar === 'inbox' ? 'Sender and priority preserved' : 'Source, modified time, and access preserved'}</span></span><ChevronRight20Regular /></button>)}</div>
            ) : ['task-list', 'decision-queue', 'survey', 'time-off', 'expenses', 'support', 'facilities'].indexOf(capability.grammar) >= 0 ? (
              <div className={styles.list}>{visibleItems.map((item, index) => <button key={item} className={styles.queueRow} type="button" onClick={() => { setSelectedIndex(index); setStage(capability.operation === 'information' ? 'detail' : 'review'); }}><span className={styles.copy}><strong>{item}</strong><span className={styles.secondary}>{capability.operation === 'review' ? 'Evidence ready for review' : capability.operation === 'submit' ? 'Draft / Explicit confirmation required' : 'Current status from source'}</span></span><Badge color={index === 0 ? 'warning' : 'informative'}>{index === 0 ? 'Needs attention' : 'Current'}</Badge></button>)}</div>
            ) : (
              <>
                {props.primaryView !== 'list' && <div className={styles.metricHero}><span className={styles.metric}>{content.metric}</span><strong>{content.metricLabel}</strong><span>{scope} / {capability.id === 'C08' ? 'Published and source verified' : 'Deterministic sample state'}</span></div>}
                <div className={styles.list}>
                  {visibleItems.map((item, index) => (
                    <button key={item} className={styles.row} type="button" onClick={() => { setSelectedIndex(index); setStage(operation === 'information' ? 'detail' : 'review'); }}>
                      {isPeopleGrammar(capability.grammar) && props.showImages !== false ? <Avatar name={[zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni][index % 3].displayName} image={{ src: [zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni][index % 3].photoUrl }} /> : isTimelineGrammar(capability.grammar) ? <Clock24Regular /> : capability.grammar === 'security' ? <ShieldLock24Regular /> : capability.grammar === 'documents' || capability.grammar === 'files' ? <Document24Regular /> : <Calendar24Regular />}
                      <span className={styles.copy}><strong>{item}</strong><span className={styles.secondary}>{scope} / Select for evidence and next action</span></span><ChevronRight20Regular />
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {stage === 'detail' && (capability.id === 'C08' && selectedKnowledgeSource ? (
          <div className={styles.knowledgeDetail}>
            <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('summary')}>Back to verified results</Button>
            <div className={styles.actions}><span className={styles.knowledgeIcon}><KnowledgeSourceIcon icon={selectedKnowledgeSource.icon} /></span><span className={styles.copy}><span className={styles.eyebrow}>{selectedKnowledgeSource.type}</span><h3 className={styles.title}>{selectedKnowledgeSource.title}</h3></span></div>
            <p className={styles.subtitle}>{selectedKnowledgeSource.detail}</p>
            <div className={styles.knowledgeDetailMeta}><span className={styles.knowledgeDetailMetaItem}><span className={styles.secondary}>Owner</span><strong>{selectedKnowledgeSource.owner}</strong></span><span className={styles.knowledgeDetailMetaItem}><span className={styles.secondary}>Effective</span><strong>{selectedKnowledgeSource.effective}</strong></span><span className={styles.knowledgeDetailMetaItem}><span className={styles.secondary}>Published in</span><strong>{selectedKnowledgeSource.source}</strong></span></div>
            <div className={styles.actions}><Badge color="success">Source verified</Badge><Button appearance="primary" icon={<Open24Regular />}>Open verified source</Button></div>
          </div>
        ) : (
          <div className={styles.detail}>
            <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('summary')}>Back to results</Button>
            <span className={styles.eyebrow}>{capability.grammar} detail</span>
            <h3 className={styles.title}>{selectedItem || content.metricLabel}</h3>
            <p className={styles.subtitle}>{content.detail}</p>
            <div className={styles.actions}><Badge color="informative">Source verified</Badge><Badge appearance="outline">{scope}</Badge></div>
          </div>
        ))}

        {stage === 'review' && (
          <div className={styles.review}>
            <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('summary')}>Back to list</Button>
            <span className={styles.eyebrow}>{operation === 'review' ? 'Decision review' : 'Request review'}</span>
            <h3 className={styles.title}>{selectedItem || capability.title}</h3>
            <p className={styles.subtitle}>{content.detail}</p>
            <Field label={operation === 'review' ? 'Decision note' : 'Request details'} required>
              <Textarea resize="vertical" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} placeholder="Add a short, reviewable note" />
            </Field>
            <div className={styles.actions}>
              <Button onClick={() => setStage('summary')}>Edit</Button>
              {props.allowActions === false ? <Badge appearance="outline">Read-only web-part configuration</Badge> : <Button appearance="primary" disabled={!draft.trim()} onClick={() => { setLocalStatus('Updated this session'); setStage('receipt'); }}>Confirm demo update</Button>}
            </div>
          </div>
        )}

        {stage === 'receipt' && (
          <SubmissionReceipt eyebrow="Update recorded" title="Demo update recorded" description={selectedItem || capability.title}
            details={[{ label: 'Reference', value: `ZAVA-${capability.id}-2026` }, { label: 'Status', value: 'Updated this session' }]}
            note="Session only. No external submission."
            actions={<Button appearance="primary" onClick={reset}>Reset experience</Button>} />
        )}
        {props.showSource !== false && <div className={styles.source}>{sourceText}</div>}
      </div>
    </section>
  );
}