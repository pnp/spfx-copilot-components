import * as React from 'react';
import { Badge, makeStyles, tokens } from '@fluentui/react-components';
import expertFinderLogo from '../assets/expert-finder-logo.png';
import type { ExpertSkill } from '../models/Expert';
import * as strings from 'ExpertFinderCopilotComponentStrings';

const useStyles = makeStyles({
  header: { position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', padding: '24px',
    overflow: 'hidden', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundImage: `linear-gradient(120deg, ${tokens.colorNeutralBackground1}, ${tokens.colorBrandBackground2})`,
    '::after': { content: '""', position: 'absolute', width: '46%', height: '180px', right: '-24px', bottom: '-120px',
      borderRadius: '50%', backgroundColor: tokens.colorBrandBackground2, transform: 'rotate(-18deg)', pointerEvents: 'none' } },
  mark: { display: 'grid', placeItems: 'center', width: '52px', height: '52px', flexShrink: 0 },
  logo: { display: 'block', width: '52px', height: '52px', objectFit: 'contain' },
  title: { margin: 0, fontSize: '26px', lineHeight: '32px', fontWeight: 700, letterSpacing: '-0.6px' },
  subtitle: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '6px', color: tokens.colorNeutralForeground2 },
  label: { marginLeft: 'auto', flexShrink: 0 },
  text: { minWidth: 0, position: 'relative', zIndex: 1 },
  full: { padding: '32px', '@media (max-width: 600px)': { padding: '20px' } }
});

export function ExpertFinderHeader({ skill, isDemo, fullscreen }: { skill?: ExpertSkill; isDemo: boolean; fullscreen: boolean }): React.ReactElement {
  const styles = useStyles();
  return <header className={`${styles.header} ${fullscreen ? styles.full : ''}`}>
    <span className={styles.mark} aria-hidden="true">
      <img className={styles.logo} src={expertFinderLogo} alt="" width={52} height={52} />
    </span>
    <div className={styles.text}>
      <h1 className={styles.title}>{strings.AppTitle}</h1>
      <div className={styles.subtitle}>{skill ? <>Experts in <Badge appearance="tint" color="brand" size="large">{skill}</Badge></> : 'Find the right people for your next idea.'}</div>
    </div>
    <Badge className={styles.label} appearance="outline" size="small">{isDemo ? strings.DemoDataLabel : strings.SharePointDataLabel}</Badge>
  </header>;
}
