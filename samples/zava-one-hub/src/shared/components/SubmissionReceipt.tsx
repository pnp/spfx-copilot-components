import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { CheckmarkCircle24Filled } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: { minWidth: 0, overflow: 'hidden', overflowWrap: 'anywhere', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8 },
  hero: { display: 'grid', justifyItems: 'center', gap: tokens.spacingVerticalS, padding: tokens.spacingHorizontalXL, textAlign: 'center', backgroundColor: tokens.colorPaletteGreenBackground1, borderTop: `5px solid ${tokens.colorPaletteGreenBorderActive}` },
  neutralHero: { backgroundColor: tokens.colorNeutralBackground2, borderTopColor: tokens.colorNeutralStroke1 },
  icon: { display: 'grid', placeItems: 'center', width: '56px', height: '56px', color: tokens.colorPaletteGreenForeground1, backgroundColor: tokens.colorNeutralBackground1, borderRadius: tokens.borderRadiusCircular, boxShadow: tokens.shadow4, '& > svg': { width: '28px', height: '28px' } },
  neutralIcon: { color: tokens.colorNeutralForeground2 },
  eyebrow: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold, textTransform: 'uppercase' },
  title: { margin: 0, color: tokens.colorNeutralForeground1, fontSize: tokens.fontSizeHero800, lineHeight: tokens.lineHeightHero800, fontWeight: tokens.fontWeightSemibold },
  description: { margin: 0, color: tokens.colorNeutralForeground2, maxWidth: '540px' },
  body: { display: 'grid', gap: tokens.spacingVerticalL, padding: tokens.spacingHorizontalXL },
  details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: tokens.spacingHorizontalM, margin: 0, paddingTop: tokens.spacingVerticalM, borderTop: `1px solid ${tokens.colorNeutralStroke2}` },
  detail: { display: 'grid', gap: tokens.spacingVerticalXXS, minWidth: 0, alignContent: 'start' },
  label: { color: tokens.colorNeutralForeground2, fontSize: tokens.fontSizeBase200 },
  value: { margin: 0, color: tokens.colorNeutralForeground1, fontWeight: tokens.fontWeightSemibold },
  note: { margin: 0, color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  actions: { display: 'flex', justifyContent: 'center', gap: tokens.spacingHorizontalS, flexWrap: 'wrap', padding: `0 ${tokens.spacingHorizontalXL} ${tokens.spacingVerticalXL}` }
});

export interface ISubmissionReceiptProps {
  eyebrow: string;
  title: string;
  description: string;
  details: readonly { label: string; value: React.ReactNode }[];
  note: string;
  actions: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactElement;
  tone?: 'success' | 'neutral';
}

export function SubmissionReceipt(props: ISubmissionReceiptProps): React.ReactElement {
  const styles = useStyles();
  const titleId = React.useId();
  const neutral = props.tone === 'neutral';
  return (
    <section className={styles.root} aria-labelledby={titleId} data-submission-receipt>
      <div role="status" aria-atomic="true">
        <div className={mergeClasses(styles.hero, neutral && styles.neutralHero)}>
          <span className={mergeClasses(styles.icon, neutral && styles.neutralIcon)} aria-hidden="true">{props.icon || <CheckmarkCircle24Filled />}</span>
          <span className={styles.eyebrow}>{props.eyebrow}</span>
          <h3 id={titleId} className={styles.title}>{props.title}</h3>
          <p className={styles.description}>{props.description}</p>
        </div>
        <div className={styles.body}>
          {props.children}
          <dl className={styles.details}>{props.details.map((detail) => (
            <div key={detail.label} className={styles.detail}><dt className={styles.label}>{detail.label}</dt><dd className={styles.value}>{detail.value}</dd></div>
          ))}</dl>
          <p className={styles.note}>{props.note}</p>
        </div>
      </div>
      <div className={styles.actions}>{props.actions}</div>
    </section>
  );
}
