import * as React from 'react';
import { arc, pie } from 'd3-shape';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  ProgressBar,
  Radio,
  RadioGroup,
  Select,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  Calendar24Regular,
  Chat24Regular,
  CheckmarkCircle24Filled,
  Food24Regular,
  Location24Regular,
  Search24Regular,
  Target24Regular
} from '@fluentui/react-icons';
import { zavaPeople } from '../mockData/personas';
import { embeddedMedia } from '../media/embeddedMedia';
import type { IZavaExperienceProps, IZavaModelContextSnapshot } from '../models/zavaOne';
import { calendarDays, dateOnlyAtDayOffset, dateOnlyInMonth, EVERGREEN_NOW, formatDate, futureMonth } from '../utils/evergreenDates';
import { OfficeMap } from './OfficeMap';
import { ResponsiveExpandButton } from './ResponsiveExpandButton';

const useStyles = makeStyles({
  root: { width: '100%', minWidth: 0, boxSizing: 'border-box', containerType: 'inline-size', containerName: 'zava-experience', overflowWrap: 'anywhere' },
  inline: { maxWidth: '720px', marginRight: 'auto', marginLeft: 'auto', padding: tokens.spacingHorizontalM },
  frame: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: tokens.spacingVerticalL, overflow: 'hidden', padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow4 },
  strip: { height: '5px', marginTop: `calc(-1 * ${tokens.spacingHorizontalL})`, marginRight: `calc(-1 * ${tokens.spacingHorizontalL})`, marginLeft: `calc(-1 * ${tokens.spacingHorizontalL})`, backgroundImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%)' },
  header: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalL, alignItems: 'start' },
  heading: { display: 'grid', gap: tokens.spacingVerticalXXS },
  overline: { color: tokens.colorBrandForeground1, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { margin: 0, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold },
  subtitle: { margin: 0, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300 },
  source: { paddingTop: tokens.spacingVerticalS, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  actions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  toolbar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: tokens.spacingHorizontalM, alignItems: 'end', '& > *': { minWidth: 0 } },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: tokens.spacingHorizontalM },
  metric: { display: 'grid', gap: tokens.spacingVerticalXXS, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  metricValue: { fontSize: tokens.fontSizeHero700, lineHeight: tokens.lineHeightHero700, fontWeight: tokens.fontWeightSemibold },
  calendar: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, borderLeft: `1px solid ${tokens.colorNeutralStroke2}` },
  dayHeader: { padding: tokens.spacingHorizontalXS, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200, textAlign: 'center', borderRight: `1px solid ${tokens.colorNeutralStroke2}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  day: { display: 'grid', alignContent: 'start', gap: tokens.spacingVerticalXXS, minHeight: '74px', padding: tokens.spacingHorizontalXS, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: 0, borderRight: `1px solid ${tokens.colorNeutralStroke2}`, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, textAlign: 'left' },
  dayOutside: { color: tokens.colorNeutralForeground4, backgroundColor: tokens.colorNeutralBackground2 },
  daySelected: { boxShadow: `inset 0 0 0 2px ${tokens.colorBrandStroke1}`, backgroundColor: tokens.colorBrandBackground2 },
  eventChip: { overflow: 'hidden', padding: `2px ${tokens.spacingHorizontalXS}`, color: tokens.colorBrandForeground1, backgroundColor: tokens.colorBrandBackground2, borderLeft: `3px solid ${tokens.colorBrandStroke1}`, borderRadius: tokens.borderRadiusSmall, fontSize: tokens.fontSizeBase100, textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  list: { display: 'grid', gap: tokens.spacingVerticalS },
  row: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalM, alignItems: 'center', padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left' },
  rowButton: { cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` } },
  copy: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0 },
  secondary: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  detail: { display: 'grid', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalL, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  skills: { display: 'flex', gap: tokens.spacingHorizontalXS, flexWrap: 'wrap' },
  poll: { display: 'grid', gap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalXL, backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge },
  pollPrompt: { display: 'grid', gap: tokens.spacingVerticalXXS },
  pollOptions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: tokens.spacingHorizontalM },
  pollOption: { minHeight: '72px', padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, cursor: 'pointer', ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover, border: `1px solid ${tokens.colorBrandStroke1}` } },
  pollOptionSelected: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}`, boxShadow: `0 0 0 1px ${tokens.colorBrandStroke1}` },
  pollOptionLabel: { display: 'grid', gap: tokens.spacingVerticalXXS, paddingLeft: tokens.spacingHorizontalXS },
  voteFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: tokens.spacingHorizontalM, flexWrap: 'wrap' },
  selectedChoice: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, color: tokens.colorBrandForeground1, fontWeight: tokens.fontWeightSemibold },
  surveyResults: { display: 'grid', gridTemplateColumns: 'minmax(0, .8fr) minmax(0, 1.2fr)', gap: tokens.spacingHorizontalXL, alignItems: 'center', '@container zava-experience (max-width: 620px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  donutFigure: { position: 'relative', display: 'grid', placeItems: 'center', margin: 0 },
  donut: { width: '100%', maxWidth: '240px', height: 'auto' },
  donutCenter: { position: 'absolute', display: 'grid', placeItems: 'center', pointerEvents: 'none' },
  donutTotal: { fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold },
  resultLegend: { display: 'grid', gap: tokens.spacingVerticalS },
  resultItem: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: tokens.spacingHorizontalS, alignItems: 'center', padding: tokens.spacingVerticalS, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  resultSwatch: { width: '12px', height: '12px', borderRadius: tokens.borderRadiusCircular },
  resultValue: { display: 'grid', justifyItems: 'end' },
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: tokens.spacingHorizontalM },
  menuCard: { display: 'grid', gap: tokens.spacingVerticalS, overflow: 'hidden', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge },
  menuImage: { width: '100%', height: '120px', objectFit: 'cover' },
  menuCopy: { display: 'grid', gap: tokens.spacingVerticalXS, padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingHorizontalM}` },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: tokens.spacingHorizontalM },
  statusCard: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, textAlign: 'left', cursor: 'pointer' },
  statusSelected: { backgroundColor: tokens.colorBrandBackground2, border: `2px solid ${tokens.colorBrandStroke1}` },
  chart: { display: 'grid', gap: tokens.spacingVerticalS },
  svg: { width: '100%', height: 'auto', minHeight: '210px', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge },
  chartLabel: { fill: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  goal: { display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge },
  keyResult: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalS },
  keyResultBar: { gridColumn: '1 / -1' },
  stockHero: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: tokens.spacingHorizontalL, padding: tokens.spacingHorizontalL, color: tokens.colorNeutralForegroundOnBrand, backgroundColor: '#11364f', borderRadius: tokens.borderRadiusLarge, '@container zava-experience (max-width: 420px)': { gridTemplateColumns: 'minmax(0, 1fr)' } },
  stockLabel: { color: '#ffffff', opacity: .86 },
  stockPrice: { color: '#ffffff', fontSize: tokens.fontSizeHero900, lineHeight: tokens.lineHeightHero900, fontWeight: tokens.fontWeightSemibold },
  stockDelta: { color: '#dff6dd' },
  stockMeta: { color: '#ffffff' },
  stockStatus: { color: '#ffffff', backgroundColor: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.58)' },
  positive: { color: tokens.colorPaletteGreenForeground2 },
  disclaimer: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }
});

function usePublish(props: IZavaExperienceProps, snapshot: IZavaModelContextSnapshot): void {
  const signature = JSON.stringify(snapshot);
  const ref = React.useRef(snapshot);
  ref.current = snapshot;
  React.useEffect(() => { props.publishContext?.(ref.current).catch(() => undefined); }, [props.publishContext, signature]);
}

function CompanyFrame(props: { experience: IZavaExperienceProps; layout: string; eyebrow: string; title: string; subtitle: string; source: string; children: React.ReactNode }): React.ReactElement {
  const styles = useStyles();
  const inline = props.experience.surface === 'copilotInline';
  return <section className={mergeClasses(styles.root, inline && styles.inline)} data-layout={props.layout}><div className={styles.frame}><div className={styles.strip} /><header className={styles.header}><span className={styles.heading}><span className={styles.overline}>{props.eyebrow}</span><h2 className={styles.title}>{props.experience.title || props.title}</h2><p className={styles.subtitle}>{props.subtitle}</p></span>{inline && <ResponsiveExpandButton onExpand={props.experience.requestFullscreen} />}</header>{props.children}{props.experience.showSource !== false && <div className={styles.source}>{props.source}</div>}</div></section>;
}

const eventMonth = futureMonth();
const eventFixtures = [
  { id: 'town-hall', date: dateOnlyInMonth(eventMonth.year, eventMonth.monthIndex, 3), time: '18:00', title: 'Global town hall', location: 'Teams / Studio A', tone: 'brand' },
  { id: 'lab', date: dateOnlyInMonth(eventMonth.year, eventMonth.monthIndex, 7), time: '10:00', title: 'Accessibility lab opening', location: 'Helsinki', tone: 'success' },
  { id: 'customer', date: dateOnlyInMonth(eventMonth.year, eventMonth.monthIndex, 12), time: '16:00', title: 'Aurora customer showcase', location: 'Los Angeles', tone: 'warning' },
  { id: 'community', date: dateOnlyInMonth(eventMonth.year, eventMonth.monthIndex, 18), time: '09:30', title: 'Community week kickoff', location: 'Singapore', tone: 'informative' },
  { id: 'learning', date: dateOnlyInMonth(eventMonth.year, eventMonth.monthIndex, 24), time: '12:00', title: 'Learning festival', location: 'Hybrid', tone: 'brand' }
] as const;

export function CompanyEventsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [view, setView] = React.useState<'calendar' | 'agenda'>(props.primaryView === 'agenda' ? 'agenda' : 'calendar');
  const [selectedId, setSelectedId] = React.useState('town-hall');
  const selected = eventFixtures.find((event) => event.id === selectedId) || eventFixtures[0];
  const days = calendarDays(eventMonth.year, eventMonth.monthIndex);
  usePublish(props, { intent: 'companyEvents', surface: props.surface, route: `company/events/${view}`, stage: view, summary: `${eventFixtures.length} published ${eventMonth.label} events`, visibleIds: eventFixtures.map((event) => event.id), selectedId, nextActions: ['Select event', 'Switch view', 'Open event'] });
  return <CompanyFrame experience={props} layout={`company-events-${view}`} eyebrow={`Company calendar / ${eventMonth.label}`} title="Events across Zava" subtitle="Browse published town halls, office events, and employee programs in one calendar." source="Published events fixture / Local times shown in event detail">
    <div className={styles.actions}><Button appearance={view === 'calendar' ? 'primary' : 'secondary'} onClick={() => setView('calendar')}>Month</Button><Button appearance={view === 'agenda' ? 'primary' : 'secondary'} onClick={() => setView('agenda')}>Agenda</Button><Badge appearance="outline">{eventMonth.label}</Badge></div>
    {view === 'calendar' ? <div className={styles.calendar}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => <span key={day} className={styles.dayHeader}>{day}</span>)}{days.map((day) => { const events = day.outside ? [] : eventFixtures.filter((event) => event.date === day.date); return <button key={day.date} type="button" className={mergeClasses(styles.day, day.outside && styles.dayOutside, events.some((event) => event.id === selectedId) && styles.daySelected)} onClick={() => events[0] && setSelectedId(events[0].id)}><strong>{day.number}</strong>{events.map((event) => <span key={event.id} className={styles.eventChip}>{event.time} {event.title}</span>)}</button>; })}</div> : <div className={styles.list}>{eventFixtures.slice(0, props.maxItems || eventFixtures.length).map((event) => <button key={event.id} type="button" className={mergeClasses(styles.row, styles.rowButton)} onClick={() => setSelectedId(event.id)}><Calendar24Regular /><span className={styles.copy}><strong>{formatDate(event.date)} / {event.title}</strong><span className={styles.secondary}>{event.time} / {event.location}</span></span><Badge appearance="outline">Published</Badge></button>)}</div>}
    <div className={styles.detail}><strong>{selected.title}</strong><span>{selected.time} / {selected.location}</span><span className={styles.secondary}>Live captions, recording, organizer contact, and add-to-calendar handoff available.</span><div className={styles.actions}><Button appearance="primary">Open event</Button><Button>Add to calendar</Button></div></div>
  </CompanyFrame>;
}

const peopleFixtures = [zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni, zavaPeople.miriam, zavaPeople.nestor, zavaPeople.pradeep];

export function PeopleExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const initialQuery = typeof props.toolProperties?.query === 'string' ? props.toolProperties.query : '';
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedId, setSelectedId] = React.useState<string>();
  const matches = peopleFixtures.filter((person) => `${person.displayName} ${person.jobTitle} ${person.department} ${person.office}`.toLowerCase().includes(query.toLowerCase()));
  const selected = peopleFixtures.find((person) => person.id === selectedId);
  usePublish(props, { intent: 'people', surface: props.surface, route: selected ? `company/people/${selected.id}` : 'company/people', stage: selected ? 'profile' : 'directory', summary: selected ? `${selected.displayName}, ${selected.jobTitle}` : `${matches.length} matching people`, visibleIds: matches.map((person) => person.id), selectedId, filters: { query }, nextActions: selected ? ['Open Teams chat', 'Back'] : ['Search people', 'Open profile'] });
  return <CompanyFrame experience={props} layout={selected ? 'company-people-profile' : 'company-people-directory'} eyebrow="People and expertise" title="Find someone who can help" subtitle="Search published role, location, department, and expertise signals." source="Fictional directory fixture / Published profile data only">
    {selected ? <div className={styles.detail}><Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setSelectedId(undefined)}>Back to people</Button><div className={styles.row}><Avatar size={64} name={selected.displayName} image={{ src: selected.photoUrl }} /><span className={styles.copy}><h3 className={styles.title}>{selected.displayName}</h3><span>{selected.jobTitle}</span><span className={styles.secondary}>{selected.department} / {selected.office}</span></span><Badge color="success">Available</Badge></div><div className={styles.metrics}><span className={styles.metric}><span className={styles.secondary}>Email</span><strong>{selected.email}</strong></span><span className={styles.metric}><span className={styles.secondary}>Local time</span><strong>{selected.office === 'Helsinki' ? '17:40 EEST' : selected.office === 'Singapore' ? '22:40 SGT' : '07:40 PDT'}</strong></span></div><div className={styles.skills}>{['Accessibility', 'Customer experience', 'Project Aurora'].map((skill) => <Badge key={skill} appearance="outline">{skill}</Badge>)}</div><div className={styles.actions}><Button appearance="primary" icon={<Chat24Regular />} onClick={() => props.sendFollowUp?.(`Start a Teams chat with ${selected.displayName}.`).catch(() => undefined)}>Open in Teams</Button><Button>View organization</Button></div></div> : <><Field label="Search people"><Input contentBefore={<Search24Regular />} value={query} onChange={(_, data) => setQuery(data.value)} placeholder="Name, role, expertise, or office" /></Field><div className={styles.list}>{matches.map((person) => <button key={person.id} type="button" className={mergeClasses(styles.row, styles.rowButton)} onClick={() => setSelectedId(person.id)}><Avatar size={48} name={person.displayName} image={{ src: person.photoUrl }} /><span className={styles.copy}><strong>{person.displayName}</strong><span>{person.jobTitle}</span><span className={styles.secondary}>{person.department} / {person.office}</span></span><Chat24Regular /></button>)}</div></>}
  </CompanyFrame>;
}

const pollOptions = [
  { id: 'focus', label: 'Protecting focus time', detail: 'Fewer interruptions and more uninterrupted work blocks', votes: 148, color: '#0f6cbd' },
  { id: 'decisions', label: 'Faster cross-team decisions', detail: 'Clear owners, input, and decision deadlines', votes: 112, color: '#107c10' },
  { id: 'tools', label: 'Simpler tools and workflows', detail: 'Less switching and fewer repeated steps', votes: 86, color: '#c239b3' },
  { id: 'context', label: 'Clearer company context', detail: 'More visibility into priorities and changes', votes: 54, color: '#ca5010' }
];

export function EmployeeSurveysExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [choice, setChoice] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const results = pollOptions.map((option) => ({ ...option, votes: option.votes + (submitted && option.id === choice ? 1 : 0) }));
  const total = results.reduce((sum, option) => sum + option.votes, 0);
  const selected = pollOptions.find((option) => option.id === choice);
  const pieSegments = pie<typeof results[number]>().sort(null).value((option) => option.votes)(results);
  const donutArc = arc<typeof pieSegments[number]>().innerRadius(58).outerRadius(94);
  usePublish(props, { intent: 'surveys', surface: props.surface, route: `company/poll/${submitted ? 'results' : 'vote'}`, stage: submitted ? 'results' : 'vote', summary: submitted ? `${total} anonymous responses` : 'Daily employee poll ready', visibleIds: pollOptions.map((option) => option.id), selectedId: choice || undefined, nextActions: submitted ? ['Change vote'] : ['Choose answer', 'Submit vote'] });
  return <CompanyFrame experience={props} layout={`company-daily-poll-${submitted ? 'results' : 'vote'}`} eyebrow="Daily signal / Anonymous" title="What would improve your work this week?" subtitle="One practical question each day, with aggregate results shown after voting." source="Session-local poll fixture / Individual responses are not shown">
    <div className={styles.poll}>{submitted ? <><div className={styles.actions}><CheckmarkCircle24Filled /><strong>Vote recorded for this session</strong><Badge appearance="outline">{total} responses</Badge></div><div className={styles.surveyResults}><figure className={styles.donutFigure}><svg className={styles.donut} viewBox="0 0 220 220" role="img" aria-label={`Aggregate results from ${total} anonymous responses`}><title>Aggregate employee poll results</title><g transform="translate(110 110)">{pieSegments.map((segment) => <path key={segment.data.id} d={donutArc(segment) || undefined} fill={segment.data.color} stroke={tokens.colorNeutralBackground2} strokeWidth="4"><title>{segment.data.label}: {segment.data.votes} responses</title></path>)}</g></svg><figcaption className={styles.donutCenter}><strong className={styles.donutTotal}>{total}</strong><span className={styles.secondary}>responses</span></figcaption></figure><div className={styles.resultLegend} role="list" aria-label="Poll result details">{results.map((option) => { const percent = option.votes / total * 100; return <div key={option.id} className={styles.resultItem} role="listitem"><span className={styles.resultSwatch} style={{ backgroundColor: option.color }} aria-hidden="true" /><span className={styles.copy}><strong>{option.label}</strong><span className={styles.secondary}>{option.votes} responses</span></span><span className={styles.resultValue}><strong>{percent.toFixed(1)}%</strong>{option.id === choice && <span className={styles.secondary}>Your vote</span>}</span></div>; })}</div></div><Button onClick={() => setSubmitted(false)}>Change my vote</Button></> : <><div className={styles.pollPrompt}><strong>Choose the one change that would help you most.</strong><span className={styles.secondary}>Select one answer. Your response is anonymous.</span></div><RadioGroup className={styles.pollOptions} value={choice} onChange={(_, data) => setChoice(data.value)} aria-label="Poll options">{pollOptions.map((option) => <Radio key={option.id} className={mergeClasses(styles.pollOption, choice === option.id && styles.pollOptionSelected)} value={option.id} label={<span className={styles.pollOptionLabel}><strong>{option.label}</strong><span className={styles.secondary}>{option.detail}</span></span>} />)}</RadioGroup><div className={styles.voteFooter}><span className={styles.selectedChoice}>{selected ? <><CheckmarkCircle24Filled />Selected: {selected.label}</> : 'Select an option to continue'}</span><Button appearance="primary" disabled={!choice} onClick={() => setSubmitted(true)}>Submit anonymous vote</Button></div><span className={styles.secondary}>Results appear after voting. No free text or identity is collected.</span></> }</div>
  </CompanyFrame>;
}

const menus = {
  Helsinki: [{ name: 'Roasted salmon bowl', detail: 'Dill potatoes / seasonal greens', tags: ['High protein'], image: embeddedMedia.foodBowl }, { name: 'Nordic root vegetable plate', detail: 'Barley / herb sauce / seeds', tags: ['Vegan', 'Gluten aware'], image: embeddedMedia.foodSalad }, { name: 'Mushroom rye pasta', detail: 'Forest mushrooms / oat cream', tags: ['Vegetarian'], image: embeddedMedia.foodPasta }],
  Redmond: [{ name: 'Wood-fired market pizza', detail: 'Tomato / mozzarella / basil', tags: ['Vegetarian'], image: embeddedMedia.foodRedmondPizza }, { name: 'Pacific barbecue plate', detail: 'Smoked chicken / market vegetables', tags: ['High protein'], image: embeddedMedia.foodRedmondBbq }, { name: 'Garden harvest tacos', detail: 'Corn tortilla / beans / salsa', tags: ['Vegan'], image: embeddedMedia.foodRedmondTacos }],
  Singapore: [{ name: 'Steamed garden dumplings', detail: 'Ginger / greens / sesame', tags: ['Vegetarian'], image: embeddedMedia.foodSingaporeDumplings }, { name: 'Laksa noodle bowl', detail: 'Rice noodles / coconut broth', tags: ['Local favorite'], image: embeddedMedia.foodSingaporeNoodles }, { name: 'Ginger soy rice plate', detail: 'Jasmine rice / vegetables / tofu', tags: ['Vegan'], image: embeddedMedia.foodSingaporeRice }]
} as const;

export function CampusMenuExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [location, setLocation] = React.useState<keyof typeof menus>((props.defaultLocation as keyof typeof menus) || (props.toolProperties?.location as keyof typeof menus) || 'Helsinki');
  const [day, setDay] = React.useState('Today');
  usePublish(props, { intent: 'campusMenu', surface: props.surface, route: 'company/campus-menu', stage: 'menu', summary: `${location} menu for ${day.toLowerCase()}`, visibleIds: menus[location].map((item) => item.name), filters: { location, day }, nextActions: ['Change location', 'Change day', 'View dish'] });
  return <CompanyFrame experience={props} layout="company-campus-menu" eyebrow="Campus dining" title="What’s cooking today" subtitle="Visual menus by campus, service window, and dietary need." source="Fictional campus dining fixture / Ingredients may change">
    <div className={styles.toolbar}><Field label="Campus"><Select value={location} onChange={(event) => setLocation(event.currentTarget.value as keyof typeof menus)}>{Object.keys(menus).map((office) => <option key={office}>{office}</option>)}</Select></Field><Field label="Day"><Select value={day} onChange={(event) => setDay(event.currentTarget.value)}><option>Today</option><option>Tomorrow</option><option>Friday</option></Select></Field></div>
    <div className={styles.actions}><Badge color="success">Open 11:00–14:30</Badge><Badge appearance="outline"><Location24Regular /> {location} Market Hall</Badge></div>
    <div className={styles.menuGrid}>{menus[location].map((item) => <article key={item.name} className={styles.menuCard}><img className={styles.menuImage} src={item.image} alt="" /><span className={styles.menuCopy}><strong>{item.name}</strong><span className={styles.secondary}>{item.detail}</span><span className={styles.actions}>{item.tags.map((tag) => <Badge key={tag} appearance="outline">{tag}</Badge>)}</span><Button appearance="subtle" icon={<Food24Regular />}>View ingredients</Button></span></article>)}</div>
  </CompanyFrame>;
}

const projects = [{ id: 'aurora', name: 'Project Aurora', owner: 'Diego Siciliani', health: 'At risk', progress: 68, budget: '€2.8M / €3.1M', variance: '+12 days', risk: 'Accessibility validation capacity', confidence: [82,80,77,74,70,68] }, { id: 'lab', name: 'Helsinki lab launch', owner: 'Johanna Lorenz', health: 'On track', progress: 86, budget: '€1.2M / €1.3M', variance: 'On schedule', risk: 'No critical risks', confidence: [72,75,78,81,84,86] }, { id: 'support', name: 'Support insight program', owner: 'Joni Sherman', health: 'Watch', progress: 54, budget: '€840K / €900K', variance: '+4 days', risk: 'Data migration dependency', confidence: [68,66,63,61,58,54] }];

export function ProjectHealthExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [selectedId, setSelectedId] = React.useState(projects.some((project) => project.id === props.defaultScope) ? props.defaultScope as string : 'aurora');
  const selected = projects.find((project) => project.id === selectedId) || projects[0];
  usePublish(props, { intent: 'projectHealth', surface: props.surface, route: `company/projects/${selected.id}`, stage: 'portfolio', summary: `${selected.name}: ${selected.health}`, visibleIds: projects.map((project) => project.id), selectedId, nextActions: ['Select project', 'Review risk', 'Open plan'] });
  return <CompanyFrame experience={props} layout="company-project-health" eyebrow={`Portfolio health / Q1 FY${String(EVERGREEN_NOW.getUTCFullYear() + 1).slice(-2)}`} title="Projects that need attention" subtitle="Delivery confidence, budget, schedule, and the next owned risk in one review." source={`Fictional portfolio fixture / Updated ${formatDate(dateOnlyAtDayOffset(-1))}`}>
    <div className={styles.statusGrid}>{projects.map((project) => <button key={project.id} type="button" className={mergeClasses(styles.statusCard, selectedId === project.id && styles.statusSelected)} onClick={() => setSelectedId(project.id)}><span className={styles.actions}><Badge color={project.health === 'On track' ? 'success' : project.health === 'At risk' ? 'danger' : 'warning'}>{project.health}</Badge><span className={styles.secondary}>{project.progress}% complete</span></span><strong>{project.name}</strong><ProgressBar value={project.progress / 100} /><span className={styles.secondary}>{project.owner}</span></button>)}</div>
    <TrendChart title={`${selected.name} delivery confidence`} labels={['W1','W2','W3','W4','W5','Now']} values={selected.confidence} target={[80,80,80,80,80,80]} />
    <div className={styles.detail}><div className={styles.metrics}><span className={styles.metric}><span className={styles.secondary}>Progress</span><strong className={styles.metricValue}>{selected.progress}%</strong></span><span className={styles.metric}><span className={styles.secondary}>Forecast / baseline</span><strong>{selected.budget}</strong></span><span className={styles.metric}><span className={styles.secondary}>Schedule</span><strong>{selected.variance}</strong></span></div><div><strong>Top delivery signal</strong><p className={styles.subtitle}>{selected.risk}</p></div><div className={styles.actions}><Button appearance="primary">Open project plan</Button><Button>Review milestones</Button></div></div>
  </CompanyFrame>;
}

function TrendChart(props: { title: string; labels: readonly string[]; values: readonly number[]; target?: readonly number[]; prefix?: string }): React.ReactElement {
  const styles = useStyles();
  const width = 620; const height = 220; const pad = { left: 48, right: 20, top: 18, bottom: 32 };
  const all = [...props.values, ...(props.target || [])]; const min = Math.min(...all) * .96; const max = Math.max(...all) * 1.04;
  const x = (index: number): number => pad.left + index / Math.max(1, props.labels.length - 1) * (width - pad.left - pad.right);
  const y = (value: number): number => pad.top + (1 - (value - min) / Math.max(1, max - min)) * (height - pad.top - pad.bottom);
  const path = (values: readonly number[]): string => values.map((value, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(value)}`).join(' ');
  return <figure className={styles.chart} aria-label={props.title}><strong>{props.title}</strong><svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} role="img"><title>{props.title}</title>{[0,.5,1].map((step) => { const lineY = pad.top + step * (height - pad.top - pad.bottom); return <line key={step} x1={pad.left} x2={width-pad.right} y1={lineY} y2={lineY} stroke={tokens.colorNeutralStroke2} />; })}{props.target && <path d={path(props.target)} fill="none" stroke={tokens.colorNeutralForeground3} strokeWidth="2" strokeDasharray="5 5" />}<path d={path(props.values)} fill="none" stroke={tokens.colorBrandBackground} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{props.values.map((value,index) => <circle key={index} cx={x(index)} cy={y(value)} r="4" fill={tokens.colorBrandBackground} />)}{props.labels.map((label,index) => <text key={`${label}-${index}`} className={styles.chartLabel} x={x(index)} y={height-10} textAnchor="middle">{label}</text>)}</svg><span className={styles.actions}><Badge color="brand">Actual</Badge>{props.target && <Badge appearance="outline">Target</Badge>}<span className={styles.secondary}>Latest: {props.prefix}{props.values[props.values.length-1].toLocaleString()}</span></span></figure>;
}

const salesSeries = { EMEA: [3.1,3.5,3.8,4.2,4.6,5.1], Americas: [4.2,4.5,4.7,5.2,5.5,5.9], APAC: [2.1,2.4,2.8,3.1,3.5,3.9] } as const;

export function SalesPerformanceExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [region, setRegion] = React.useState<keyof typeof salesSeries>((props.defaultFilter as keyof typeof salesSeries) || 'EMEA');
  const [period, setPeriod] = React.useState(props.defaultScope || 'Q1 FY27');
  const values = salesSeries[region];
  usePublish(props, { intent: 'salesPerformance', surface: props.surface, route: 'company/sales', stage: 'performance', summary: `${region} bookings €${values[values.length-1]}M`, visibleIds: ['bookings','pipeline','win-rate','margin'], filters: { region, period }, nextActions: ['Change region', 'Change period', 'Inspect trend'] });
  return <CompanyFrame experience={props} layout="company-sales-performance" eyebrow="Sales / Authorized fixture" title="Bookings and pipeline" subtitle="Actual versus target with region, quarter, and commercial quality visible." source="Fictional CRM fixture / EUR millions">
    <div className={styles.toolbar}><Field label="Region"><Select value={region} onChange={(event) => setRegion(event.currentTarget.value as keyof typeof salesSeries)}>{Object.keys(salesSeries).map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Period"><Select value={period} onChange={(event) => setPeriod(event.currentTarget.value)}><option>Q1 FY27</option><option>Q4 FY26</option><option>Trailing 12 months</option></Select></Field></div>
    <div className={styles.metrics}><span className={styles.metric}><span className={styles.secondary}>Bookings</span><strong className={styles.metricValue}>€{values[values.length-1]}M</strong><span className={styles.positive}>+12.4% vs prior quarter</span></span><span className={styles.metric}><span className={styles.secondary}>Qualified pipeline</span><strong className={styles.metricValue}>€14.8M</strong><span>2.9× coverage</span></span><span className={styles.metric}><span className={styles.secondary}>Win rate</span><strong className={styles.metricValue}>44%</strong><span className={styles.positive}>+3.2 pts</span></span><span className={styles.metric}><span className={styles.secondary}>Gross margin</span><strong className={styles.metricValue}>34%</strong><span>Target 33%</span></span></div>
    <TrendChart title={`${region} bookings trend`} labels={['Apr','May','Jun','Jul','Aug','Sep']} values={values} target={[3.2,3.5,3.9,4.3,4.7,5]} prefix="€" />
  </CompanyFrame>;
}

const goalPeriods = {
  'Q1 FY27': { status: 'On track overall', statusColor: 'success', goals: [{ id: 'customer', title: 'Earn customer trust at scale', owner: 'Customer Experience', progress: 82, keyResults: [['Experience score','82 / 85',.96],['Critical issue response','94% / 95%',.99]] }, { id: 'responsible', title: 'Scale responsible AI adoption', owner: 'Product & Engineering', progress: 71, keyResults: [['Production AI experiences','5 / 8',.625],['Controls complete','82% / 100%',.82]] }, { id: 'people', title: 'Grow an inclusive global culture', owner: 'People & Community', progress: 76, keyResults: [['Learning completion','88% / 95%',.93],['Belonging score','79 / 82',.96]] }] },
  'FY27': { status: 'Annual plan in progress', statusColor: 'informative', goals: [{ id: 'customer', title: 'Earn customer trust at scale', owner: 'Customer Experience', progress: 24, keyResults: [['Experience score','82 / 90',.91],['Critical issue response','94% / 97%',.97]] }, { id: 'responsible', title: 'Scale responsible AI adoption', owner: 'Product & Engineering', progress: 19, keyResults: [['Production AI experiences','5 / 18',.28],['Controls complete','82% / 100%',.82]] }, { id: 'people', title: 'Grow an inclusive global culture', owner: 'People & Community', progress: 22, keyResults: [['Learning completion','88% / 98%',.90],['Belonging score','79 / 86',.92]] }] },
  'Q4 FY26': { status: 'Period closed', statusColor: 'success', goals: [{ id: 'customer', title: 'Deepen customer confidence', owner: 'Customer Experience', progress: 96, keyResults: [['Experience score','80 / 80',1],['Critical issue response','92% / 92%',1]] }, { id: 'responsible', title: 'Establish responsible AI foundations', owner: 'Product & Engineering', progress: 91, keyResults: [['Production AI experiences','4 / 4',1],['Controls complete','91% / 95%',.96]] }, { id: 'people', title: 'Strengthen our connected culture', owner: 'People & Community', progress: 94, keyResults: [['Learning completion','93% / 92%',1],['Belonging score','78 / 80',.98]] }] }
} as const;

export function GoalsScorecardsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [period, setPeriod] = React.useState<keyof typeof goalPeriods>((props.defaultScope as keyof typeof goalPeriods) || 'Q1 FY27');
  const scorecard = goalPeriods[period];
  const goals = scorecard.goals;
  usePublish(props, { intent: 'goalsScorecards', surface: props.surface, route: 'company/goals', stage: 'scorecard', summary: `${goals.length} company objectives for ${period}`, visibleIds: goals.map((goal) => goal.id), filters: { period }, nextActions: ['Change period', 'Review objective', 'Open source'] });
  return <CompanyFrame experience={props} layout="company-goals-scorecards" eyebrow="Company scorecard" title="Outcomes that define success" subtitle="Published objectives, accountable owners, and exact key-result progress." source="Fictional strategy fixture / Recently published">
    <div className={styles.actions}><Field label="Reporting period"><Select value={period} onChange={(event) => setPeriod(event.currentTarget.value as keyof typeof goalPeriods)}>{(Object.keys(goalPeriods) as (keyof typeof goalPeriods)[]).map((item) => <option key={item}>{item}</option>)}</Select></Field><Badge color={scorecard.statusColor}>{scorecard.status}</Badge></div>
    <div className={styles.list}>{goals.map((goal) => <article key={goal.id} className={styles.goal}><span className={styles.actions}><Target24Regular /><strong>{goal.title}</strong><Badge color={goal.progress >= 80 ? 'success' : 'warning'}>{goal.progress}%</Badge></span><span className={styles.secondary}>{goal.owner}</span>{goal.keyResults.map(([label,value,progress]) => <div key={label} className={styles.keyResult}><span>{label}</span><strong>{value}</strong><ProgressBar className={styles.keyResultBar} value={progress as number} aria-label={`${label}: ${value}`} /></div>)}</article>)}</div>
  </CompanyFrame>;
}

const stockData = { '1W': [86.8,87.4,87.1,88.2,89.35], '1M': [82.4,83.9,84.7,86.2,85.6,87.1,89.35], '3M': [76.2,79.4,81.8,80.7,84.2,86.5,89.35], YTD: [68.5,72.4,75.1,78.9,82.3,85.7,89.35], '1Y': [61.8,66.3,72.5,70.1,76.8,82.4,89.35] } as const;

export function CompanyStockExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const [period, setPeriod] = React.useState<keyof typeof stockData>((props.defaultScope as keyof typeof stockData) || '1M');
  const values = stockData[period];
  const delta = values[values.length-1] - values[0];
  usePublish(props, { intent: 'companyStock', surface: props.surface, route: `company/stock/${period}`, stage: 'market-detail', summary: `ZAVA $89.35, ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} for ${period}`, visibleIds: ['price','volume','range','market-cap'], filters: { period }, nextActions: ['Change period', 'Review price trend', 'Open market source'] });
  return <CompanyFrame experience={props} layout="company-stock-market-detail" eyebrow="NASDAQ / ZAVA" title="Zava company stock" subtitle="Delayed fictional market data with period comparison and source context." source="Fictional delayed market fixture / Not investment advice">
    <div className={styles.stockHero}><span><span className={styles.stockLabel}>Last close</span><div className={styles.stockPrice}>$89.35</div><strong className={styles.stockDelta}>+{delta.toFixed(2)} / +{(delta/values[0]*100).toFixed(1)}% {period}</strong></span><span className={styles.copy}><span className={styles.stockMeta}>As of {formatDate(dateOnlyAtDayOffset(-1), { month: 'short', day: 'numeric', year: 'numeric' })} / 16:00 ET</span><Badge className={styles.stockStatus}>Market closed</Badge></span></div>
    <div className={styles.actions}>{(Object.keys(stockData) as (keyof typeof stockData)[]).map((item) => <Button key={item} appearance={period === item ? 'primary' : 'secondary'} onClick={() => setPeriod(item)}>{item}</Button>)}</div>
    <TrendChart title={`ZAVA price / ${period}`} labels={values.map((_,index) => index === 0 ? 'Start' : index === values.length-1 ? 'Now' : '')} values={values} target={values.map(() => 84.5)} prefix="$" />
    <div className={styles.metrics}><span className={styles.metric}><span className={styles.secondary}>Day range</span><strong>$87.82–$90.14</strong></span><span className={styles.metric}><span className={styles.secondary}>52-week range</span><strong>$58.40–$92.10</strong></span><span className={styles.metric}><span className={styles.secondary}>Volume</span><strong>4.8M</strong></span><span className={styles.metric}><span className={styles.secondary}>Market cap</span><strong>$42.7B</strong></span></div><span className={styles.disclaimer}>Values are fictional, delayed, and provided only for this product demonstration.</span>
  </CompanyFrame>;
}

export function OfficeDetailsExperience(props: IZavaExperienceProps): React.ReactElement {
  usePublish(props, { intent: 'officeDetails', surface: props.surface, route: 'company/offices', stage: 'map', summary: 'Five selectable Zava offices with local services', visibleIds: ['los-angeles','new-york','london','helsinki','singapore'], nextActions: ['Select map marker', 'Choose office', 'Review services'] });
  return <CompanyFrame experience={props} layout="company-office-map" eyebrow="Global offices / Live local context" title="Zava around the world" subtitle="Explore local time, address, employee services, and workplace availability from the map." source="Fictional office fixture / Local times frozen for demo"><OfficeMap /></CompanyFrame>;
}