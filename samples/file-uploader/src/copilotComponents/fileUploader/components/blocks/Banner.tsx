import * as React from 'react';
import { makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import { useMotionStyles, useReducedMotion } from './motion';

export type BannerTone = 'success' | 'warning' | 'error';

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('10px'),
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('4px'),
    marginBottom: '12px',
    fontSize: tokens.fontSizeBase300
  },
  success: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1
  },
  warning: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
    color: tokens.colorPaletteYellowForeground1
  },
  error: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1
  },
  dot: {
    width: '8px',
    height: '8px',
    flexShrink: 0,
    marginTop: '5px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: 'currentColor'
  },
  title: { fontWeight: tokens.fontWeightSemibold },
  detail: { fontWeight: tokens.fontWeightRegular }
});

export interface IBannerProps {
  tone: BannerTone;
  title: string;
  detail?: string;
}

/**
 * Status banner. The tone is carried by an icon-shaped dot AND the words, so
 * colour is never the only signal (AGENTS.md §4 Accessibility).
 */
export const Banner: React.FC<IBannerProps> = props => {
  const styles = useStyles();
  const motion = useMotionStyles();
  const reducedMotion: boolean = useReducedMotion();
  const toneClass: string =
    props.tone === 'success' ? styles.success : props.tone === 'warning' ? styles.warning : styles.error;
  return (
    <div
      className={mergeClasses(styles.banner, toneClass, !reducedMotion && motion.bannerEnter)}
      data-banner={props.tone}
      role={props.tone === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.dot} aria-hidden="true" />
      <div>
        <span className={styles.title}>{props.title}</span>
        {props.detail ? <span className={styles.detail}> {props.detail}</span> : undefined}
      </div>
    </div>
  );
};
