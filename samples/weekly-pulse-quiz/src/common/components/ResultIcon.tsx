import * as React from 'react';
import type { AnswerOutcome } from '../logic/feedback';

/** Check mark (correct / poll) drawn on in ~300 ms, or a calm X that fades in. Decorative only. */
export function ResultIcon(props: { outcome: AnswerOutcome }): React.ReactElement {
  if (props.outcome === 'incorrect') {
    return (
      <svg className="wpq__icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false" data-icon="x">
        <circle cx="16" cy="16" r="15" fill="none" stroke="#242424" strokeWidth="2" />
        <path className="wpq__x" d="M11 11 L21 21 M21 11 L11 21" fill="none" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="wpq__icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false" data-icon="check">
      <circle cx="16" cy="16" r="16" style={{ fill: 'var(--wpq-selected-border)' }} />
      <path className="wpq__check" d="M9 16.5 L14 21.5 L23 11.5" fill="none" stroke="#FFFFFF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
