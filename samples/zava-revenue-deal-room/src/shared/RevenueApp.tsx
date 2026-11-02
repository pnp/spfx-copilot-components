import * as React from 'react';
import { Badge, Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { ArrowExpand20Regular, DataTrending20Regular, Money20Regular, PeopleTeam20Regular, ShieldCheckmark20Regular, TargetArrow20Regular } from '@fluentui/react-icons';
import { INTENTS, LENS_LABELS, type IIntentDefinition, type IRevenueProperties, type RevenueLens } from './catalog';
import { ZAVAMESH } from './brand';
import { useDealOperationsSession } from './DealOperations';
import RevenueExperiences from './RevenueExperiences';
import FullscreenWorkspace from './FullscreenWorkspace';
import { FULLSCREEN_STORIES, fullscreenLensFor, type FullscreenWorkspaceLens } from './fullscreenWorkspaceModel';

export interface IModelContextSnapshot extends Record<string, unknown> {
  readonly intent: string;
  readonly displayMode: string;
  readonly route: string;
  readonly selectedEntityId: string;
  readonly workflowStage: string;
  readonly summary: string;
  readonly availableActions: readonly string[];
}
export interface IRevenueAppProps {
  readonly definition: IIntentDefinition;
  readonly properties: IRevenueProperties;
  readonly currentUserName: string;
  readonly displayMode?: string;
  readonly onRequestFullscreen?: () => Promise<void>;
  readonly onUpdateModelContext: (snapshot: IModelContextSnapshot) => Promise<void>;
  readonly onSendFollowUp: (message: string, snapshot: IModelContextSnapshot) => Promise<boolean>;
  readonly visibleWorkspaceLens?: RevenueLens;
  readonly referenceEvidenceId?: string;
  readonly referenceRegion?: string;
  readonly workspaceState?: Readonly<Record<string, unknown>>;
  readonly workspaceFocus?: boolean;
}
const useStyles = makeStyles({
  app: { width: '100%', minWidth: 0, boxSizing: 'border-box', color: tokens.colorNeutralForeground1, backgroundColor: tokens.colorNeutralBackground1, backgroundImage: `linear-gradient(145deg, ${tokens.colorNeutralBackground1}, ${tokens.colorNeutralBackground2})`, overflow: 'hidden' },
  inline: { maxWidth: '760px', minHeight: '360px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow16 },
  full: { minHeight: '100vh' },
  hidden: { display: 'none' },
  brandLine: { height: '4px', backgroundImage: `linear-gradient(90deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundHover} 40%, ${tokens.colorPaletteLightGreenBackground3} 75%, ${tokens.colorPaletteYellowBackground3} 100%)` },
  shell: { display: 'grid', width: '100%', minWidth: 0, gridTemplateColumns: '224px minmax(0,1fr)', minHeight: 'calc(100vh - 4px)', '@media(max-width:760px)': { gridTemplateColumns: 'minmax(0,1fr)' } },
  rail: { display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, alignSelf: 'start', height: 'calc(100vh - 4px)', boxSizing: 'border-box', minWidth: 0, padding: '24px 20px', color: '#FFFFFF', backgroundImage: `url(${ZAVAMESH.meshWave}), linear-gradient(165deg, #10331C, #23701A 75%, #2C821D)`, backgroundSize: 'auto 480px, cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center bottom, center', borderRight: `1px solid ${tokens.colorNeutralStrokeOnBrand2}`, '@media(max-width:760px)': { position: 'static', height: 'auto', padding: '12px', borderRight: 0, borderBottom: `1px solid ${tokens.colorNeutralStrokeOnBrand2}` } },
  wordmark: { width: '154px', height: '30px', objectFit: 'contain', objectPosition: 'left center' },
  railCaption: { fontSize: '10px', letterSpacing: '1.6px', margin: '12px 0 28px', opacity: .8, '@media(max-width:760px)': { margin: '6px 0 12px' } },
  nav: { display: 'grid', gap: '8px', minWidth: 0, '@media(max-width:760px)': { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' } },
  navButton: { justifyContent: 'flex-start', alignItems: 'center', width: '100%', minWidth: 0, minHeight: '58px', padding: '12px', gap: '12px', textAlign: 'left', color: '#FFFFFF', border: '1px solid transparent', borderRadius: '10px', '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,.12)' }, '& .fui-Button__icon': { margin: 0, width: '20px', flexShrink: 0 }, '@media(max-width:760px)': { minHeight: '44px', padding: '10px', gap: '8px' } },
  navActive: { color: '#163B19', backgroundColor: '#F4F7F0', boxShadow: tokens.shadow8, border: '1px solid #ADD26F', '&:hover': { color: '#163B19', backgroundColor: '#FFFFFF' } },
  navLabel: { minWidth: 0, display: 'grid', gap: '4px', fontSize: '13px', lineHeight: '18px', '& strong': { fontWeight: 600 }, '& small': { fontSize: '10px', lineHeight: '14px', fontWeight: 400, opacity: .8, whiteSpace: 'normal' }, '@media(max-width:760px)': { '& small': { display: 'none' } } },
  railFooter: { marginTop: 'auto', paddingTop: '24px', borderTop: `1px solid ${tokens.colorNeutralStrokeOnBrand2}`, fontSize: '12px', lineHeight: '18px', '@media(max-width:760px)': { display: 'none' } },
  main: { minWidth: 0, width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '20px 28px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1, '@media(max-width:520px)': { padding: '16px', flexWrap: 'wrap' } },
  inlineHeader: { padding: '8px 12px', gap: '8px', flexWrap: 'nowrap', '& p': { fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase200 }, '@media(max-width:520px)': { padding: '8px 12px', flexWrap: 'nowrap' } },
  title: { margin: '4px 0', fontFamily: 'Aptos Display, Segoe UI, sans-serif', fontSize: '32px', lineHeight: '38px', letterSpacing: '-.7px', outlineStyle: 'none' },
  inlineTitle: { fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500, margin: '2px 0' },
  inlineWordmark: { width: '116px', height: '20px', objectFit: 'contain', objectPosition: 'left center', marginBottom: '2px' },
  subtitle: { margin: 0, color: tokens.colorNeutralForeground2, fontSize: '13px', lineHeight: '18px', maxWidth: '760px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
  content: { padding: '24px 28px', '@media(max-width:760px)': { padding: '16px' } },
  compactContent: { padding: '10px 12px', '@media(max-width:760px)': { padding: '10px 12px' } },
  notice: { margin: '16px 0 0', padding: '12px 0 0', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, color: tokens.colorNeutralForeground2, fontSize: '12px', lineHeight: '16px', display: 'flex', alignItems: 'center', gap: '6px' },
  compactNotice: { margin: '6px 0 0', padding: 0, fontSize: tokens.fontSizeBase100, lineHeight: tokens.lineHeightBase200 }
});

function RevenueContent(props: IRevenueAppProps & { readonly fullScreen: boolean; readonly workspaceLens: FullscreenWorkspaceLens; readonly navigationVersion: number; readonly onNavigateTask: (lens: FullscreenWorkspaceLens) => void; readonly onResetWorkspace: () => void }): React.ReactElement {
  const styles = useStyles();
  const [expandError, setExpandError] = React.useState(false);
  const session = useDealOperationsSession({ ...(props.definition.key === 'SubmitDealRequest' ? props.properties : {}), startInIntake: props.definition.key === 'SubmitDealRequest', requestId: props.definition.key === 'ReviewDealApproval' ? props.properties.requestId : undefined });
  return <>
    <header className={mergeClasses(styles.header, !props.fullScreen && styles.inlineHeader)}>
      <div>{!props.fullScreen && <img className={styles.inlineWordmark} src={ZAVAMESH.colorLogo} alt="ZavaMesh"/>}<h1 className={mergeClasses(styles.title, !props.fullScreen && styles.inlineTitle)} tabIndex={-1}>{props.fullScreen ? LENS_LABELS[props.workspaceLens] : props.definition.title}</h1><p className={styles.subtitle}>{props.fullScreen ? FULLSCREEN_STORIES[props.workspaceLens].goal : props.definition.question}</p></div>
      <div className={styles.headerActions}>{props.fullScreen ? <Badge appearance="tint">Revenue workspace</Badge> : props.onRequestFullscreen && <Button appearance="primary" icon={<ArrowExpand20Regular/>} onClick={() => props.onRequestFullscreen?.().catch(() => setExpandError(true))}>Expand</Button>}</div>
    </header>
    <div className={mergeClasses(styles.content, !props.fullScreen && styles.compactContent)}>
      <FullscreenWorkspace {...props} activeLens={props.workspaceLens}>
        {(update, send) => <RevenueExperiences {...props} dealSession={session} workspaceFocus={props.fullScreen} visibleWorkspaceLens={undefined} referenceEvidenceId={undefined} referenceRegion={undefined} workspaceState={undefined} onUpdateModelContext={update} onSendFollowUp={send}/>}
      </FullscreenWorkspace>
      {expandError && <p role="alert">The host did not open full screen. Your draft is unchanged.</p>}
      {!props.fullScreen && <p className={mergeClasses(styles.notice, styles.compactNotice)}><ShieldCheckmark20Regular/>Session-only workspace · no external updates</p>}
    </div>
  </>;
}
export default function RevenueApp(props: IRevenueAppProps): React.ReactElement {
  const styles = useStyles();
  const fullScreen = props.displayMode === 'fullscreen';
  const propertySignature = JSON.stringify(Object.keys(props.properties).sort().map(name => [name, props.properties[name as keyof IRevenueProperties]]));
  const invocation = `${props.definition.key}|${propertySignature}`;
  const [workspaceSelection, setWorkspaceSelection] = React.useState(() => ({ lens: fullscreenLensFor(props.definition), invocation }));
  const activeLens = workspaceSelection.invocation === invocation ? workspaceSelection.lens : fullscreenLensFor(props.definition);
  const [navigationVersion, setNavigationVersion] = React.useState(0);
  const [resetVersion, setResetVersion] = React.useState(0);
  const mainRef = React.useRef<HTMLElement>(null);
  const navigateTask = React.useCallback((lens: FullscreenWorkspaceLens) => setWorkspaceSelection({ lens, invocation }), [invocation]);
  const resetWorkspace = React.useCallback(() => setResetVersion(version => version + 1), []);
  const lenses: readonly FullscreenWorkspaceLens[] = ['my-deals', 'deal-room', 'commercial-desk', 'revenue-command'];
  return <div className={mergeClasses(styles.app, fullScreen ? styles.full : styles.inline)} data-layout={`${props.definition.key}-${fullScreen ? 'fullscreen' : 'inline'}`} data-inline-stage={!fullScreen ? 'true' : undefined}>
    <div className={styles.brandLine}/>
    <div className={fullScreen ? styles.shell : undefined}>
      <aside className={mergeClasses(styles.rail, !fullScreen && styles.hidden)} hidden={!fullScreen}>
        <img className={styles.wordmark} src={ZAVAMESH.whiteLogo} alt="ZavaMesh"/><p className={styles.railCaption}>REVENUE DEAL ROOM</p>
        <nav className={styles.nav} aria-label="Revenue workspaces">{lenses.map(lens => <Button key={lens} aria-label={LENS_LABELS[lens]} aria-current={activeLens === lens ? 'page' : undefined} appearance="subtle" className={mergeClasses(styles.navButton, activeLens === lens && styles.navActive)} icon={lens === 'my-deals' ? <TargetArrow20Regular/> : lens === 'deal-room' ? <PeopleTeam20Regular/> : lens === 'commercial-desk' ? <Money20Regular/> : <DataTrending20Regular/>} onClick={() => { setWorkspaceSelection({ lens, invocation }); setNavigationVersion(version => version + 1); const view = mainRef.current?.ownerDocument.defaultView; view?.requestAnimationFrame(() => mainRef.current?.querySelector('h1')?.focus()); }}><span className={styles.navLabel}><strong>{LENS_LABELS[lens]}</strong><small>{FULLSCREEN_STORIES[lens].navigation}</small></span></Button>)}</nav>
        <div className={styles.railFooter}><ShieldCheckmark20Regular/><p>Evidence. Economics.<br/>Human decisions.</p><p>{INTENTS.length} focused experiences<br/>One connected business story</p></div>
      </aside>
      <main className={styles.main} ref={mainRef}><RevenueContent key={`${invocation}|${resetVersion}`} {...props} fullScreen={fullScreen} workspaceLens={activeLens} navigationVersion={navigationVersion} onNavigateTask={navigateTask} onResetWorkspace={resetWorkspace}/></main>
    </div>
  </div>;
}
