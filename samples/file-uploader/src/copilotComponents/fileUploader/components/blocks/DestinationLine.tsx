import * as React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import type { IDestination } from '../../logic/destination';
import { formatDestination, formatDestinationShort } from '../../logic/destination';
import { useSharedStyles } from './useSharedStyles';

export interface IDestinationLineProps {
  /** The resolved destination, or undefined until kind + department are both known. */
  destination: IDestination | undefined;
  /**
   * `short` → "Destination: Finance › Invoices › Programs" for a footer note;
   * `full` → the whole "Records / … / 2026" path, monospaced.
   */
  variant?: 'short' | 'full';
  /** Appended after a `full` path, e.g. the file name (review, receipt). */
  fileName?: string;
  /** Trailing clause on a `short` line, e.g. "3 of 4 ready". */
  note?: string;
  /** Shown on a `short` line before the destination can be resolved. */
  pendingLabel?: string;
  className?: string;
}

/**
 * The "where this file will be saved" line. Mechanic only — it formats an
 * `IDestination` (path segments) and never decides what the destination is;
 * that is `resolveDestination` in `logic/`. Used by the inline draft footer,
 * the inline review summary and the full-screen workspace footer.
 */
export const DestinationLine: React.FC<IDestinationLineProps> = props => {
  const s = useSharedStyles();
  const variant: 'short' | 'full' = props.variant || 'short';

  let text: string;
  if (!props.destination) {
    text = variant === 'short' ? props.pendingLabel || 'Destination set once kind and department are known' : '';
  } else if (variant === 'short') {
    text = 'Destination: ' + formatDestinationShort(props.destination) + (props.note ? ' · ' + props.note : '');
  } else {
    text = formatDestination(props.destination) + (props.fileName ? ' / ' + props.fileName : '');
  }

  return (
    <span
      className={mergeClasses(variant === 'full' ? s.path : undefined, props.className)}
      data-destination={props.destination ? 'resolved' : 'pending'}
    >
      {text}
    </span>
  );
};
