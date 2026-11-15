import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

/**
 * Calm cards: plain text with weight and size, thin dividers, and colour only for links, warnings (amber)
 * and the demo label (purple). Only buttons and links look interactive.
 */
export const useContentLensStyles = makeStyles({
  canvas: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'var(--cl-canvas)',
    color: tokens.colorNeutralForeground1,
    overflowWrap: 'anywhere',
    containerType: 'inline-size',
    WebkitFontSmoothing: 'antialiased'
  },
  shell: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '18px 22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
    '@container (min-width: 520px)': { padding: '20px 24px 26px' }
  },
  shellFull: { padding: '22px 28px 28px', '@container (min-width: 520px)': { padding: '22px 28px 28px' } },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minHeight: '28px' },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground2
  },
  demoLabel: { color: 'var(--cl-demo-fg)', fontWeight: 500 },
  iconButton: { minWidth: '28px', width: '28px', height: '28px', padding: 0, color: tokens.colorNeutralForeground2 },
  stack: { display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 },
  tight: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  row: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minWidth: 0 },
  between: { justifyContent: 'space-between' },
  // Type scale
  startTitle: { margin: 0, fontSize: '22px', lineHeight: '28px', fontWeight: 500 },
  // The heading takes focus after an action, for screen readers; it is not interactive, so it shows no focus ring.
  pageTitle: { margin: 0, fontSize: '20px', lineHeight: '26px', fontWeight: 500, ':focus': { outline: 'none' } },
  pageTitleFull: { fontSize: '24px', lineHeight: '32px' },
  sub: { margin: 0, fontSize: '14px', lineHeight: '20px', color: tokens.colorNeutralForeground2 },
  meta: { margin: 0, fontSize: '12px', lineHeight: '16px', color: tokens.colorNeutralForeground2 },
  body: { margin: 0, fontSize: '14px', lineHeight: '20px' },
  label: { margin: 0, fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
  stateSentence: { margin: 0, fontSize: '19px', lineHeight: '28px', fontWeight: 500 },
  busySentence: { margin: 0, fontSize: '19px', lineHeight: '28px', fontWeight: 400 },
  warnSentence: { color: 'var(--cl-warn-fg)' },
  warning: { margin: 0, fontSize: '13px', lineHeight: '18px', color: 'var(--cl-warn-fg)' },
  verdict: { margin: 0, fontSize: '18px', lineHeight: '26px', '& strong': { fontWeight: 500 } },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  },
  smallLink: { fontSize: '13px', lineHeight: '18px' },
  // Actions are buttons: one primary per view, the others outlined. A link is only for a URL, and looks like one.
  actions: { display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' },
  secondary: { minHeight: '32px', padding: '5px 14px', whiteSpace: 'normal' },
  small: { minHeight: '28px', padding: '3px 10px', fontSize: '13px', lineHeight: '18px', whiteSpace: 'normal' },
  inlineLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '12px',
    lineHeight: '16px',
    verticalAlign: 'bottom'
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid ' + tokens.colorNeutralStroke2
  },
  // Start
  tabs: {
    borderBottom: '1px solid ' + tokens.colorNeutralStroke2,
    minWidth: 0,
    '& button': { padding: '6px 8px 10px', fontSize: '14px', lineHeight: '20px' }
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  fold: {
    '& > summary': {
      listStyle: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 0',
      minWidth: 0
    },
    '& > summary::-webkit-details-marker': { display: 'none' },
    '& > :not(summary)': { marginTop: '8px' }
  },
  fieldHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '2px 12px'
  },
  primaryRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' },
  primary: { minHeight: '32px', padding: '5px 18px', fontWeight: 500, whiteSpace: 'normal' },
  // Busy
  busyRow: { display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 },
  notePassage: { margin: 0, fontSize: '15px', lineHeight: '24px', whiteSpace: 'pre-wrap' },
  mark: {
    backgroundColor: tokens.colorBrandBackground2,
    color: 'inherit',
    padding: '0 2px',
    borderRadius: '2px',
    boxDecorationBreak: 'clone',
    WebkitBoxDecorationBreak: 'clone',
    '@media (forced-colors: active)': { backgroundColor: 'transparent', borderBottom: '2px solid Mark', forcedColorAdjust: 'auto' }
  },
  uncertain: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationThickness: '1px',
    textUnderlineOffset: '3px'
  },
  noteLine: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground2,
    '& strong': { fontWeight: 500, color: tokens.colorNeutralForeground1 }
  },
  noteLineSmall: {
    margin: 0,
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground2,
    '& strong': { fontWeight: 500, color: tokens.colorNeutralForeground1 }
  },
  // Page face
  map: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' },
  mapRow: { display: 'flex', gap: '6px', minWidth: 0 },
  mapRowStacked: { flexDirection: 'column' },
  mapColumnCell: { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  mapVertical: { margin: '4px 0 0', fontSize: '12px', lineHeight: '16px', color: tokens.colorNeutralForeground3 },
  block: {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    minHeight: '64px',
    padding: '8px 10px',
    borderRadius: '3px',
    border: '1px solid ' + tokens.colorNeutralStroke1,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground1,
    textAlign: 'left',
    font: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '6px'
  },
  blockFull: { minHeight: '76px' },
  blockChoice: {
    cursor: 'pointer',
    ':hover': { ...shorthands.borderColor(tokens.colorNeutralForeground1) },
    ':focus-visible': { outline: '2px solid ' + tokens.colorStrokeFocus2, outlineOffset: '2px' }
  },
  blockNotes: { backgroundColor: tokens.colorBrandBackground2 },
  blockSelected: {
    ...shorthands.borderColor(tokens.colorNeutralForeground1),
    boxShadow: 'inset 0 0 0 1px ' + tokens.colorNeutralForeground1
  },
  blockWebPart: {
    backgroundColor: 'var(--cl-wp)',
    ...shorthands.borderStyle('dashed'),
    color: tokens.colorNeutralForeground2
  },
  blockLabel: { fontSize: '13px', lineHeight: '18px', fontWeight: 500 },
  blockLabelWebPart: { fontWeight: 400 },
  blockFoot: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '8px',
    fontSize: '13px',
    lineHeight: '18px'
  },
  blockNumbers: { marginLeft: 'auto', fontWeight: 500 },
  blockWarn: { fontSize: '12px', lineHeight: '16px', color: 'var(--cl-warn-fg)' },
  caption: { margin: 0, fontSize: '12px', lineHeight: '16px', color: tokens.colorNeutralForeground2 },
  notesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingTop: '18px',
    borderTop: '1px solid ' + tokens.colorNeutralStroke2
  },
  // Checks without AI: one row per check, its result and what it covers, between thin dividers.
  checks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid ' + tokens.colorNeutralStroke2
  },
  checkList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' },
  checkRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 0',
    ':not(:first-child)': { borderTop: '1px solid ' + tokens.colorNeutralStroke2 },
    '& strong': { fontWeight: 500 }
  },
  groupLine: { display: 'grid', gridTemplateColumns: '16px minmax(0, 1fr)', columnGap: '8px', alignItems: 'start' },
  indented: { marginLeft: '24px' },
  ruleLines: { listStyle: 'none', margin: '4px 0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  checkLine: {
    display: 'grid',
    gridTemplateColumns: '16px minmax(0, 1fr)',
    columnGap: '8px',
    alignItems: 'start',
    fontSize: '13px',
    lineHeight: '18px',
    color: tokens.colorNeutralForeground2
  },
  checkIcon: { marginTop: '1px', color: tokens.colorNeutralForeground3 },
  checkIconNotes: { color: tokens.colorNeutralForeground1 },
  checkCount: { fontWeight: 500, color: tokens.colorNeutralForeground1 },
  // The checks to run: a checkbox and its ⓘ per row, two columns where the card has room.
  checksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
    columnGap: '16px',
    margin: '0 0 2px'
  },
  toggleRow: { display: 'flex', alignItems: 'center', minWidth: 0 },
  notesGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ':not(:first-child)': { paddingTop: '16px', borderTop: '1px solid ' + tokens.colorNeutralStroke2 }
  },
  groupHeading: { margin: 0, fontSize: '14px', lineHeight: '20px', fontWeight: 500 },
  groupHeadingMuted: { color: tokens.colorNeutralForeground2 },
  noteList: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
  noteItem: {
    display: 'grid',
    gridTemplateColumns: '20px minmax(0, 1fr)',
    columnGap: '12px',
    rowGap: '4px',
    alignItems: 'start'
  },
  noteNumber: { fontSize: '13px', lineHeight: '24px', fontWeight: 500 },
  noteBody: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  // Comments result
  context: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '12px',
    lineHeight: '18px',
    paddingLeft: '12px',
    borderLeft: '2px solid ' + tokens.colorNeutralStroke2
  },
  contextText: { margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '18px' },
  footnote: { margin: 0, fontSize: '12px', lineHeight: '16px', color: tokens.colorNeutralForeground2 },
  details: {
    fontSize: '13px',
    lineHeight: '18px',
    color: tokens.colorNeutralForeground2,
    '& summary': { cursor: 'pointer', color: tokens.colorBrandForegroundLink, padding: '2px 0' }
  }
});
