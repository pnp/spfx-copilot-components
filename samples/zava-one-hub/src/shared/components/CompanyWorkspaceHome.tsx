import * as React from 'react';
import { Badge, Button, Checkbox, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Alert24Regular, Megaphone24Regular, Settings24Regular } from '@fluentui/react-icons';
import { zavaCapabilities } from '../catalog/capabilities';
import type { IZavaExperienceProps } from '../models/zavaOne';
import { companyPortalColumnAssignments } from '../models/workspacePortalDefaults';
import { dateOnlyAtDayOffset, formatDate } from '../utils/evergreenDates';
import { PersonalPortalDnd } from './PersonalPortalDnd';
import { PersonalRightPanel } from './PersonalRightPanel';

const companyCapabilities = zavaCapabilities.filter((capability) => capability.tab === 'company');
const visibilityStorageKey = 'zava-one:company-portal-visibility:v1';
const layoutStorageKey = 'zava-one:company-portal-layout:v1';
const essentialIntents = ['companyNews', 'announcements', 'knowledge', 'companyEvents'];

const useStyles = makeStyles({
  shell: { display: 'flex', width: '100%', minHeight: '100%', minWidth: 0, overflow: 'visible', backgroundColor: tokens.colorNeutralBackground2, '@container zava-experience (max-width: 900px)': { flexDirection: 'column' } },
  main: { flexGrow: 1, minWidth: 0, overflow: 'visible' },
  home: { display: 'grid', gap: tokens.spacingVerticalXL, paddingRight: tokens.spacingHorizontalXS },
  hero: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, .7fr)', gap: tokens.spacingHorizontalXL, padding: tokens.spacingHorizontalXL, color: tokens.colorNeutralForegroundOnBrand, backgroundImage: 'linear-gradient(130deg, #075fce 0%, #006f75 58%, #138a3d 100%)', borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8, '@container zava-experience (max-width: 860px)': { gridTemplateColumns: '1fr' } },
  heroLead: { display: 'flex', alignItems: 'flex-start', gap: tokens.spacingHorizontalL, minWidth: 0 },
  heroIcon: { display: 'grid', placeItems: 'center', width: '52px', height: '52px', flexShrink: 0, color: tokens.colorNeutralForegroundOnBrand, backgroundColor: 'rgba(255,255,255,.16)', borderRadius: tokens.borderRadiusCircular },
  heroCopy: { display: 'grid', gap: tokens.spacingVerticalXS, minWidth: 0 },
  overline: { fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { margin: 0, color: tokens.colorNeutralForegroundOnBrand, fontSize: tokens.fontSizeBase600, lineHeight: tokens.lineHeightBase600, fontWeight: tokens.fontWeightSemibold },
  subtitle: { margin: 0, color: tokens.colorNeutralForegroundOnBrand, opacity: .9 },
  updates: { display: 'grid', alignContent: 'start' },
  update: { display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: tokens.spacingHorizontalS, alignItems: 'start', padding: `${tokens.spacingVerticalS} 0`, borderBottom: '1px solid rgba(255,255,255,.22)' },
  updateCopy: { display: 'grid', gap: tokens.spacingVerticalXXS },
  settingsBody: { display: 'grid', gap: tokens.spacingVerticalL, alignContent: 'start' },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },
  settingsList: { display: 'grid', gap: tokens.spacingVerticalS }
});

export interface ICompanyWorkspaceHomeProps extends IZavaExperienceProps {
  renderExperience: (intent: string) => React.ReactNode;
  editMode: boolean;
  personalizeRequest: number;
}

export function CompanyWorkspaceHome(props: ICompanyWorkspaceHomeProps): React.ReactElement {
  const styles = useStyles();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const personalizeRequestRef = React.useRef(props.personalizeRequest);
  const [visiblePanels, setVisiblePanels] = React.useState<Readonly<Record<string, boolean>>>(() => {
    const defaults = companyCapabilities.reduce<Record<string, boolean>>((next, capability) => ({ ...next, [capability.intentKey]: true }), {});
    try {
      const saved = props.targetDocument.defaultView?.sessionStorage.getItem(visibilityStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        Object.keys(defaults).forEach((panel) => { if (typeof parsed[panel] === 'boolean') defaults[panel] = parsed[panel] as boolean; });
      }
    } catch {
      // Restricted hosts can disable session storage; visibility remains local to this mount.
    }
    return defaults;
  });

  React.useEffect(() => {
    try {
      props.targetDocument.defaultView?.sessionStorage.setItem(visibilityStorageKey, JSON.stringify(visiblePanels));
    } catch {
      // Restricted hosts can disable session storage; visibility remains local to this mount.
    }
  }, [props.targetDocument, visiblePanels]);

  React.useEffect(() => {
    if (personalizeRequestRef.current === props.personalizeRequest) return;
    personalizeRequestRef.current = props.personalizeRequest;
    setSettingsOpen(true);
  }, [props.personalizeRequest]);

  const panels = companyCapabilities.map((capability) => ({ id: capability.intentKey, title: capability.title, content: props.renderExperience(capability.intentKey), visible: visiblePanels[capability.intentKey] }));
  const setAll = (visible: boolean): void => setVisiblePanels((current) => Object.keys(current).reduce<Record<string, boolean>>((next, panel) => ({ ...next, [panel]: visible || essentialIntents.indexOf(panel) >= 0 }), {}));

  return <div className={styles.shell} data-layout="company-portal-dashboard">
    <main className={styles.main}><section className={styles.home}>
      <section className={styles.hero} aria-label="Company-wide updates">
        <div className={styles.heroLead}><span className={styles.heroIcon}><Megaphone24Regular /></span><span className={styles.heroCopy}><span className={styles.overline}>Company-wide / {formatDate(dateOnlyAtDayOffset(0), { weekday: 'long', month: 'long', day: 'numeric' })}</span><h1 className={styles.title}>Here’s what’s happening across Zava.</h1><p className={styles.subtitle}>The latest announcements, events, and operational updates for every employee.</p><span><Badge appearance="filled" color="informative">3 active updates</Badge></span></span></div>
        <div className={styles.updates}>
          <span className={styles.update}><Alert24Regular /><span className={styles.updateCopy}><strong>Global town hall / {formatDate(dateOnlyAtDayOffset(10))}</strong><span>Live captions and recording available worldwide.</span></span></span>
          <span className={styles.update}><Alert24Regular /><span className={styles.updateCopy}><strong>Customer information policy updated</strong><span>Effective today / Acknowledgement requested by Friday.</span></span></span>
          <span className={styles.update}><Alert24Regular /><span className={styles.updateCopy}><strong>Helsinki accessibility lab opens</strong><span>Employee tours begin Thursday at 10:00 EEST.</span></span></span>
        </div>
      </section>
      <PersonalPortalDnd panels={panels} targetDocument={props.targetDocument} editMode={props.editMode} onHidePanel={(panelId) => setVisiblePanels((current) => ({ ...current, [panelId]: false }))} storageKey={layoutStorageKey} ariaLabel="Company experiences" dataAttribute="data-company-capability" defaultColumnAssignments={companyPortalColumnAssignments} />
    </section></main>
    {settingsOpen && <PersonalRightPanel title="Personalize Company" icon={<Settings24Regular />} onDismiss={() => setSettingsOpen(false)} footnote="Stored in this browser session only — not saved permanently."><div className={styles.settingsBody}><Text>Choose the Company experiences shown in this workspace. Company-wide updates remain pinned at the top.</Text><div className={styles.actions}><Button appearance="subtle" onClick={() => setAll(true)}>Show all</Button><Button appearance="subtle" onClick={() => setAll(false)}>Essentials only</Button></div><div className={styles.settingsList}>{companyCapabilities.map((capability) => <Checkbox key={capability.intentKey} label={capability.title} checked={visiblePanels[capability.intentKey]} onChange={(_, data) => setVisiblePanels((current) => ({ ...current, [capability.intentKey]: data.checked === true }))} />)}</div></div></PersonalRightPanel>}
  </div>;
}