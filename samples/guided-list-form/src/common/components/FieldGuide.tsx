import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import type { IFieldGuide } from '../logic/fieldGuide';
import { GUIDE_EASING, GUIDE_MS } from '../logic/motion';
import { useWizardStyles } from './styles';

function BookIcon(): React.ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.2 4.2c2.1-1.1 4.2-1.1 6.3 0v9.2c-2.1-1-4.2-1-6.3 0V4.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 4.2c2.1-1.1 4.2-1.1 6.3 0v9.2c-2.1-1-4.2-1-6.3 0V4.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function guideMotionStyle(visible: boolean, motionOn: boolean): React.CSSProperties {
  if (!motionOn) {
    return { opacity: 1, transform: 'none', transition: 'none' };
  }
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0px)' : 'translateX(16px)',
    transition: `transform ${GUIDE_MS}ms ${GUIDE_EASING}, opacity ${GUIDE_MS}ms ${GUIDE_EASING}`
  };
}

export function exampleLine(example: string | undefined): string {
  if (!example) {
    return '';
  }
  const body = example.replace(/^example:\s*/i, '');
  return body ? `Example: ${body}` : '';
}

export interface IFieldGuideCardProps {
  guide: IFieldGuide;
  stacked: boolean;
  motionOn: boolean;
  visible: boolean;
  /** Compact "What goes here" chip that expands the hint inline. Used when the guide stacks under the field. */
  collapsible?: boolean;
  /** When collapsible, start expanded (page layout). Copilot inline starts collapsed. */
  defaultOpen?: boolean;
  id?: string;
}

export function FieldGuideCard(props: IFieldGuideCardProps): React.ReactElement {
  const styles = useWizardStyles();
  const example = exampleLine(props.guide.example);
  const [open, setOpen] = React.useState(!!props.defaultOpen);
  const bodyId = props.id ? `${props.id}-body` : undefined;

  if (!props.collapsible) {
    return (
      <aside
        id={props.id}
        className={mergeClasses(styles.guide, props.stacked && styles.guideStack)}
        style={guideMotionStyle(props.visible, props.motionOn)}
        aria-label="Field guide"
        data-testid="wiz-guide"
      >
        <h3 className={styles.guideTitle}>
          <BookIcon />
          What goes here
        </h3>
        {props.guide.hint ? <p className={styles.guideHint}>{props.guide.hint}</p> : null}
        {example ? <p className={styles.guideExample}>{example}</p> : null}
      </aside>
    );
  }

  return (
    <div id={props.id} className={styles.guideChip} data-testid="wiz-guide">
      <button
        type="button"
        className={styles.guideToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        data-testid="wiz-guide-toggle"
        onClick={() => setOpen((value) => !value)}
      >
        <BookIcon />
        What goes here
      </button>
      <div
        id={bodyId}
        className={mergeClasses(styles.guideBody, open && styles.guideBodyOpen)}
        style={props.motionOn ? undefined : { transition: 'none' }}
        aria-hidden={!open}
        data-testid="wiz-guide-body"
      >
        <div className={styles.guideBodyInner}>
          <div className={styles.guidePanel}>
            {props.guide.hint ? <p className={styles.guideHint}>{props.guide.hint}</p> : null}
            {example ? <p className={styles.guideExample}>{example}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
