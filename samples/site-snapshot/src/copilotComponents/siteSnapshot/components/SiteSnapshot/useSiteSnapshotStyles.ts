import { makeStyles, tokens } from '@fluentui/react-components';

// makeStyles is Fluent v9's class-based styling (Griffel). It generates real
// CSS classes, so this is the v9 equivalent of an SCSS module.
export const useSiteSnapshotStyles = makeStyles({
  inlineRoot: {
    padding: tokens.spacingHorizontalM,
    maxWidth: '400px'
  },
  fullRoot: {
    padding: tokens.spacingHorizontalL,
    minHeight: '100%'
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL
  }
});
