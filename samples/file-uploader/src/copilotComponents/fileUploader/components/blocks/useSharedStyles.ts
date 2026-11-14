import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

/**
 * Shared mechanics only — headers, banners, rows, field shells. No domain
 * meaning lives here (AGENTS.md §4 Theming, R27: no `background` shorthand,
 * no static inline styles, no nested cards).
 */
export const useSharedStyles = makeStyles({
  root: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
    ...shorthands.padding('14px', '16px', '10px', '16px')
  },
  title: {
    fontSize: '20px',
    lineHeight: '24px',
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.margin(0)
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    marginTop: '2px'
  },
  body: {
    ...shorthands.padding('4px', '16px', '16px', '16px')
  },
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    ...shorthands.margin('12px', 0)
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginTop: '12px'
  },
  actionsNote: {
    marginRight: 'auto',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200
  },
  // Inline / narrow action buttons: 36px, per the mock and AGENTS.md §4
  // (full-screen buttons use FileUploaderFullscreen's own 38px `fsButton`).
  actionButton: { minHeight: '36px' },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('0', '16px')
  },
  tabular: {
    fontVariantNumeric: 'tabular-nums'
  },
  path: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    overflowWrap: 'anywhere'
  },
  link: {
    color: tokens.colorBrandForegroundLink,
    fontWeight: tokens.fontWeightSemibold
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    ...shorthands.overflow('hidden'),
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap'
  }
});

/** Narrow layout kicks in below the standard width (AGENTS.md §4 Layout). */
export const NARROW_MAX_WIDTH: number = 480;

export function isNarrow(width: number | undefined): boolean {
  return typeof width === 'number' && width <= NARROW_MAX_WIDTH;
}
