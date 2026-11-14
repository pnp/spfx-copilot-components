import * as React from 'react';
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
  ArrowRight24Regular,
  BookOpen24Regular,
  CheckmarkCircle24Filled,
  ChevronRight20Regular,
  Clock24Regular,
  DismissCircle24Regular,
  Edit24Regular,
  News24Regular,
  Open24Regular,
  PeopleCommunity24Regular,
  Search24Regular,
  Send24Regular,
  Settings24Regular,
  Sparkle24Regular,
  WeatherSunny24Regular
} from '@fluentui/react-icons';
import { getCapabilityByIntent, zavaCapabilities } from '../catalog/capabilities';
import { CatalogCapabilityExperience } from './CatalogCapabilityExperience';
import {
  CampusMenuExperience,
  CompanyEventsExperience,
  CompanyStockExperience,
  EmployeeSurveysExperience,
  GoalsScorecardsExperience,
  OfficeDetailsExperience,
  PeopleExperience,
  ProjectHealthExperience,
  SalesPerformanceExperience
} from './CompanyCapabilityExperiences';
import { CompanyWorkspaceHome } from './CompanyWorkspaceHome';
import {
  AgendaExperience,
  GlossaryExperience,
  PersonalWorkspaceHome,
  SecurityReportingExperience
} from './FocusedCapabilityExperiences';
import {
  ExpensesTravelExperience,
  ImportantMailExperience,
  PersonalLearningExperience,
  ShiftsExperience,
  TasksExperience,
  WorkFilesExperience
} from './PersonalDetailExperiences';
import {
  ApprovalsExperience,
  EquityExperience,
  ItHelpExperience,
  TimeOffExperience,
  WorkplaceSpaceExperience
} from './PersonalWorkflowExperiences';
import { zavaLearningAssignments } from '../mockData/learning';
import { zavaNews } from '../mockData/news';
import { getZavaPerson, zavaPeople } from '../mockData/personas';
import { embeddedMedia } from '../media/embeddedMedia';
import type {
  IVacationDecisionEvent,
  IVacationRequest,
  IZavaExperienceProps,
  IZavaModelContextSnapshot,
  VacationDecision,
  VacationRequestStatus,
  ZavaWorkspaceTab
} from '../models/zavaOne';
import { useVacationRequests, zavaSessionStore } from '../services/ZavaSessionStore';
import { ResponsiveExpandButton } from './ResponsiveExpandButton';
import { SubmissionReceipt } from './SubmissionReceipt';
import { formatDate } from '../utils/evergreenDates';

function settle(action: Promise<void> | undefined): void {
  action?.catch(() => undefined);
}

const useStyles = makeStyles({
  root: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    containerType: 'inline-size',
    containerName: 'zava-experience',
    overflowWrap: 'anywhere',
    color: tokens.colorNeutralForeground1
  },
  inlineRoot: {
    maxWidth: '720px',
    marginRight: 'auto',
    marginLeft: 'auto',
    padding: tokens.spacingHorizontalM
  },
  experience: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    overflow: 'hidden'
  },
  compactExperience: {
    gap: tokens.spacingVerticalS
  },
  brandStrip: {
    height: '5px',
    marginTop: `calc(-1 * ${tokens.spacingHorizontalL})`,
    marginRight: `calc(-1 * ${tokens.spacingHorizontalL})`,
    marginLeft: `calc(-1 * ${tokens.spacingHorizontalL})`,
    backgroundImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%)'
  },
  header: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalL
  },
  headerText: {
    display: 'grid',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  eyebrow: {
    color: tokens.colorBrandForeground1,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase'
  },
  title: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold
  },
  compactTitle: {
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 0,
    maxWidth: '760px',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  field: {
    minWidth: '180px',
    flexGrow: 1
  },
  source: {
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  newsLead: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.7fr) minmax(260px, 1fr)',
    gap: tokens.spacingHorizontalL,
    minWidth: 0
  },
  newsLeadImage: {
    width: '100%',
    height: 'clamp(220px, 34vw, 430px)',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge
  },
  newsImageButton: { display: 'block', width: '100%', height: '100%', minWidth: 0, padding: 0, overflow: 'hidden', backgroundColor: 'transparent', border: 0, borderRadius: tokens.borderRadiusLarge, cursor: 'pointer', ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  newsLeadCopy: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    minWidth: 0
  },
  newsHeroTile: { position: 'relative', minHeight: '380px', overflow: 'hidden', color: '#ffffff', backgroundColor: '#11364f', borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow16 },
  newsHeroTileImage: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  newsHeroTileShade: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(180deg, rgba(17,54,79,.08) 20%, rgba(17,54,79,.94) 100%)', pointerEvents: 'none' },
  newsHeroTileCopy: { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 1, display: 'grid', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalXL },
  newsHeroTitleButton: { padding: 0, color: '#ffffff', backgroundColor: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer', fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold, ':hover': { textDecorationLine: 'underline' }, ':focus-visible': { outline: '3px solid #ffffff', outlineOffset: '2px' } },
  newsHeroSummary: { margin: 0, maxWidth: '720px', color: '#ffffff', lineHeight: tokens.lineHeightBase300 },
  newsTileMosaic: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: tokens.spacingHorizontalM, '@container zava-experience (max-width: 680px)': { gridTemplateColumns: '1fr' } },
  newsTileFeatured: { gridColumn: '1 / -1', minHeight: '400px', '@container zava-experience (max-width: 680px)': { gridColumn: 'auto', minHeight: '320px' } },
  newsVisualTile: { position: 'relative', minHeight: '280px', overflow: 'hidden', color: '#ffffff', backgroundColor: '#11364f', borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8 },
  newsVisualTileCopy: { position: 'absolute', right: 0, bottom: 0, left: 0, zIndex: 1, display: 'grid', gap: tokens.spacingVerticalXS, padding: tokens.spacingHorizontalL },
  newsVisualTileTitle: { padding: 0, color: '#ffffff', backgroundColor: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer', fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500, fontWeight: tokens.fontWeightSemibold, ':hover': { textDecorationLine: 'underline' }, ':focus-visible': { outline: '3px solid #ffffff', outlineOffset: '2px' } },
  newsLayers: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(290px, .55fr)', gap: tokens.spacingHorizontalL, alignItems: 'stretch', '@container zava-experience (max-width: 820px)': { gridTemplateColumns: '1fr' } },
  newsLayerRail: { display: 'grid', alignContent: 'start', gap: tokens.spacingVerticalS },
  newsLayerItem: { display: 'grid', gridTemplateColumns: '88px minmax(0, 1fr)', gap: tokens.spacingHorizontalM, minHeight: '88px', padding: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium },
  newsLayerImage: { width: '88px', height: '88px', objectFit: 'cover', borderRadius: tokens.borderRadiusSmall },
  newsCarousel: { display: 'grid', gap: tokens.spacingVerticalM },
  newsCarouselStage: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, .7fr)', minHeight: '390px', overflow: 'hidden', backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8, '@container zava-experience (max-width: 720px)': { gridTemplateColumns: '1fr' } },
  newsCarouselImage: { width: '100%', height: '100%', minHeight: '300px', objectFit: 'cover' },
  newsCarouselCopy: { display: 'grid', alignContent: 'center', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXL },
  newsCarouselControls: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacingHorizontalM },
  newsFilmstrip: { display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(270px, 32%)', gap: tokens.spacingHorizontalM, overflowX: 'auto', paddingBottom: tokens.spacingVerticalS, scrollSnapType: 'x mandatory', '@container zava-experience (max-width: 720px)': { gridAutoColumns: 'minmax(270px, 84%)' } },
  newsFilmstripItem: { scrollSnapAlign: 'start' },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: tokens.fontSizeBase500,
    lineHeight: tokens.lineHeightBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  storyTitle: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold
  },
  newsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: tokens.spacingHorizontalM
  },
  newsGridEditorial: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))'
  },
  newsGridCompact: {
    gridTemplateColumns: '1fr'
  },
  newsCard: {
    display: 'grid',
    gridTemplateRows: '150px auto',
    minWidth: 0,
    padding: 0,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    boxShadow: tokens.shadow2,
    ':hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: tokens.shadow8
    }
  },
  newsCardCompact: {
    gridTemplateRows: 'auto',
    gridTemplateColumns: '112px minmax(0, 1fr)'
  },
  newsCompactList: { display: 'grid', gap: tokens.spacingVerticalXS },
  newsCompactRow: { display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', minHeight: '112px', overflow: 'hidden', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, '@container zava-experience (max-width: 520px)': { gridTemplateColumns: '96px minmax(0, 1fr)' } },
  newsCompactImage: { width: '100%', height: '100%', minHeight: '112px', objectFit: 'cover' },
  newsThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  newsCardCopy: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM
  },
  newsTitleButton: { padding: 0, color: tokens.colorNeutralForeground1, backgroundColor: 'transparent', border: 0, textAlign: 'left', cursor: 'pointer', ':hover': { color: tokens.colorBrandForeground1, textDecorationLine: 'underline' }, ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  detailImage: {
    width: '100%',
    maxHeight: '480px',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusLarge
  },
  personLine: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2
  },
  stagePanel: {
    display: 'grid',
    gap: tokens.spacingVerticalL
  },
  prominentPanel: {
    padding: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusLarge,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundImage: 'linear-gradient(125deg, #0f6cbd 0%, #006f75 62%, #107c41 100%)',
    boxShadow: tokens.shadow16
  },
  prominentPanelText: {
    maxWidth: '720px',
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400
  },
  recognitionCelebration: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(220px, .95fr)', overflow: 'hidden', backgroundColor: tokens.colorNeutralBackground2, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8, '@container zava-experience (max-width: 600px)': { gridTemplateColumns: '1fr' } },
  recognitionCelebrationCopy: { display: 'grid', alignContent: 'center', gap: tokens.spacingVerticalM, padding: tokens.spacingHorizontalXXL },
  recognitionCelebrationTitle: { margin: 0, fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold },
  recognitionVisual: { position: 'relative', minHeight: '260px' },
  recognitionImage: { width: '100%', height: '100%', minHeight: '260px', objectFit: 'cover' },
  recognitionImageMessage: { position: 'absolute', right: tokens.spacingHorizontalM, bottom: tokens.spacingVerticalM, left: tokens.spacingHorizontalM, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalM, color: '#ffffff', backgroundColor: 'rgba(17,54,79,.92)', borderRadius: tokens.borderRadiusMedium, fontWeight: tokens.fontWeightSemibold },
  recognitionSteps: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, flexWrap: 'wrap' },
  recognitionPeople: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  recognitionAvatars: { display: 'flex', alignItems: 'center', paddingRight: '8px' },
  recognitionAvatar: { marginRight: '-8px', border: `2px solid ${tokens.colorNeutralBackground2}`, borderRadius: tokens.borderRadiusCircular },
  recognitionReceiptPerson: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: tokens.spacingHorizontalM, textAlign: 'left' },
  recognitionReceiptMessage: { margin: 0, paddingLeft: tokens.spacingHorizontalL, color: tokens.colorNeutralForeground1, borderLeft: `4px solid ${tokens.colorPaletteBlueBorderActive}`, fontSize: tokens.fontSizeBase400, lineHeight: tokens.lineHeightBase400 },
  recognitionRecipients: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
    gap: tokens.spacingHorizontalS
  },
  recognitionRecipient: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    cursor: 'pointer',
    ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' }
  },
  recognitionRecipientSelected: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    border: `2px solid ${tokens.colorPaletteBlueBorderActive}`
  },
  recognitionValues: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  recognitionValue: { padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`, color: tokens.colorPaletteBlueForeground2, backgroundColor: tokens.colorPaletteBlueBackground2, border: `1px solid ${tokens.colorPaletteBlueBorderActive}`, borderRadius: tokens.borderRadiusCircular, cursor: 'pointer', ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' } },
  recognitionValueSelected: { boxShadow: `0 0 0 2px ${tokens.colorPaletteBlueBorderActive}`, fontWeight: tokens.fontWeightSemibold },
  messageMeta: { display: 'flex', justifyContent: 'space-between', gap: tokens.spacingHorizontalM, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  list: {
    display: 'grid',
    gap: tokens.spacingVerticalS
  },
  listButton: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    minWidth: 0,
    padding: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: 'left',
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
    ':focus-visible': { outline: `3px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' }
  },
  listCopy: {
    display: 'grid',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0
  },
  primaryText: {
    fontWeight: tokens.fontWeightSemibold
  },
  secondaryText: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  progressTrack: {
    height: '8px',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusCircular
  },
  progressFill: {
    height: '100%',
    width: '42%',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: tokens.borderRadiusCircular
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
    gap: tokens.spacingHorizontalM
  },
  reviewBlock: {
    display: 'grid',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderLeft: `4px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
    gap: tokens.spacingHorizontalM
  },
  metric: {
    display: 'grid',
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  metricValue: {
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
    fontWeight: tokens.fontWeightSemibold
  },
  vacationRow: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(150px, 1fr) minmax(130px, .8fr) auto auto',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    '@container zava-experience (max-width: 620px)': {
      gridTemplateColumns: 'auto minmax(0, 1fr)',
      '& > :nth-child(n+3)': { gridColumn: '2' }
    }
  },
  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: tokens.spacingHorizontalM
  },
  evidence: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  warning: {
    color: tokens.colorPaletteDarkOrangeForeground1
  },
  success: {
    color: tokens.colorPaletteGreenForeground1
  },
  shell: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: 0,
    overflow: 'visible',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground2
  },
  shellBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    flexShrink: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: '#11364f',
    borderTop: '5px solid transparent',
    borderImage: 'linear-gradient(90deg, #075fce 0%, #075fce 32%, #138a3d 32%, #138a3d 55%, #b32687 55%, #b32687 78%, #d84f38 78%) 1'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold
  },
  brandMark: {
    display: 'grid',
    placeItems: 'center',
    width: '36px',
    height: '36px',
    color: '#11364f',
    backgroundColor: '#ffffff',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: tokens.fontWeightBold
  },
  tabs: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXL}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  tab: {
    minHeight: '44px',
    paddingRight: tokens.spacingHorizontalL,
    paddingLeft: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground2,
    backgroundColor: 'transparent',
    border: 0,
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontWeight: tokens.fontWeightSemibold
  },
  tabSelected: {
    color: tokens.colorBrandForeground1,
    borderBottomColor: tokens.colorBrandStroke1
  },
  canvas: {
    flexGrow: 0,
    minHeight: 0,
    width: '100%',
    overflow: 'visible'
  },
  canvasInner: {
    width: 'min(100%, 1680px)',
    marginRight: 'auto',
    marginLeft: 'auto',
    padding: 'clamp(16px, 3cqw, 40px)',
    boxSizing: 'border-box'
  },
  workspaceHero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(260px, .8fr)',
    gap: tokens.spacingHorizontalXL,
    alignItems: 'stretch',
    marginBottom: tokens.spacingVerticalXL
  },
  workspaceHeroCopy: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: tokens.spacingVerticalM,
    padding: 'clamp(24px, 4vw, 56px)',
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundImage: 'linear-gradient(125deg, #0f4c81 0%, #007f73 70%, #176b47 100%)',
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow16
  },
  workspaceHeroAside: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    alignContent: 'center',
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: tokens.spacingHorizontalL,
    alignItems: 'start'
  },
  workspaceBand: {
    marginTop: tokens.spacingVerticalXL
  },
  explorerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, .8fr) minmax(300px, 1.4fr)',
    gap: tokens.spacingHorizontalL
  },
  categoryList: {
    display: 'grid',
    gap: tokens.spacingVerticalXS,
    alignContent: 'start'
  },
  capabilityDetail: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge
  },
  personalTools: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXS, marginLeft: 'auto', alignSelf: 'center' },
  personalToolsHeader: { gap: 0, padding: '2px', backgroundColor: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.48)', borderRadius: tokens.borderRadiusMedium },
  personalDivider: { width: '1px', height: '20px', flexShrink: 0, backgroundColor: tokens.colorNeutralStroke2 },
  personalDividerHeader: { backgroundColor: 'rgba(255,255,255,.48)' },
  personalToolButton: { minHeight: '36px', ':focus-visible': { outline: `2px solid ${tokens.colorStrokeFocus2}`, outlineOffset: '2px' }, '@container zava-experience (max-width: 520px)': { width: '40px', minWidth: '40px', height: '40px', paddingRight: 0, paddingLeft: 0 } },
  personalToolButtonActive: { color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackground, ':hover': { color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackgroundHover }, ':hover:active': { color: tokens.colorNeutralForegroundOnBrand, backgroundColor: tokens.colorBrandBackgroundPressed } },
  personalToolButtonHeader: { color: '#ffffff', backgroundColor: 'transparent', ':hover': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,.16)' }, ':hover:active': { color: '#ffffff', backgroundColor: 'rgba(255,255,255,.24)' }, ':focus-visible': { outline: '2px solid #ffffff', outlineOffset: '2px' } },
  personalToolButtonHeaderActive: { color: '#11364f', backgroundColor: '#ffffff', ':hover': { color: '#11364f', backgroundColor: '#f5f5f5' }, ':hover:active': { color: '#11364f', backgroundColor: '#e6e6e6' } },
  personalToolLabel: { '@container zava-experience (max-width: 520px)': { display: 'none' } },
  responsiveOneColumn: {
    '@container zava-experience (max-width: 800px)': {
      gridTemplateColumns: '1fr'
    }
  }
});

function usePublishContext(
  publishContext: IZavaExperienceProps['publishContext'],
  snapshot: IZavaModelContextSnapshot
): void {
  const signature = JSON.stringify(snapshot);
  const snapshotRef = React.useRef<IZavaModelContextSnapshot>(snapshot);
  snapshotRef.current = snapshot;

  React.useEffect(() => {
    if (publishContext) {
      publishContext(snapshotRef.current).catch(() => undefined);
    }
  }, [publishContext, signature]);
}

function ExperienceHeader(props: {
  eyebrow: string;
  title: string;
  subtitle: string;
  compact: boolean;
  icon: React.ReactElement;
  onRequestFullscreen?: () => Promise<void>;
}): React.ReactElement {
  const styles = useStyles();
  return (
    <header className={styles.header}>
      <div className={styles.headerText}>
        <span className={styles.eyebrow}>{props.eyebrow}</span>
        <h2 className={mergeClasses(styles.title, props.compact && styles.compactTitle)}>{props.title}</h2>
        <p className={styles.subtitle}>{props.subtitle}</p>
      </div>
      <div className={styles.actions}>
        {props.icon}
        {props.onRequestFullscreen && (
          <ResponsiveExpandButton onExpand={props.onRequestFullscreen} />
        )}
      </div>
    </header>
  );
}

function ExperienceRoot(props: { children: React.ReactNode; inline: boolean; layout: string; density?: string }): React.ReactElement {
  const styles = useStyles();
  return (
    <section className={mergeClasses(styles.root, props.inline && styles.inlineRoot)} data-layout={props.layout} data-density={props.density || 'comfortable'}>
      <div className={mergeClasses(styles.experience, props.density === 'compact' && styles.compactExperience)}>
        <div className={styles.brandStrip} />
        {props.children}
      </div>
    </section>
  );
}

export function CompanyNewsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const webPartAuthoring = props.surface === 'webPart';
  const layout = webPartAuthoring ? props.layout || props.primaryView || 'editorial' : 'editorial';
  const [selectedId, setSelectedId] = React.useState<string>();
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [followUpStatus, setFollowUpStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const selected = zavaNews.find((story) => story.id === selectedId);
  const edition = props.defaultScope || 'All';
  const editionStories = edition === 'Global'
    ? zavaNews.filter((story) => story.region === 'Global')
    : edition === 'Local'
      ? zavaNews.filter((story) => story.region === 'Finland')
      : zavaNews;
  const visibleStories = editionStories.slice(0, inline ? 3 : props.maxItems || editionStories.length);
  const lead = visibleStories[0];
  const leadAuthor = getZavaPerson(lead.authorId);
  const supportingStories = visibleStories.slice(1);

  usePublishContext(props.publishContext, {
    intent: 'companyNews', surface: props.surface, route: selected ? 'company/news/detail' : 'company/news',
    stage: selected ? 'detail' : 'collection', summary: selected ? selected.title : `${visibleStories.length} current Zava stories`,
    visibleIds: [lead, ...supportingStories].map((story) => story.id), selectedId,
    filters: { layout, edition }, nextActions: selected ? ['Back to news'] : ['Open a story', 'View in full screen']
  });

  React.useEffect(() => setFollowUpStatus('idle'), [selectedId]);

  const askCopilot = async (): Promise<void> => {
    if (!selected || !props.sendFollowUp) return;
    setFollowUpStatus('sending');
    try {
      await props.sendFollowUp(`Summarize this SharePoint news story and explain what it means for me: "${selected.title}".`);
      setFollowUpStatus('sent');
    } catch {
      setFollowUpStatus('error');
    }
  };

  if (selected) {
    const author = getZavaPerson(selected.authorId);
    return (
      <ExperienceRoot inline={inline} layout="news-detail" density={props.density}>
        <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setSelectedId(undefined)}>Back to news</Button>
        {props.showImages !== false && <img className={styles.detailImage} src={selected.imageUrl} alt={selected.imageAlt} />}
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>{selected.category} / {selected.region}</span>
          <h2 className={styles.title}>{selected.title}</h2>
          <p className={styles.subtitle}><strong>{selected.summary}</strong></p>
          <p className={styles.subtitle}>{selected.detail}</p>
          <div className={styles.personLine}>
            <Avatar size={32} name={author.displayName} image={{ src: author.photoUrl }} />
            <span>{author.displayName} / Published {formatDate(selected.publishedAt, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div className={styles.actions}>
          {props.sendFollowUp && <Button appearance="primary" icon={followUpStatus === 'sending' ? <Spinner size="tiny" /> : <Send24Regular />} disabled={followUpStatus === 'sending'} onClick={askCopilot}>{followUpStatus === 'sending' ? 'Sending to Copilot' : 'Ask Copilot about this story'}</Button>}
          {followUpStatus === 'sent' && <Badge color="success" role="status">Sent to Copilot</Badge>}
          {followUpStatus === 'error' && <Badge color="danger" role="alert">Copilot could not accept the message</Badge>}
          <Button icon={<Open24Regular />}>View news in SharePoint</Button>
        </div>
        {props.showSource !== false && <div className={styles.source}>SharePoint news / Zava Communications / Published and expiry metadata preserved</div>}
      </ExperienceRoot>
    );
  }

  const gridClass = mergeClasses(
    styles.newsGrid,
    layout === 'editorial' && styles.newsGridEditorial,
    layout === 'compact' && styles.newsGridCompact
  );

  const renderHeroTile = (story: (typeof zavaNews)[number]): React.ReactElement => {
    const author = getZavaPerson(story.authorId);
    return <article className={styles.newsHeroTile}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${story.title}`} onClick={() => setSelectedId(story.id)}><img className={styles.newsHeroTileImage} src={story.imageUrl} alt={story.imageAlt} /></button>}<span className={styles.newsHeroTileShade} /><div className={styles.newsHeroTileCopy}><span className={styles.statusRow}><Badge color="brand">Featured</Badge><Badge appearance="filled">{story.category} / {story.region}</Badge></span><button type="button" className={styles.newsHeroTitleButton} onClick={() => setSelectedId(story.id)}>{story.title}</button><p className={styles.newsHeroSummary}>{story.summary}</p><span className={styles.personLine}><Avatar size={28} name={author.displayName} image={{ src: author.photoUrl }} /><span style={{ color: '#ffffff' }}>{author.displayName} / Zava Communications</span></span></div></article>;
  };

  const renderVisualTile = (story: (typeof zavaNews)[number], featured: boolean = false): React.ReactElement => {
    const author = getZavaPerson(story.authorId);
    return <article key={story.id} className={mergeClasses(styles.newsVisualTile, featured && styles.newsTileFeatured, layout === 'filmstrip' && styles.newsFilmstripItem)}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${story.title}`} onClick={() => setSelectedId(story.id)}><img className={styles.newsHeroTileImage} src={story.imageUrl} alt={story.imageAlt} /></button>}<span className={styles.newsHeroTileShade} /><div className={styles.newsVisualTileCopy}><span className={styles.eyebrow} style={{ color: '#ffffff' }}>{story.category} / {story.region}</span><button type="button" className={styles.newsVisualTileTitle} onClick={() => setSelectedId(story.id)}>{story.title}</button><span style={{ color: '#ffffff' }}>{story.summary}</span><span style={{ color: '#ffffff' }}>{author.displayName}</span></div></article>;
  };

  const renderCompactRow = (story: (typeof zavaNews)[number]): React.ReactElement => {
    const author = getZavaPerson(story.authorId);
    return <article key={story.id} className={styles.newsCompactRow}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${story.title}`} onClick={() => setSelectedId(story.id)}><img className={styles.newsCompactImage} src={story.imageUrl} alt={story.imageAlt} /></button>}<span className={styles.newsCardCopy}><span className={styles.eyebrow}>{story.category} / {story.region}</span><button type="button" className={styles.newsTitleButton} onClick={() => setSelectedId(story.id)}><span className={styles.primaryText}>{story.title}</span></button><span className={styles.secondaryText}>{story.summary}</span><span className={styles.personLine}><Avatar size={24} name={author.displayName} image={{ src: author.photoUrl }} />{author.displayName}</span></span></article>;
  };

  const renderEditorial = (): React.ReactElement => <><div className={mergeClasses(styles.newsLead, styles.responsiveOneColumn)}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${lead.title}`} onClick={() => setSelectedId(lead.id)}><img className={styles.newsLeadImage} src={lead.imageUrl} alt={lead.imageAlt} /></button>}<div className={styles.newsLeadCopy}><div className={styles.statusRow}><Badge color="brand">Featured</Badge><Badge appearance="outline">{lead.category}</Badge></div><h3 className={styles.storyTitle}><button type="button" className={styles.newsTitleButton} onClick={() => setSelectedId(lead.id)}>{lead.title}</button></h3><p className={styles.subtitle}>{lead.summary}</p><div className={styles.personLine}><Avatar size={32} name={leadAuthor.displayName} image={{ src: leadAuthor.photoUrl }} /><span>{leadAuthor.displayName} / Zava Communications</span></div><Button appearance="primary" icon={<ArrowRight24Regular />} onClick={() => setSelectedId(lead.id)}>Read the story</Button></div></div><div className={gridClass} aria-label="Supporting Zava news">{supportingStories.map((story) => { const author = getZavaPerson(story.authorId); return <article key={story.id} className={styles.newsCard}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${story.title}`} onClick={() => setSelectedId(story.id)}><img className={styles.newsThumb} src={story.imageUrl} alt={story.imageAlt} /></button>}<span className={styles.newsCardCopy}><span className={styles.eyebrow}>{story.category} / {story.region}</span><button type="button" className={styles.newsTitleButton} onClick={() => setSelectedId(story.id)}><span className={styles.primaryText}>{story.title}</span></button><span className={styles.secondaryText}>{story.summary}</span><span className={styles.personLine}><Avatar size={24} name={author.displayName} image={{ src: author.photoUrl }} /> {author.displayName}</span></span></article>; })}</div></>;

  const renderLayout = (): React.ReactElement => {
    if (layout === 'tiles') return <div className={styles.newsTileMosaic} aria-label="Zava news tiles">{visibleStories.map((story, index) => renderVisualTile(story, index === 0))}</div>;
    if (layout === 'layers') return <div className={styles.newsLayers}>{renderHeroTile(lead)}<div className={styles.newsLayerRail} aria-label="More Zava news">{supportingStories.slice(0, 5).map((story) => <article key={story.id} className={styles.newsLayerItem}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${story.title}`} onClick={() => setSelectedId(story.id)}><img className={styles.newsLayerImage} src={story.imageUrl} alt={story.imageAlt} /></button>}<span className={styles.newsCardCopy}><span className={styles.eyebrow}>{story.category}</span><button type="button" className={styles.newsTitleButton} onClick={() => setSelectedId(story.id)}><strong>{story.title}</strong></button><span className={styles.secondaryText}>{story.summary}</span></span></article>)}</div></div>;
    if (layout === 'carousel') {
      const activeIndex = carouselIndex % visibleStories.length;
      const activeStory = visibleStories[activeIndex];
      return <div className={styles.newsCarousel}><div className={styles.newsCarouselStage}>{props.showImages !== false && <button type="button" className={styles.newsImageButton} aria-label={`Read ${activeStory.title}`} onClick={() => setSelectedId(activeStory.id)}><img className={styles.newsCarouselImage} src={activeStory.imageUrl} alt={activeStory.imageAlt} /></button>}<div className={styles.newsCarouselCopy}><span className={styles.eyebrow}>{activeStory.category} / {activeStory.region}</span><h3 className={styles.storyTitle}><button type="button" className={styles.newsTitleButton} onClick={() => setSelectedId(activeStory.id)}>{activeStory.title}</button></h3><p className={styles.subtitle}>{activeStory.summary}</p><Button appearance="primary" onClick={() => setSelectedId(activeStory.id)}>Read the story</Button></div></div><div className={styles.newsCarouselControls}><Button onClick={() => setCarouselIndex((index) => (index - 1 + visibleStories.length) % visibleStories.length)}>Previous</Button><span className={styles.secondaryText}>{activeIndex + 1} of {visibleStories.length}</span><Button onClick={() => setCarouselIndex((index) => (index + 1) % visibleStories.length)}>Next</Button></div></div>;
    }
    if (layout === 'filmstrip') return <div className={styles.newsFilmstrip} data-responsive-scroll aria-label="Zava news filmstrip">{visibleStories.map((story) => renderVisualTile(story))}</div>;
    if (layout === 'compact') return <div className={styles.newsCompactList} aria-label="Zava news list">{visibleStories.map(renderCompactRow)}</div>;
    return renderEditorial();
  };

  return (
    <ExperienceRoot inline={inline} layout={`news-${layout}`} density={props.density}>
      <ExperienceHeader
        eyebrow="Company news"
        title={props.title || (inline ? 'Across Zava this week' : 'One company. A world of possibilities.')}
        subtitle="Leadership, customer, office, and community stories from Zava Communications."
        compact={inline}
        icon={<News24Regular />}
        onRequestFullscreen={inline ? props.requestFullscreen : undefined}
      />
      {renderLayout()}
      {props.showSource !== false && <div className={styles.source}>C06 / SharePoint news / Zava Communications / Eight authored stories</div>}
    </ExperienceRoot>
  );
}

export function LearningExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [stage, setStage] = React.useState<'overview' | 'collection' | 'detail'>(props.primaryView === 'collection' ? 'collection' : 'overview');
  const learningFilter = props.defaultScope || 'Required';
  const visibleAssignments = zavaLearningAssignments.filter((assignment) => learningFilter === 'All'
    || (learningFilter === 'In progress' ? assignment.status === 'inProgress' : assignment.required));
  const [selectedId, setSelectedId] = React.useState<string>(visibleAssignments[0]?.id || zavaLearningAssignments[0].id);
  const selected = zavaLearningAssignments.find((item) => item.id === selectedId) || visibleAssignments[0] || zavaLearningAssignments[0];

  usePublishContext(props.publishContext, {
    intent: 'learning', surface: props.surface, route: `personal/learning/${stage}`, stage,
    summary: stage === 'overview' ? 'Three required assignments; protecting customer information is next' : selected.title,
    visibleIds: stage === 'collection' ? visibleAssignments.map((item) => item.id) : [selected.id], selectedId,
    filters: { learning: learningFilter },
    nextActions: stage === 'overview' ? ['View all required learning'] : ['Open assignment', 'Back']
  });

  return (
    <ExperienceRoot inline={inline} layout={`learning-${stage}`} density={props.density}>
      <ExperienceHeader eyebrow="Required learning" title={props.title || 'Learning that protects customer trust'}
        subtitle="Three required assignments, prioritized by due date and source status."
        compact={inline} icon={<BookOpen24Regular />} onRequestFullscreen={inline ? props.requestFullscreen : undefined} />
      {stage === 'overview' && (
        <div className={styles.stagePanel}>
          <div className={styles.prominentPanel}>
            <Badge appearance="filled" color="warning">Due {formatDate(zavaLearningAssignments[0].dueDate || '')}</Badge>
            <h3 className={styles.storyTitle}>{zavaLearningAssignments[0].title}</h3>
            <p className={styles.prominentPanelText}>{zavaLearningAssignments[0].description}</p>
            <div className={styles.statusRow}><Clock24Regular /><span>18 minutes</span><span>42% complete</span></div>
          </div>
          <div className={styles.actions}>
            <Button appearance="primary" onClick={() => { setSelectedId(zavaLearningAssignments[0].id); setStage('detail'); }}>Continue course</Button>
            <Button onClick={() => setStage('collection')}>View {visibleAssignments.length} assignments</Button>
          </div>
        </div>
      )}
      {stage === 'collection' && (
        <div className={styles.stagePanel}>
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('overview')}>Back to overview</Button>
          <div className={styles.list}>
            {visibleAssignments.map((assignment) => (
              <button key={assignment.id} className={styles.listButton} type="button" onClick={() => { setSelectedId(assignment.id); setStage('detail'); }}>
                <BookOpen24Regular />
                <span className={styles.listCopy}>
                  <span className={styles.primaryText}>{assignment.title}</span>
                  <span className={styles.secondaryText}>{assignment.durationMinutes} min / Due {assignment.dueDate || 'No due date'} / {assignment.status}</span>
                </span>
                <ChevronRight20Regular />
              </button>
            ))}
          </div>
        </div>
      )}
      {stage === 'detail' && (
        <div className={styles.stagePanel}>
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('collection')}>Back to required learning</Button>
          <div className={styles.reviewBlock}>
            <span className={styles.eyebrow}>{selected.required ? 'Required assignment' : 'Recommended'}</span>
            <h3 className={styles.storyTitle}>{selected.title}</h3>
            <p className={styles.subtitle}>{selected.description}</p>
            <div className={styles.progressTrack} aria-label={`${selected.progress}% complete`}><div className={styles.progressFill} /></div>
            <div className={styles.statusRow}><Badge>{selected.durationMinutes} minutes</Badge><Badge>{selected.progress}% complete</Badge><Badge>Transcript available</Badge></div>
            <Badge appearance="outline">Learning source handoff available in tenant host</Badge>
          </div>
        </div>
      )}
      {props.showSource !== false && <div className={styles.source}>C13 / LMS-shaped fixture / Navigation never marks a course complete</div>}
    </ExperienceRoot>
  );
}

export function RecognitionExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [stage, setStage] = React.useState<'overview' | 'compose' | 'review' | 'receipt'>(props.primaryView === 'compose' ? 'compose' : 'overview');
  const [recipientId, setRecipientId] = React.useState<string>('person-johanna');
  const [message, setMessage] = React.useState<string>('Thank you for turning accessibility principles into a welcoming lab experience for every team.');
  const [recognitionValue, setRecognitionValue] = React.useState<string>('Inclusion');
  const [audience, setAudience] = React.useState<string>(props.defaultScope === 'Company'
    ? 'Company'
    : props.defaultScope === 'My teams'
      ? 'Project Aurora team'
      : 'Zava Design community');
  const recipient = getZavaPerson(recipientId);
  const valid = message.trim().length >= 12;

  usePublishContext(props.publishContext, {
    intent: 'recognition', surface: props.surface, route: `company/praise/${stage}`, stage,
    summary: stage === 'review' ? `Reviewing praise for ${recipient.displayName}` : `Praise ${stage}`,
    visibleIds: [recipient.id], selectedId: recipient.id,
    nextActions: stage === 'compose' ? ['Review recognition'] : stage === 'review' ? ['Edit', 'Publish recognition'] : ['Send recognition']
  });

  return (
    <ExperienceRoot inline={inline} layout={`recognition-${props.primaryView || 'story'}-${stage}`} density={props.density}>
      <ExperienceHeader eyebrow="Praise and community" title={props.title || 'Celebrate great work'}
        subtitle="Send thoughtful praise to a colleague and make their contribution visible."
        compact={inline} icon={<PeopleCommunity24Regular />} onRequestFullscreen={inline ? props.requestFullscreen : undefined} />
      {stage === 'overview' && (
        <div className={styles.recognitionCelebration}>
          <div className={styles.recognitionCelebrationCopy}>
            <span className={styles.eyebrow}>A little appreciation goes a long way</span>
            <h3 className={styles.recognitionCelebrationTitle}>Make someone’s day</h3>
            <p className={styles.subtitle}>Celebrate the colleague who helped, inspired, or moved the work forward. A specific thank-you helps great work feel seen.</p>
            <div className={styles.recognitionPeople}><span className={styles.recognitionAvatars}>{[zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni].map((person) => <Avatar key={person.id} className={styles.recognitionAvatar} size={32} name={person.displayName} image={props.showImages === false ? undefined : { src: person.photoUrl }} />)}</span><span className={styles.secondaryText}>Recognize a colleague</span></div>
            {props.allowActions === false ? <Badge appearance="outline">Read-only web-part configuration</Badge> : <Button appearance="primary" icon={<Sparkle24Regular />} onClick={() => setStage('compose')}>Send praise</Button>}
            <div className={styles.recognitionSteps}><span>Choose a colleague</span><ArrowRight24Regular /><span>Write your message</span><ArrowRight24Regular /><span>Review and publish</span></div>
          </div>
          <div className={styles.recognitionVisual}><img className={styles.recognitionImage} src={embeddedMedia.communityWeek} alt="Colleagues celebrating time together" /><span className={styles.recognitionImageMessage}><Sparkle24Regular />Great work deserves to be celebrated.</span></div>
        </div>
      )}
      {stage === 'compose' && (
        <div className={styles.stagePanel}>
          <div className={styles.headerText}><strong>Who would you like to recognize?</strong><span className={styles.secondaryText}>Choose a colleague from the suggested people.</span></div>
          <div className={styles.recognitionRecipients}>{[zavaPeople.johanna, zavaPeople.diego, zavaPeople.joni].map((person) => <button key={person.id} type="button" className={mergeClasses(styles.recognitionRecipient, recipientId === person.id && styles.recognitionRecipientSelected)} aria-pressed={recipientId === person.id} onClick={() => setRecipientId(person.id)}><Avatar size={40} name={person.displayName} image={{ src: person.photoUrl }} /><span className={styles.listCopy}><strong>{person.displayName}</strong><span className={styles.secondaryText}>{person.jobTitle}</span></span></button>)}</div>
          <div className={styles.formGrid}><Field label="Audience"><Select value={audience} onChange={(event) => setAudience(event.currentTarget.value)}><option>Zava Design community</option><option>Project Aurora team</option><option>Company</option><option>Direct message</option></Select></Field></div>
          <div className={styles.headerText}><strong>Recognition value</strong><span className={styles.secondaryText}>Add context that helps the recognition feel specific.</span></div>
          <div className={styles.recognitionValues} role="radiogroup" aria-label="Recognition value">{['Teamwork','Customer impact','Innovation','Inclusion'].map((value) => <button key={value} type="button" role="radio" aria-checked={recognitionValue === value} className={mergeClasses(styles.recognitionValue, recognitionValue === value && styles.recognitionValueSelected)} onClick={() => setRecognitionValue(value)}>{value}</button>)}</div>
          <Field label="Recognition message" validationMessage={!valid ? 'Write at least 12 characters.' : undefined} validationState={valid ? 'none' : 'error'}><Textarea resize="vertical" value={message} onChange={(event) => setMessage(event.currentTarget.value)} placeholder="Describe the contribution and why it mattered." /></Field>
          <div className={styles.messageMeta}><span>Be specific about the contribution and impact.</span><span>{message.length} characters</span></div>
          <div className={styles.actions}><Button appearance="primary" disabled={!valid} onClick={() => setStage('review')}>Continue to review</Button><Button onClick={() => setStage('overview')}>Cancel</Button></div>
        </div>
      )}
      {stage === 'review' && (
        <div className={styles.stagePanel}>
          <div className={styles.reviewBlock}>
            <div className={styles.personLine}><Avatar size={48} name={recipient.displayName} image={{ src: recipient.photoUrl }} /><strong>{recipient.displayName}</strong></div>
            <span><strong>Audience:</strong> {audience}</span><span><strong>Value:</strong> {recognitionValue}</span><span>“{message}”</span>
            <Badge color="informative">Ready to publish to {audience}</Badge>
          </div>
          <div className={styles.actions}><Button icon={<Edit24Regular />} onClick={() => setStage('compose')}>Edit</Button><Button appearance="primary" icon={<Send24Regular />} onClick={() => setStage('receipt')}>Publish recognition</Button></div>
        </div>
      )}
      {stage === 'receipt' && (
        <SubmissionReceipt eyebrow="Recognition published" title="Your praise is live"
          description={`You made great work visible and gave ${recipient.firstName} a moment worth celebrating.`}
          details={[{ label: 'Recognition value', value: recognitionValue }, { label: 'Shared with', value: audience }, { label: 'Reference', value: 'REC-2026-1048' }]}
          note="Demo recognition only. No praise was published to a source service."
          actions={<><Button appearance="primary" icon={<Sparkle24Regular />} onClick={() => { setMessage(''); setRecognitionValue('Teamwork'); setStage('compose'); }}>Send another praise</Button><Button onClick={() => setStage('overview')}>Back to recognition</Button></>}>
            <div className={styles.recognitionReceiptPerson}><Avatar size={48} name={recipient.displayName} image={{ src: recipient.photoUrl }} /><span className={styles.listCopy}><strong>{recipient.displayName}</strong><span className={styles.secondaryText}>{recipient.jobTitle}</span></span><Sparkle24Regular /></div>
            <blockquote className={styles.recognitionReceiptMessage}>“{message}”</blockquote>
        </SubmissionReceipt>
      )}
      {props.showSource !== false && <div className={styles.source}>C14 / Recognition fixture / Explicit review and publication receipt</div>}
    </ExperienceRoot>
  );
}

function statusColor(status: VacationRequestStatus): 'warning' | 'success' | 'danger' {
  return status === 'pending' ? 'warning' : status === 'approved' ? 'success' : 'danger';
}

function VacationRequestRow(props: { request: IVacationRequest; onOpen: () => void }): React.ReactElement {
  const styles = useStyles();
  const person = getZavaPerson(props.request.requesterId);
  return (
    <button className={mergeClasses(styles.listButton, styles.vacationRow)} type="button" onClick={props.onOpen}>
      <Avatar size={40} name={person.displayName} image={{ src: person.photoUrl }} />
      <span className={styles.listCopy}><span className={styles.primaryText}>{person.displayName}</span><span className={styles.secondaryText}>{person.jobTitle}</span></span>
      <span className={styles.listCopy}><span>{props.request.startDate} - {props.request.endDate}</span><span className={styles.secondaryText}>{props.request.workdays} workdays</span></span>
      <Badge color={statusColor(props.request.status)}>{props.request.status}</Badge>
      <ChevronRight20Regular />
    </button>
  );
}

export function VacationApprovalsExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const requests = useVacationRequests();
  const [stage, setStage] = React.useState<'list' | 'detail' | 'decision' | 'receipt'>('list');
  const [selectedId, setSelectedId] = React.useState<string>();
  const [statusFilter, setStatusFilter] = React.useState<string>(props.primaryView === 'processed'
    ? 'processed'
    : (props.defaultScope || 'Pending').toLowerCase());
  const [query, setQuery] = React.useState<string>('');
  const [decision, setDecision] = React.useState<VacationDecision>('approved');
  const [rationale, setRationale] = React.useState<string>('');
  const [busy, setBusy] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');
  const [receipt, setReceipt] = React.useState<IVacationDecisionEvent>();
  const selected = requests.find((request) => request.id === selectedId);
  const filtered = requests.filter((request) => {
    const person = getZavaPerson(request.requesterId);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'processed' ? request.status !== 'pending' : request.status === statusFilter);
    return matchesStatus && person.displayName.toLowerCase().includes(query.toLowerCase());
  }).slice(0, props.maxItems || requests.length);
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  usePublishContext(props.publishContext, {
    intent: 'vacationApprovals', surface: props.surface, route: `personal/vacation-approvals/${stage}`, stage,
    summary: selected ? `${getZavaPerson(selected.requesterId).displayName}: ${selected.status}` : `${filtered.length} visible requests; ${pendingCount} pending`,
    visibleIds: stage === 'list' ? filtered.map((request) => request.id) : selected ? [selected.id] : [], selectedId,
    filters: { status: statusFilter, query },
    nextActions: stage === 'list'
      ? ['Open request']
      : stage === 'detail'
        ? ['Review decision', 'Back to list']
        : stage === 'decision'
          ? ['Approve request', 'Decline request', 'Edit review']
          : ['Back to updated list']
  });

  const openRequest = (requestId: string): void => {
    setSelectedId(requestId);
    setStage('detail');
    setError('');
  };

  const returnToList = (): void => {
    setStage('list');
    setSelectedId(undefined);
    setReceipt(undefined);
    setError('');
  };

  const confirmDecision = (): void => {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const event = zavaSessionStore.decide(selected.id, decision, props.currentUserName || 'Megan Bowen', rationale);
      setReceipt(event);
      setStage('receipt');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The decision could not be applied.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ExperienceRoot inline={inline} layout={`vacation-approvals-${props.primaryView || 'queue'}-${stage}`} density={props.primaryView === 'compact' ? 'compact' : props.density}>
      <ExperienceHeader eyebrow="Manager decision" title={props.title || 'Vacation request approvals'}
        subtitle="Review policy, balance, and team coverage before making a clear decision."
        compact={inline} icon={<WeatherSunny24Regular />} onRequestFullscreen={inline ? props.requestFullscreen : undefined} />
      {stage === 'list' && (
        <div className={styles.stagePanel}>
          <div className={styles.metricGrid}>
            <div className={styles.metric}><span className={styles.metricValue}>{pendingCount}</span><span>Awaiting decision</span></div>
            <div className={styles.metric}><span className={styles.metricValue}>{requests.filter((item) => item.coverage === 'conflict' && item.status === 'pending').length}</span><span>Coverage conflicts</span></div>
            <div className={styles.metric}><span className={styles.metricValue}>{requests.filter((item) => item.status !== 'pending').length}</span><span>Processed this session</span></div>
          </div>
          <div className={styles.toolbar}>
            <Field className={styles.field} label="Find employee"><Input contentBefore={<Search24Regular />} value={query} onChange={(_, data) => setQuery(data.value)} /></Field>
            <Field className={styles.field} label="Status"><Select value={statusFilter} onChange={(event) => setStatusFilter(event.currentTarget.value)}><option value="pending">Pending</option><option value="processed">Processed</option><option value="all">All requests</option></Select></Field>
            <Button onClick={() => zavaSessionStore.reset()}>Reset demo data</Button>
          </div>
          <div className={styles.list} aria-label="Vacation requests">
            {filtered.map((request) => <VacationRequestRow key={request.id} request={request} onOpen={() => openRequest(request.id)} />)}
            {!filtered.length && <div className={styles.reviewBlock}>No requests match the current filters.</div>}
          </div>
        </div>
      )}
      {selected && stage === 'detail' && (
        <div className={styles.stagePanel}>
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={returnToList}>Back to requests</Button>
          <div className={styles.personLine}><Avatar size={64} name={getZavaPerson(selected.requesterId).displayName} image={{ src: getZavaPerson(selected.requesterId).photoUrl }} /><div><h3 className={styles.storyTitle}>{getZavaPerson(selected.requesterId).displayName}</h3><span>{getZavaPerson(selected.requesterId).jobTitle} / {getZavaPerson(selected.requesterId).office}</span></div></div>
          <div className={styles.evidenceGrid}>
            <div className={styles.evidence}><span className={styles.eyebrow}>Requested dates</span><strong>{selected.startDate} - {selected.endDate}</strong><span>{selected.workdays} workdays / {selected.leaveType}</span></div>
            <div className={styles.evidence}><span className={styles.eyebrow}>Balance impact</span><strong>{selected.balanceBefore} to {selected.projectedBalance} days</strong><span>Source period: 2026 entitlement</span></div>
            <div className={styles.evidence}><span className={styles.eyebrow}>Team coverage</span><strong className={selected.coverage === 'conflict' ? styles.error : selected.coverage === 'attention' ? styles.warning : styles.success}>{selected.coverage}</strong><span>{selected.coverageNote}</span></div>
          </div>
          <div className={styles.reviewBlock}><strong>Employee note</strong><span>{selected.requesterNote}</span><span className={styles.secondaryText}>Revision {selected.revision} / Submitted {selected.submittedAt}</span></div>
          {selected.status === 'pending' ? props.allowActions === false ? <Badge appearance="outline">Read-only web-part configuration</Badge> : <Button appearance="primary" onClick={() => setStage('decision')}>Review decision</Button> : <Badge color={statusColor(selected.status)}>Already {selected.status}</Badge>}
        </div>
      )}
      {selected && stage === 'decision' && (
        <div className={styles.stagePanel}>
          <Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => setStage('detail')}>Edit review</Button>
          <div className={styles.reviewBlock}>
            <h3 className={styles.storyTitle}>Decision for {getZavaPerson(selected.requesterId).displayName}</h3>
            <span>{selected.startDate} - {selected.endDate} / {selected.workdays} workdays</span>
            <span>Projected balance: {selected.projectedBalance} days / Coverage: {selected.coverage}</span>
          </div>
          <Field label="Decision"><Select value={decision} onChange={(event) => setDecision(event.currentTarget.value as VacationDecision)}><option value="approved">Approve request</option><option value="declined">Decline request</option></Select></Field>
          {decision === 'declined' && <Field label="Reason" required validationMessage={!rationale.trim() ? 'A reason is required to decline.' : undefined} validationState={rationale.trim() ? 'none' : 'error'}><Textarea resize="vertical" value={rationale} onChange={(event) => setRationale(event.currentTarget.value)} /></Field>}
          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.actions}><Button appearance="primary" disabled={busy || (decision === 'declined' && !rationale.trim())} onClick={confirmDecision}>{busy ? <Spinner size="tiny" /> : decision === 'approved' ? 'Approve vacation request' : 'Decline vacation request'}</Button><Button onClick={() => setStage('detail')}>Cancel</Button></div>
        </div>
      )}
      {selected && receipt && stage === 'receipt' && (
        <SubmissionReceipt eyebrow="Vacation decision recorded" title={`Request ${receipt.decision}`}
          description={`Decision for ${getZavaPerson(selected.requesterId).displayName}`}
          tone={receipt.decision === 'declined' ? 'neutral' : 'success'} icon={receipt.decision === 'declined' ? <DismissCircle24Regular /> : undefined}
          details={[{ label: 'Dates', value: `${selected.startDate} - ${selected.endDate}` }, { label: 'Working days', value: selected.workdays }, { label: 'Reference', value: receipt.reference }]}
          note="Session-only demo update. No HR submission."
          actions={<Button appearance="primary" onClick={returnToList}>Back to updated list</Button>} />
      )}
      {props.showSource !== false && <div className={styles.source}>C35 / Canonical session-local request catalog / Demo data / No HR submission</div>}
    </ExperienceRoot>
  );
}

export function CapabilityExplorerExperience(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const inline = props.surface === 'copilotInline';
  const [query, setQuery] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('All');
  const [selectedId, setSelectedId] = React.useState<string>('C35');
  const [page, setPage] = React.useState<number>(0);
  const categories = ['All', 'Company', 'My work', 'Growth', 'Services', 'Business', 'Help'];
  const matches = zavaCapabilities.filter((capability) => (category === 'All' || capability.category === category) && `${capability.title} ${capability.outcome} ${capability.prompt}`.toLowerCase().includes(query.toLowerCase()));
  const pageSize = inline ? 6 : 8;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = matches.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const selected = zavaCapabilities.find((capability) => capability.id === selectedId) || matches[0] || zavaCapabilities[0];

  React.useEffect(() => setPage(0), [query, category]);

  usePublishContext(props.publishContext, {
    intent: 'capabilities', surface: props.surface, route: 'capabilities', stage: 'browse',
    summary: `${matches.length} of ${zavaCapabilities.length} capabilities match; page ${safePage + 1} of ${pageCount}; ${selected.title} selected`,
    visibleIds: pageItems.map((capability) => capability.id), selectedId: selected.id,
    filters: { query, category, page: String(safePage + 1) }, nextActions: ['Select a capability', 'Copy example prompt', 'Change page']
  });

  const copyPrompt = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(selected.prompt);
    } catch {
      // Clipboard can be unavailable in sandboxed hosts; the prompt remains visible for manual copy.
    }
  };

  return (
    <ExperienceRoot inline={inline} layout="capability-explorer">
      <ExperienceHeader eyebrow="Explore Zava One" title="What are you trying to accomplish?" subtitle="Browse all 35 business scenarios in employee language, then start with a realistic prompt." compact={inline} icon={<Sparkle24Regular />} onRequestFullscreen={inline ? props.requestFullscreen : undefined} />
      <div className={styles.toolbar}>
        <Field className={styles.field} label="Search scenarios"><Input contentBefore={<Search24Regular />} value={query} onChange={(_, data) => setQuery(data.value)} /></Field>
        <Field className={styles.field} label="Category"><Select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</Select></Field>
        <Badge appearance="outline">{matches.length} results</Badge>
      </div>
      <div className={mergeClasses(styles.explorerGrid, styles.responsiveOneColumn)}>
        <div className={styles.categoryList}>
          {pageItems.map((capability) => (
            <button key={capability.id} className={styles.listButton} type="button" onClick={() => setSelectedId(capability.id)}>
              <Badge appearance="outline">{capability.id}</Badge><span className={styles.listCopy}><strong>{capability.title}</strong><span className={styles.secondaryText}>{capability.category} / {capability.operation}</span></span><ChevronRight20Regular />
            </button>
          ))}
          <div className={styles.actions}>
            <Button disabled={safePage === 0} onClick={() => setPage(Math.max(0, safePage - 1))}>Previous</Button>
            <span>{matches.length ? safePage * pageSize + 1 : 0}-{Math.min((safePage + 1) * pageSize, matches.length)} of {matches.length}</span>
            <Button disabled={safePage >= pageCount - 1} onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}>Next</Button>
          </div>
        </div>
        <div className={styles.capabilityDetail}>
          <span className={styles.eyebrow}>{selected.id} / {selected.category}</span><h3 className={styles.storyTitle}>{selected.title}</h3><p className={styles.subtitle}>{selected.outcome}</p>
          <div className={styles.reviewBlock}><strong>Try this prompt</strong><span>“{selected.prompt}”</span></div>
          <div className={styles.actions}><Button appearance="primary" onClick={() => settle(copyPrompt())}>Copy prompt</Button><Badge color={selected.operation === 'review' ? 'warning' : selected.operation === 'submit' ? 'informative' : 'success'}>{selected.operation}</Badge></div>
        </div>
      </div>
      <div className={styles.source}>Catalog-driven / 35 operational capabilities / Preview actions are safe and local</div>
    </ExperienceRoot>
  );
}

function WorkspaceFocusedExperience(props: IZavaExperienceProps): React.ReactElement | undefined {
  switch (props.intent) {
    case 'myDay': return undefined;
    case 'agenda': return <AgendaExperience {...props} surface="workspace" />;
    case 'importantMail': return <ImportantMailExperience {...props} surface="workspace" />;
    case 'tasks': return <TasksExperience {...props} surface="workspace" />;
    case 'approvals': return <ApprovalsExperience {...props} surface="workspace" />;
    case 'expensesTravel': return <ExpensesTravelExperience {...props} surface="workspace" />;
    case 'timeOff': return <TimeOffExperience {...props} surface="workspace" />;
    case 'equity': return <EquityExperience {...props} surface="workspace" />;
    case 'workplaceSpace': return <WorkplaceSpaceExperience {...props} surface="workspace" />;
    case 'itHelp': return <ItHelpExperience {...props} surface="workspace" />;
    case 'shifts': return <ShiftsExperience {...props} surface="workspace" />;
    case 'workFiles': return <WorkFilesExperience {...props} surface="workspace" />;
    case 'companyEvents': return <CompanyEventsExperience {...props} surface="workspace" />;
    case 'people': return <PeopleExperience {...props} surface="workspace" />;
    case 'surveys': return <EmployeeSurveysExperience {...props} surface="workspace" />;
    case 'campusMenu': return <CampusMenuExperience {...props} surface="workspace" />;
    case 'projectHealth': return <ProjectHealthExperience {...props} surface="workspace" />;
    case 'salesPerformance': return <SalesPerformanceExperience {...props} surface="workspace" />;
    case 'goalsScorecards': return <GoalsScorecardsExperience {...props} surface="workspace" />;
    case 'companyStock': return <CompanyStockExperience {...props} surface="workspace" />;
    case 'officeDetails': return <OfficeDetailsExperience {...props} surface="workspace" />;
    case 'glossary': return <GlossaryExperience {...props} surface="workspace" />;
    case 'securityReporting': return <SecurityReportingExperience {...props} surface="workspace" />;
    case 'companyNews': return <CompanyNewsExperience {...props} surface="workspace" />;
    case 'learning': return <PersonalLearningExperience {...props} surface="workspace" />;
    case 'recognition': return <RecognitionExperience {...props} surface="workspace" />;
    case 'vacationApprovals': return <VacationApprovalsExperience {...props} surface="workspace" />;
    default: return props.intent === 'workspace' || props.intent === 'capabilities' ? undefined : <CatalogCapabilityExperience {...props} surface="workspace" />;
  }
}

export function ZavaOneWorkspace(props: IZavaExperienceProps): React.ReactElement {
  const styles = useStyles();
  const mode = props.workspaceMode || 'combined';
  const workspaceStyle: React.CSSProperties = { minHeight: '100dvh' };
  const intentTab: ZavaWorkspaceTab = getCapabilityByIntent(props.intent)?.tab || 'company';
  const [activeTab, setActiveTab] = React.useState<ZavaWorkspaceTab>(mode === 'company' ? 'company' : mode === 'personal' ? 'personal' : props.primaryView === 'personal' ? 'personal' : intentTab);
  const [personalEditMode, setPersonalEditMode] = React.useState(false);
  const [companyEditMode, setCompanyEditMode] = React.useState(false);
  const [personalizeRequest, setPersonalizeRequest] = React.useState(0);
  const [companyPersonalizeRequest, setCompanyPersonalizeRequest] = React.useState(0);
  const requests = useVacationRequests();
  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  React.useEffect(() => {
    if (mode === 'company') setActiveTab('company');
    if (mode === 'personal') setActiveTab('personal');
  }, [mode]);

  React.useEffect(() => {
    if (activeTab === 'personal') setCompanyEditMode(false);
    if (activeTab === 'company') setPersonalEditMode(false);
  }, [activeTab]);

  usePublishContext(props.publishContext, {
    intent: props.intent, surface: 'workspace', route: `${activeTab}/home`, stage: 'dashboard',
    summary: activeTab === 'company' ? 'Company news, events, and shared signals' : `Personal work and services; ${pendingCount} vacation decisions pending`,
    visibleIds: activeTab === 'company' ? zavaNews.slice(0, 4).map((story) => story.id) : requests.filter((request) => request.status === 'pending').map((request) => request.id),
    nextActions: activeTab === 'company' ? ['Read company news', 'View events'] : ['Review vacation requests', 'Open required learning']
  });

  const activeEditMode = activeTab === 'personal' ? personalEditMode : companyEditMode;
  const fixedMode = mode !== 'combined';
  const toolsInHeader = fixedMode && !props.hideWorkspaceHeader;
  const workspaceName = activeTab === 'personal' ? 'Personal' : 'Company';
  const workspaceTools = <div role="group" className={mergeClasses(styles.personalTools, toolsInHeader && styles.personalToolsHeader)} aria-label={`${workspaceName} workspace controls`}><Button className={mergeClasses(styles.personalToolButton, activeEditMode && styles.personalToolButtonActive, toolsInHeader && styles.personalToolButtonHeader, toolsInHeader && activeEditMode && styles.personalToolButtonHeaderActive)} appearance="subtle" icon={activeEditMode ? <CheckmarkCircle24Filled /> : <Edit24Regular />} aria-label={activeEditMode ? `Done editing ${workspaceName} workspace layout` : `Edit ${workspaceName} workspace layout`} aria-pressed={activeEditMode} title={activeEditMode ? 'Finish editing the workspace layout' : 'Reorder or hide workspace cards'} onClick={() => activeTab === 'personal' ? setPersonalEditMode((current) => !current) : setCompanyEditMode((current) => !current)}><span className={styles.personalToolLabel}>{activeEditMode ? 'Done' : 'Edit layout'}</span></Button><span className={mergeClasses(styles.personalDivider, toolsInHeader && styles.personalDividerHeader)} aria-hidden="true" /><Button className={mergeClasses(styles.personalToolButton, toolsInHeader && styles.personalToolButtonHeader)} appearance="subtle" icon={<Settings24Regular />} aria-label={`Personalize ${workspaceName} workspace`} title="Choose which workspace cards are visible" onClick={() => activeTab === 'personal' ? setPersonalizeRequest((current) => current + 1) : setCompanyPersonalizeRequest((current) => current + 1)}><span className={styles.personalToolLabel}>Personalize</span></Button></div>;
  const renderWorkspaceExperience = (intent: string): React.ReactNode => <WorkspaceFocusedExperience {...props} intent={intent} surface="workspace" showSource={false} toolProperties={undefined} publishContext={undefined} requestFullscreen={undefined} requestResize={undefined} />;

  return (
    <main className={mergeClasses(styles.root, styles.shell)} style={workspaceStyle} data-layout={`workspace-${mode}-${activeTab}`} data-density={props.density || 'comfortable'}>
      {!props.hideWorkspaceHeader && <header className={styles.shellBar}>
        <div className={styles.brand}><span className={styles.brandMark}>Z</span><span>Zava One</span></div>
        <div className={styles.statusRow}>{mode !== 'combined' && workspaceTools}<Badge appearance="filled" color="informative">Demo data</Badge><Avatar size={36} name={props.currentUserName || 'Megan Bowen'} image={{ src: zavaPeople.megan.photoUrl }} /></div>
      </header>}
      {fixedMode && props.hideWorkspaceHeader && <div className={styles.tabs}>{workspaceTools}</div>}
      {mode === 'combined' && (
        <nav className={styles.tabs} aria-label="Zava workspace">
          <button className={mergeClasses(styles.tab, activeTab === 'company' && styles.tabSelected)} type="button" aria-current={activeTab === 'company' ? 'page' : undefined} onClick={() => setActiveTab('company')}>Company</button>
          <button className={mergeClasses(styles.tab, activeTab === 'personal' && styles.tabSelected)} type="button" aria-current={activeTab === 'personal' ? 'page' : undefined} onClick={() => setActiveTab('personal')}>Personal</button>
          {workspaceTools}
        </nav>
      )}
      <div className={styles.canvas}>
        <div className={styles.canvasInner}>
          {activeTab === 'company' ? (
            <CompanyWorkspaceHome {...props} surface="workspace" editMode={companyEditMode} personalizeRequest={companyPersonalizeRequest} renderExperience={renderWorkspaceExperience} />
          ) : (
            <PersonalWorkspaceHome
              {...props}
              surface="workspace"
              editMode={personalEditMode}
              personalizeRequest={personalizeRequest}
              renderExperience={renderWorkspaceExperience}
            />
          )}
        </div>
      </div>
    </main>
  );
}