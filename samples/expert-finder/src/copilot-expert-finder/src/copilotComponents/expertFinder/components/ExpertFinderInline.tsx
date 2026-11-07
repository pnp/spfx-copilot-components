import * as React from 'react';
import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowExpand20Regular } from '@fluentui/react-icons';
import type { Expert, ExpertPhotos } from '../models/Expert';
import { ExpertAvatar } from './ExpertAvatar';
import { ExpertActions } from './ExpertActions';

const useStyles = makeStyles({
  list: { listStyleType: 'none', margin: 0, padding: 0 },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  person: { flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' },
  name: { fontWeight: 600, fontSize: '16px', lineHeight: '22px' },
  role: { color: tokens.colorNeutralForeground2, marginTop: '3px', lineHeight: '20px' },
  footer: { display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '20px' },
  hint: { color: tokens.colorNeutralForeground2, margin: 0, fontSize: '13px' }
});

interface InlineProps {
  experts: Expert[];
  photos: ExpertPhotos;
  onPhotoSettled: (id: string, failed: boolean) => void;
  isDemo: boolean;
  canExpand: boolean;
  expanding: boolean;
  onExpand: () => void;
  onOpenLink: (url: string) => Promise<void>;
}

export function ExpertFinderInline(props: InlineProps): React.ReactElement {
  const styles = useStyles();
  return <>
    <ul className={styles.list} aria-label="Matching experts">
      {props.experts.slice(0, 3).map(expert => <li className={styles.row} key={expert.id}>
        <ExpertAvatar expert={expert} photo={props.photos[expert.id]} onPhotoSettled={props.onPhotoSettled} />
        <div className={styles.person}><div className={styles.name}>{expert.displayName}</div><div className={styles.role}>{expert.jobTitle}</div></div>
        <ExpertActions expert={expert} isDemo={props.isDemo} compact onOpenLink={props.onOpenLink} />
      </li>)}
    </ul>
    <div className={styles.footer}>
      {props.experts.length > 3 && <p className={styles.hint}>{props.experts.length - 3} more experts available in the extended view.</p>}
      {props.canExpand && <Button appearance="outline" size="large" icon={<ArrowExpand20Regular />} disabled={props.expanding} onClick={props.onExpand}>
        {props.expanding ? 'Opening fullscreen…' : 'Open in fullscreen'}
      </Button>}
    </div>
  </>;
}
