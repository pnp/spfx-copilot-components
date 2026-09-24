import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  note: {
    ...shorthands.padding('8px', '16px', '0', '16px'),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200
  }
});

/**
 * One line of metadata text, shown whenever the store is the mock (todo.md
 * Phase 8.1, with Decision 11). The designs do not draw it; it exists because
 * mock receipts look real, so a demo running in a real tenant must never be
 * mistaken for real filing (R25, R26). Text, not a banner — it is context, not
 * an alert, and it never changes.
 */
export const SampleDataNote: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.note} data-sample="true" role="note">
      Sample data — nothing is stored
    </div>
  );
};
