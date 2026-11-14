import * as React from 'react';

import { Text } from '@fluentui/react-text';
import { makeStyles } from '@griffel/react';
import { tokens } from '@fluentui/react-theme';
import { Dismiss20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    width: '408px',
    minWidth: '408px',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow28,
    animationName: {
      from: { transform: 'translateX(24px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 }
    },
    animationDuration: tokens.durationGentle,
    animationTimingFunction: tokens.curveDecelerateMid,
    '@media (max-width: 860px)': {
      position: 'fixed',
      top: '58px',
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 20,
      width: '100%',
      minWidth: 0,
      minHeight: 0
    },
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '1ms'
    }
  },
  accent: {
    height: '5px',
    flexShrink: 0,
    backgroundImage: `linear-gradient(90deg, ${tokens.colorBrandBackground}, ${tokens.colorPaletteBlueBackground2}, ${tokens.colorPaletteBerryBackground3})`
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 18px 13px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  icon: {
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground}, ${tokens.colorPaletteBerryBackground3})`,
    borderRadius: tokens.borderRadiusMedium
  },
  title: { minWidth: 0, flexGrow: 1, fontWeight: tokens.fontWeightSemibold },
  close: {
    width: '34px',
    height: '34px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    padding: 0,
    color: tokens.colorNeutralForeground2,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
    ':focus-visible': {
      outlineColor: tokens.colorStrokeFocus2,
      outlineStyle: 'solid',
      outlineWidth: '2px'
    }
  },
  body: {
    minHeight: 0,
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px 18px'
  },
  footnote: {
    padding: '10px 18px',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  }
});

export interface IRightPanelProps {
  children?: React.ReactNode;
  title: string;
  icon: React.ReactElement;
  footnote?: string;
  isModal?: boolean;
  onDismiss: () => void;
}

const RightPanel: React.FunctionComponent<IRightPanelProps> = (props) => {
  const styles = useStyles();
  const panelRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <aside
      ref={panelRef}
      className={styles.root}
      role={props.isModal ? 'dialog' : 'complementary'}
      aria-modal={props.isModal ? true : undefined}
      aria-label={props.title}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          props.onDismiss();
          return;
        }
        if (props.isModal && event.key === 'Tab') {
          const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ) || []);
          if (focusable.length === 0) {
            event.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <div className={styles.accent} />
      <div className={styles.header}>
        <span className={styles.icon} aria-hidden="true">{props.icon}</span>
        <Text size={500} className={styles.title}>{props.title}</Text>
        <button type="button" className={styles.close} aria-label={`Close ${props.title}`} onClick={props.onDismiss}>
          <Dismiss20Regular />
        </button>
      </div>
      <div className={styles.body}>{props.children}</div>
      {props.footnote && <Text size={200} className={styles.footnote}>{props.footnote}</Text>}
    </aside>
  );
};

export default RightPanel;