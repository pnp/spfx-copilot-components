import * as React from 'react';
import { Button, Spinner, ProgressBar, mergeClasses } from '@fluentui/react-components';
import { useContentLensStyles } from './ContentLens.styles';

export interface IStateViewProps {
  /** The page or site the state belongs to; absent when the card has lost its request. */
  title?: string;
  meta?: string;
  headingRef?: React.RefObject<HTMLHeadingElement>;
  sentence: string;
  /** A busy state has a spinner and a regular-weight sentence; a warning is amber. */
  tone?: 'busy' | 'warning' | 'plain';
  hint?: string;
  progress?: { value: number; max: number; label: string };
  /** The single way forward: a primary button, or a secondary one for Cancel and Stop. */
  action?: { label: string; onClick(): void; disabled?: boolean; kind?: 'primary' | 'secondary' };
  /** A code for support: logged to the console and set as the section's tooltip, not part of the visible text. */
  code?: string;
}

/** One sentence first, one way forward. Used for loading, Copilot working, checked out, throttled and other states. */
export function StateView({
  title, meta, headingRef, sentence, tone = 'plain', hint, progress, action, code
}: IStateViewProps): React.ReactElement {
  const styles = useContentLensStyles();
  React.useEffect(() => {
    if (code) console.warn('Content Lens:', code);
  }, [code]);
  const warning = tone === 'warning';
  return <section className={styles.stack} data-testid="state" title={code}>
    {title && <div className={styles.tight}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.pageTitle}>{title}</h1>
      {meta && <p className={styles.meta}>{meta}</p>}
    </div>}
    <div className={styles.tight} style={{ gap: '8px' }}>
      {tone === 'busy'
        ? <div className={styles.busyRow} role="status">
          <Spinner size="small" />
          <p className={styles.busySentence}>{sentence}</p>
        </div>
        : <p className={mergeClasses(styles.stateSentence, warning && styles.warnSentence)} role={warning ? 'alert' : undefined}>
          {sentence}
        </p>}
      {progress && <div className={styles.tight} data-testid="review-progress">
        <p className={styles.sub} role="status">{progress.label}</p>
        <ProgressBar value={progress.value} max={progress.max} aria-label={progress.label} />
      </div>}
      {hint && <p className={styles.sub}>{hint}</p>}
    </div>
    {action && (action.kind === 'secondary'
      ? <div className={styles.actions}>
        <Button className={styles.secondary} appearance="secondary" disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </Button>
      </div>
      : <div>
        <Button className={styles.primary} appearance="primary" disabled={action.disabled} onClick={action.onClick}>
          {action.label}
        </Button>
      </div>)}
  </section>;
}
