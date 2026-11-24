import { makeStyles, shorthands, tokens, type GriffelStyle } from '@fluentui/react-components';
import { ENTER_EASING, GUIDE_EASING, GUIDE_MS, OPTION_STAGGER_MS, PROGRESS_MS } from '../logic/motion';
import { PALETTE } from '../logic/surface';
import { BODY_FONT_SIZE, BODY_LINE_HEIGHT, CARD_FONT_FAMILY } from '../logic/typeface';

/**
 * v1.2 look: a full-bleed diagonal gradient panel (forest-to-teal palette by default, set inline from surface.ts),
 * a centred ~500 px column, cream/white text, coral accent details and cream pill buttons.
 * Fluent tokens inside the panel come from onGradientTheme().
 */
const RING = 'var(--wiz-focus-ring, #ffffff)';
const HIGHLIGHT = 'var(--wiz-highlight, #f2643d)';
const fadeIn = { from: { opacity: 0 }, to: { opacity: 1 } };
const riseIn = { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0px)' } };
const noMotion: GriffelStyle = { '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0.01ms', animationName: 'none', transform: 'none' } };
const focusRing: GriffelStyle = {
  ':focus-visible': {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: RING,
    outlineOffset: '3px',
    boxShadow: '0 0 0 6px var(--wiz-focus-glow, rgba(242, 100, 61, 0.45))'
  }
};

export const useWizardStyles = makeStyles({
  root: {
    position: 'relative',
    boxSizing: 'border-box',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'hidden',
    fontFamily: tokens.fontFamilyBase,
    color: PALETTE.body,
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('28px', '32px', '24px')
  },
  page: {
    minHeight: '540px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 18px 40px rgba(16, 40, 36, 0.28)'
  },
  pageDark: {
    boxShadow: 'none',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.12)')
  },
  pageNarrow: {
    minHeight: '480px',
    ...shorthands.padding('24px', '18px', '20px')
  },
  compact: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    height: '100%',
    minHeight: '0px',
    overflowX: 'hidden',
    overflowY: 'hidden',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('20px', '16px', '14px')
  },
  pageHeight480: { minHeight: '480px' },
  pageHeight600: { minHeight: '600px' },
  pageHeight800: { minHeight: '800px' },
  column: {
    width: '100%',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '0px'
  },
  columnCompact: {
    minHeight: '0px',
    height: '100%',
    flexGrow: 1,
    overflowX: 'hidden',
    overflowY: 'hidden'
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  progressFill: {
    height: '100%',
    backgroundColor: HIGHLIGHT,
    ...shorthands.borderRadius('0', '4px', '4px', '0'),
    transitionProperty: 'width',
    transitionDuration: `${PROGRESS_MS}ms`,
    transitionTimingFunction: ENTER_EASING,
    ...noMotion
  },
  progressStill: {
    transitionDuration: '0.01ms'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    minHeight: '28px',
    marginBottom: '8px'
  },
  formTitle: {
    flexGrow: 1,
    minWidth: 0,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.02em',
    color: PALETTE.body,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  progressText: {
    fontSize: tokens.fontSizeBase200,
    color: PALETTE.helper,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums'
  },
  stage: {
    position: 'relative',
    flexGrow: 1,
    minHeight: '380px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...shorthands.padding('8px', '0px')
  },
  stageNarrow: {
    minHeight: '340px'
  },
  stageCompact: {
    minHeight: '0px',
    height: 'auto',
    flexGrow: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    ...shorthands.padding('6px', '6px', '10px')
  },
  stageInner: {
    width: '100%',
    minHeight: '0px'
  },
  stageInnerCompact: {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  screenFill: {
    flexGrow: 1,
    minHeight: '0px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '12px'
  },
  stepMain: {
    flexGrow: 1,
    minHeight: '0px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px'
  },
  screen: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
    willChange: 'transform, opacity'
  },
  /** Children fade in one after another (motion on only). */
  stagger: {
    '& > *': {
      animationName: fadeIn,
      animationDuration: '360ms',
      animationTimingFunction: ENTER_EASING,
      animationFillMode: 'backwards'
    },
    '& > *:nth-child(2)': { animationDelay: '40ms' },
    '& > *:nth-child(3)': { animationDelay: '80ms' },
    '& > *:nth-child(4)': { animationDelay: '120ms' },
    '& > *:nth-child(5)': { animationDelay: '160ms' },
    '& > *:nth-child(n+6)': { animationDelay: '200ms' },
    '@media (prefers-reduced-motion: reduce)': { '& > *': { animationName: 'none' } }
  },
  questionNumber: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.02em',
    color: PALETTE.helper
  },
  question: {
    display: 'block',
    fontSize: '30px',
    lineHeight: '38px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.heading,
    ...shorthands.margin(0)
  },
  questionCompact: {
    fontSize: '21px',
    lineHeight: '28px'
  },
  requiredMark: {
    color: PALETTE.helper,
    marginLeft: '6px',
    fontWeight: tokens.fontWeightRegular
  },
  description: {
    fontSize: '18px',
    lineHeight: '26px',
    color: PALETTE.helper,
    opacity: 0.92,
    ...shorthands.margin(0)
  },
  descriptionCompact: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300
  },
  prefilled: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '6px',
    alignSelf: 'flex-start',
    fontSize: tokens.fontSizeBase200,
    color: PALETTE.body,
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('999px')
  },
  /** Transparent field with only a bottom underline; thickens and lights up on focus. */
  field: {
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: tokens.fontFamilyBase,
    fontSize: '24px',
    lineHeight: '34px',
    color: PALETTE.heading,
    backgroundColor: 'transparent',
    colorScheme: 'dark',
    ...shorthands.border('0'),
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(247,245,241,0.55)',
    ...shorthands.borderRadius('0'),
    ...shorthands.padding('6px', '2px', '8px'),
    outlineStyle: 'none',
    caretColor: PALETTE.coral,
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: '180ms',
    '::placeholder': { color: 'rgba(221,241,236,0.62)', opacity: 1 },
    ':hover': { borderBottomColor: 'rgba(247,245,241,0.8)' },
    ':focus': {
      borderBottomColor: RING,
      boxShadow: `0 2px 0 0 ${RING}`,
      backgroundColor: 'rgba(255,255,255,0.05)'
    },
    '::-webkit-calendar-picker-indicator': { cursor: 'pointer', opacity: 0.9 },
    ...noMotion
  },
  fieldCompact: {
    fontSize: '18px',
    lineHeight: '26px'
  },
  fieldInvalid: {
    borderBottomColor: '#ffb3a1'
  },
  numberRow: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: '10px',
    width: '100%'
  },
  currencySymbol: {
    flexShrink: 0,
    fontFamily: tokens.fontFamilyBase,
    fontSize: '24px',
    lineHeight: '34px',
    color: PALETTE.heading
  },
  currencySymbolCompact: {
    fontSize: '18px',
    lineHeight: '26px'
  },
  hyperlinkFields: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px',
    width: '100%'
  },
  subLabel: {
    display: 'block',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    color: PALETTE.body,
    marginBottom: '4px'
  },
  textarea: {
    resize: 'vertical',
    minHeight: '96px',
    fontSize: '20px',
    lineHeight: '30px'
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '10px',
    maxWidth: '440px'
  },
  choice: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: '18px',
    lineHeight: '24px',
    color: PALETTE.body,
    backgroundColor: 'rgba(255,255,255,0.10)',
    ...shorthands.padding('10px', '14px'),
    ...shorthands.border('1px', 'solid', 'rgba(247,245,241,0.5)'),
    ...shorthands.borderRadius('8px'),
    transitionProperty: 'background-color, border-color, color, transform, box-shadow',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease-out',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.18)',
      ...shorthands.borderColor('rgba(247,245,241,0.85)')
    },
    ...focusRing,
    ...noMotion
  },
  choiceCompact: {
    fontSize: tokens.fontSizeBase400,
    ...shorthands.padding('8px', '12px')
  },
  /** Motion on: lift on hover, press-in, and a staggered fade-in on mount. */
  choiceMotion: {
    animationName: riseIn,
    animationDuration: '340ms',
    animationTimingFunction: ENTER_EASING,
    animationFillMode: 'backwards',
    ':hover': { transform: 'translateY(-1px)' },
    ':active': { transform: 'scale(0.985)' },
    ...noMotion
  },
  choiceSelected: {
    color: PALETTE.pillText,
    backgroundColor: PALETTE.pill,
    ...shorthands.borderColor(PALETTE.pill),
    boxShadow: `inset 4px 0 0 0 ${PALETTE.coral}`,
    ':hover': {
      backgroundColor: '#ffffff',
      ...shorthands.borderColor('#ffffff'),
      boxShadow: `inset 4px 0 0 0 ${PALETTE.coralHover}`
    }
  },
  choiceKey: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '26px',
    height: '26px',
    boxSizing: 'border-box',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.body,
    backgroundColor: 'rgba(255,255,255,0.12)',
    ...shorthands.border('1px', 'solid', 'rgba(247,245,241,0.7)'),
    ...shorthands.borderRadius('6px'),
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '160ms'
  },
  /** Selected badge: coral ring with dark-green letter on cream (coral is never used for the letter itself). */
  choiceKeySelected: {
    color: PALETTE.pillText,
    backgroundColor: PALETTE.pill,
    ...shorthands.border('2px', 'solid', PALETTE.coral)
  },
  choiceLabel: {
    flexGrow: 1
  },
  choiceCheck: {
    color: PALETTE.coralHover
  },
  checkBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '20px',
    height: '20px',
    boxSizing: 'border-box',
    color: '#ffffff',
    backgroundColor: 'transparent',
    ...shorthands.border('1.5px', 'solid', 'rgba(247,245,241,0.8)'),
    ...shorthands.borderRadius('4px')
  },
  checkBoxChecked: {
    color: '#ffffff',
    backgroundColor: PALETTE.coralHover,
    ...shorthands.borderColor(PALETTE.coralHover)
  },
  dateTime: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '20px',
    rowGap: '12px'
  },
  dateTimePart: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '4px',
    flexGrow: 1,
    flexBasis: '180px',
    minWidth: '150px'
  },
  dateTimeZone: {
    flexBasis: '100%'
  },
  dateTimeLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.02em',
    color: PALETTE.helper
  },
  /** Light error chip: dark red on pale coral reads well on the gradient (about 6:1). */
  error: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: '6px',
    fontSize: tokens.fontSizeBase300,
    color: '#8a1f0c',
    backgroundColor: '#fde4dc',
    ...shorthands.padding('6px', '10px'),
    ...shorthands.borderRadius('6px')
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '16px',
    rowGap: '10px',
    marginTop: '8px'
  },
  actionsPinned: {
    flexShrink: 0,
    position: 'sticky',
    bottom: '0px',
    marginTop: '0px',
    paddingTop: '8px'
  },
  /** Cream pill (OK, Start, Submit) with dark-green text. */
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '8px',
    minHeight: '44px',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: '17px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.pillText,
    backgroundColor: PALETTE.pill,
    ...shorthands.border('0'),
    ...shorthands.borderRadius('999px'),
    ...shorthands.padding('10px', '22px'),
    boxShadow: '0 4px 14px rgba(8, 28, 24, 0.25)',
    transitionProperty: 'transform, box-shadow, background-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease-out',
    ':hover': { backgroundColor: '#ffffff', boxShadow: `0 6px 18px rgba(8, 28, 24, 0.32), inset 0 -2px 0 0 ${PALETTE.coral}` },
    ':active': { boxShadow: `0 2px 8px rgba(8, 28, 24, 0.3), inset 0 -2px 0 0 ${PALETTE.coralHover}` },
    ':disabled': {
      opacity: 0.55,
      cursor: 'not-allowed',
      boxShadow: 'none',
      pointerEvents: 'none'
    },
    ...focusRing,
    ...noMotion
  },
  pillMotion: {
    ':hover': { transform: 'translateY(-1px)' },
    ':active': { transform: 'scale(0.97)' },
    ...noMotion
  },
  pillCompact: {
    minHeight: '36px',
    fontSize: tokens.fontSizeBase300,
    ...shorthands.padding('7px', '16px')
  },
  pillBusy: {
    cursor: 'progress',
    opacity: 0.85
  },
  /** Underlined text link button (Back, Submit another). */
  textLink: {
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.body,
    backgroundColor: 'transparent',
    textDecorationLine: 'underline',
    textUnderlineOffset: '4px',
    textDecorationThickness: '1px',
    ...shorthands.border('0'),
    ...shorthands.padding('6px', '4px'),
    ...shorthands.borderRadius('4px'),
    ':hover': { color: '#ffffff', textDecorationThickness: '2px', textDecorationColor: PALETTE.coral },
    ...focusRing
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '4px',
    color: PALETTE.body,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    cursor: 'pointer',
    textDecorationLine: 'underline',
    textUnderlineOffset: '4px',
    ...shorthands.border('0'),
    ...shorthands.padding(0),
    ':hover': { color: '#ffffff', textDecorationColor: PALETTE.coral },
    ...focusRing
  },
  changeListBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginBottom: '4px'
  },
  changeList: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.body,
    backgroundColor: 'transparent',
    textDecorationLine: 'underline',
    textUnderlineOffset: '3px',
    ...shorthands.border('0'),
    ...shorthands.padding('2px', '0px'),
    ':hover': { color: '#ffffff', textDecorationColor: PALETTE.coral },
    ...focusRing
  },
  confirmMask: {
    position: 'absolute',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('20px'),
    backgroundColor: 'rgba(8, 28, 24, 0.55)'
  },
  confirmCard: {
    width: '100%',
    maxWidth: '340px',
    fontFamily: CARD_FONT_FAMILY,
    color: PALETTE.body,
    backgroundColor: 'rgba(16, 48, 44, 0.96)',
    boxShadow: '0 12px 32px rgba(8, 28, 24, 0.45)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.22)'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('20px', '20px', '16px')
  },
  confirmTitle: {
    fontFamily: CARD_FONT_FAMILY,
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.heading,
    ...shorthands.margin(0, 0, '8px')
  },
  confirmBody: {
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    color: PALETTE.helper,
    ...shorthands.margin(0, 0, '16px')
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    columnGap: '10px',
    flexWrap: 'wrap'
  },
  confirmGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.body,
    backgroundColor: 'transparent',
    ...shorthands.border('0'),
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('8px'),
    ':hover': { backgroundColor: 'rgba(255,255,255,0.10)' },
    ...focusRing
  },
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: PALETTE.helper
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: '4px',
    marginTop: '8px'
  },
  arrows: {
    display: 'inline-flex',
    columnGap: '2px',
    ...shorthands.borderRadius('8px'),
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  arrow: {
    color: PALETTE.body,
    ...shorthands.borderRadius('0')
  },
  introTitle: {
    // Programmatic focus target (tabIndex -1) for screen readers, not an interactive control: no focus ring.
    ':focus': { outlineStyle: 'none' },
    fontSize: '32px',
    lineHeight: '40px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.heading,
    ...shorthands.margin(0)
  },
  introHead: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('4px', '0px', '8px')
  },
  introMeta: {
    marginTop: '20px'
  },
  meta: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '6px',
    fontSize: tokens.fontSizeBase300,
    color: PALETTE.helper
  },
  review: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '14px'
  },
  reviewList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.margin(0),
    ...shorthands.padding(0)
  },
  reviewRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 2fr) 3fr auto',
    columnGap: '12px',
    alignItems: 'start',
    ...shorthands.padding('10px', '0px'),
    ...shorthands.borderBottom('1px', 'solid', 'rgba(247,245,241,0.22)')
  },
  reviewRowCompact: {
    gridTemplateColumns: '1fr auto',
    rowGap: '2px'
  },
  reviewQuestion: {
    fontSize: tokens.fontSizeBase300,
    color: PALETTE.helper,
    ...shorthands.margin(0)
  },
  reviewAnswer: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.heading,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    ...shorthands.margin(0)
  },
  reviewAnswerCompact: {
    gridColumnStart: 1,
    gridRowStart: 2
  },
  reviewEdit: {
    gridColumnStart: 'auto',
    color: PALETTE.body
  },
  reviewEditCompact: {
    gridColumnStart: 2,
    gridRowStart: 1,
    gridRowEnd: 3,
    color: PALETTE.body
  },
  notAnswered: {
    color: PALETTE.helper,
    fontWeight: tokens.fontWeightRegular,
    fontStyle: 'italic'
  },
  done: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: '14px'
  },
  doneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '72px',
    height: '72px',
    color: PALETTE.pillText,
    backgroundColor: PALETTE.pill,
    ...shorthands.border('3px', 'solid', HIGHLIGHT),
    ...shorthands.borderRadius('50%')
  },
  doneBadgeMotion: {
    animationName: { from: { opacity: 0, transform: 'scale(0.6)' }, to: { opacity: 1, transform: 'scale(1)' } },
    animationDuration: '420ms',
    animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    animationFillMode: 'backwards',
    ...noMotion
  },
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: '14px',
    ...shorthands.padding('16px', '0px')
  },
  centeredFill: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: '0px',
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'hidden',
    ...shorthands.padding('4px', '0px')
  },
  loadError: {
    width: '100%',
    maxWidth: '100%',
    whiteSpace: 'normal',
    overflow: 'visible',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word'
  },
  emptyIcon: {
    color: PALETTE.helper
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    ...shorthands.margin('-1px'),
    ...shorthands.padding(0),
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    ...shorthands.border(0)
  },
  notices: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '8px',
    marginBottom: '12px'
  },
  columnWide: {
    maxWidth: '1120px'
  },
  split: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: '28px',
    width: '100%'
  },
  questionCol: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px'
  },
  questionEm: {
    fontStyle: 'italic',
    fontWeight: tokens.fontWeightBold
  },
  greeting: {
    fontSize: '30px',
    lineHeight: '38px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.heading,
    marginTop: '0px',
    marginBottom: '10px'
  },
  guide: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: '280px',
    width: '280px',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(247, 245, 241, 0.92)',
    // backdrop-filter is a progressive enhancement; the cream fill already reads clearly.
    backdropFilter: 'blur(10px)',
    color: PALETTE.pillText,
    boxShadow: '0 10px 28px rgba(16, 40, 36, 0.22)',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('14px', '16px', '16px', '14px'),
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: PALETTE.coral
  },
  guideStack: {
    flexBasis: 'auto',
    width: '100%'
  },
  guideChip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    minWidth: 0
  },
  guideToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '8px',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase300,
    color: PALETTE.body,
    backgroundColor: 'transparent',
    ...shorthands.border('0'),
    ...shorthands.padding('4px', '2px'),
    ...shorthands.borderRadius('4px'),
    ':hover': { color: '#ffffff' },
    ...focusRing
  },
  guideBody: {
    display: 'grid',
    gridTemplateRows: '0fr',
    width: '100%',
    transitionProperty: 'grid-template-rows',
    transitionDuration: `${GUIDE_MS}ms`,
    transitionTimingFunction: GUIDE_EASING,
    ...noMotion
  },
  guideBodyOpen: {
    gridTemplateRows: '1fr'
  },
  guideBodyInner: {
    overflow: 'hidden',
    minHeight: '0px'
  },
  guidePanel: {
    backgroundColor: 'rgba(247, 245, 241, 0.92)',
    color: PALETTE.pillText,
    boxShadow: '0 8px 20px rgba(16, 40, 36, 0.18)',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('12px', '14px'),
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: PALETTE.coral,
    marginTop: '8px'
  },
  guideTitle: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.pillText,
    ...shorthands.margin(0, 0, '8px')
  },
  guideHint: {
    fontSize: '13px',
    lineHeight: '19px',
    color: PALETTE.pillText,
    opacity: 0.86,
    ...shorthands.margin(0, 0, '10px')
  },
  guideExample: {
    fontSize: '13px',
    lineHeight: '19px',
    fontStyle: 'italic',
    color: PALETTE.pillText,
    opacity: 0.78,
    ...shorthands.margin(0)
  },
  liveCheck: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
    marginTop: '2px',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: PALETTE.pill
  },
  liveDot: {
    width: '7px',
    height: '7px',
    flexShrink: 0,
    backgroundColor: PALETTE.coral,
    ...shorthands.borderRadius('50%')
  },
  reviewCards: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '10px',
    ...shorthands.margin(0),
    ...shorthands.padding(0)
  },
  reviewCard: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    columnGap: '12px',
    rowGap: '2px',
    backgroundColor: 'rgba(247, 245, 241, 0.14)',
    boxShadow: '0 4px 14px rgba(8, 28, 24, 0.12)',
    ...shorthands.padding('12px', '14px', '12px', '16px'),
    ...shorthands.border('1px', 'solid', 'rgba(247, 245, 241, 0.28)'),
    ...shorthands.borderRadius('10px')
  },
  reviewCardQ: {
    fontSize: '13px',
    lineHeight: '18px',
    color: PALETTE.helper,
    ...shorthands.margin(0)
  },
  reviewCardA: {
    gridColumnStart: 1,
    fontSize: '16px',
    lineHeight: '22px',
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.heading,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    ...shorthands.margin(0)
  },
  reviewLink: {
    color: PALETTE.heading,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
    textDecorationLine: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '2px',
    wordBreak: 'break-word',
    ...shorthands.border('0'),
    ...shorthands.padding(0),
    ':hover': { color: PALETTE.heading, textDecorationThickness: '2px' },
    ':focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: '#ffffff',
      outlineOffset: '3px'
    }
  },
  reviewCardEdit: {
    gridColumnStart: 2,
    gridRowStart: 1,
    gridRowEnd: 3,
    alignSelf: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '4px',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.body,
    backgroundColor: 'transparent',
    textDecorationLine: 'underline',
    textUnderlineOffset: '3px',
    ...shorthands.border('0'),
    ...shorthands.padding('6px', '4px'),
    ...shorthands.borderRadius('4px'),
    ':hover': { color: '#ffffff', textDecorationColor: PALETTE.coral },
    ...focusRing
  },
  doneSummary: {
    fontSize: '18px',
    lineHeight: '26px',
    color: PALETTE.helper,
    ...shorthands.margin(0)
  },
  doneBadgeWrap: {
    display: 'inline-flex',
    width: '72px',
    height: '72px'
  },
  doneBadgeSvg: {
    width: '72px',
    height: '72px',
    display: 'block'
  },
  checkDraw: {
    strokeDasharray: '60',
    strokeDashoffset: '60',
    animationName: { to: { strokeDashoffset: 0 } },
    animationDuration: '600ms',
    animationDelay: '180ms',
    animationTimingFunction: 'ease-out',
    animationFillMode: 'forwards',
    ...noMotion
  },
  checkStill: {
    strokeDasharray: '60',
    strokeDashoffset: '0'
  },
  resume: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: '14px'
  },
  resumePrompt: {
    fontSize: '18px',
    lineHeight: '26px',
    color: PALETTE.body,
    ...shorthands.margin(0)
  },
  yesNo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '10px'
  },
  yesNoButton: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '14px',
    minHeight: '64px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: '20px',
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.body,
    backgroundColor: 'rgba(255,255,255,0.10)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.22)'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('14px', '18px'),
    ...focusRing
  },
  yesNoButtonCompact: {
    minHeight: '52px',
    fontSize: '18px',
    ...shorthands.padding('10px', '14px')
  },
  pastWarn: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
    marginTop: '2px',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: '#F7D7A8'
  },
  scrollArea: {
    flexGrow: 1,
    minHeight: '0px',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto'
  },
  actionsFooter: {
    flexShrink: 0,
    position: 'sticky',
    bottom: '0px',
    paddingTop: '8px',
    marginTop: '4px'
  },
  picker: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '8px',
    width: '100%',
    minHeight: '0px',
    height: '100%',
    flexGrow: 1,
    textAlign: 'left',
    overflowX: 'hidden',
    overflowY: 'hidden',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT
  },
  pickerHeading: {
    fontFamily: CARD_FONT_FAMILY,
    fontSize: '24px',
    lineHeight: '30px',
    fontWeight: tokens.fontWeightBold,
    color: PALETTE.heading,
    ...shorthands.margin(0)
  },
  pickerIntro: {
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightRegular,
    color: PALETTE.helper,
    opacity: 0.92,
    ...shorthands.margin(0, 0, '4px')
  },
  pickerSections: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '16px'
  },
  pickerSection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '4px',
    minHeight: '0px'
  },
  pickerSearch: {
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightRegular,
    color: PALETTE.heading,
    backgroundColor: 'rgba(255,255,255,0.10)',
    colorScheme: 'dark',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.18)'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('8px', '12px'),
    outlineStyle: 'none',
    caretColor: PALETTE.coral,
    '::placeholder': { color: 'rgba(221,241,236,0.62)', opacity: 1 },
    ':hover': { backgroundColor: 'rgba(255,255,255,0.14)' },
    ':focus': {
      ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.65)'),
      boxShadow: '0 0 0 1px rgba(255,255,255,0.45)'
    },
    ...focusRing,
    ...noMotion
  },
  pickerList: {
    display: 'block',
    flexGrow: 1,
    minHeight: '0px',
    maxHeight: '160px',
    overflowY: 'scroll',
    ...shorthands.margin(0),
    ...shorthands.padding(0),
    listStyleType: 'none',
    '& > li': { marginBottom: '6px' },
    '& > li:last-child': { marginBottom: '0px' }
  },
  pickerItem: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '10px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightRegular,
    color: PALETTE.body,
    backgroundColor: 'rgba(255,255,255,0.10)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.18)'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('8px', '12px'),
    ...focusRing
  },
  pickerItemBody: {
    display: 'block',
    flexGrow: 1,
    minWidth: '0px',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT
  },
  pickerCheck: {
    flexShrink: 0,
    color: PALETTE.heading,
    fontSize: '16px'
  },
  pickerItemOn: {
    fontWeight: tokens.fontWeightSemibold,
    boxShadow: `inset 4px 0 0 0 ${PALETTE.coral}, 0 0 0 1px rgba(255,255,255,0.55)`,
    backgroundColor: 'rgba(255,255,255,0.32)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.65)')
  },
  pickerMeta: {
    display: 'block',
    marginTop: '2px',
    fontSize: tokens.fontSizeBase200,
    color: PALETTE.helper,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  pickerLabel: {
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.helper,
    opacity: 0.88,
    ...shorthands.margin(0)
  },
  selectWrap: {
    position: 'relative',
    width: '100%'
  },
  selectTrigger: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: CARD_FONT_FAMILY,
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: tokens.fontWeightRegular,
    color: PALETTE.heading,
    backgroundColor: 'rgba(255,255,255,0.10)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.28)'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('8px', '10px'),
    ...focusRing
  },
  selectTriggerOpen: {
    borderBottomColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  selectValue: {
    flexGrow: 1,
    minWidth: '0px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  selectPlaceholder: {
    flexGrow: 1,
    minWidth: '0px',
    color: 'rgba(221,241,236,0.72)'
  },
  selectChevron: {
    flexShrink: 0,
    color: PALETTE.helper,
    transitionProperty: 'transform',
    transitionDuration: '160ms'
  },
  selectChevronOpen: {
    transform: 'rotate(180deg)'
  },
  selectMenu: {
    position: 'fixed',
    zIndex: 1000,
    boxSizing: 'border-box',
    ...shorthands.margin(0),
    ...shorthands.padding('6px'),
    listStyleType: 'none',
    overflowX: 'hidden',
    overflowY: 'auto',
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    color: PALETTE.heading,
    backgroundColor: 'rgba(22, 48, 44, 0.94)',
    boxShadow: '0 12px 32px rgba(8, 20, 18, 0.45)',
    backdropFilter: 'blur(16px)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.28)'),
    ...shorthands.borderRadius('10px')
  },
  selectOption: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '8px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
    fontSize: '14px',
    lineHeight: '20px',
    ...shorthands.borderRadius('6px'),
    ...shorthands.padding('8px', '10px'),
    color: PALETTE.body
  },
  selectOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  selectOptionOn: {
    fontWeight: tokens.fontWeightSemibold,
    color: PALETTE.heading
  },
  selectOptionLabel: {
    flexGrow: 1,
    minWidth: '0px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  selectCheck: {
    flexShrink: 0,
    color: PALETTE.heading
  }
});


/** One non-atomic class: Blink ignores ::-webkit-scrollbar when the parts are split across Griffel classes. */
export const GLASS_SCROLL_CLASS = 'wiz-glass-scroll';
const GLASS_SCROLL_ATTR = 'data-wiz-glass-scroll';
const GLASS_SCROLL_CSS = `@supports (-moz-appearance: none){.wiz-glass-scroll{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.55) rgba(255,255,255,0.12)}}.wiz-glass-scroll::-webkit-scrollbar{width:8px;height:8px}.wiz-glass-scroll::-webkit-scrollbar-track{background-color:rgba(255,255,255,0.12);border-radius:8px}.wiz-glass-scroll::-webkit-scrollbar-thumb{background-color:rgba(255,255,255,0.55);border-radius:8px}.wiz-glass-scroll::-webkit-scrollbar-button{display:none;width:0;height:0}.wiz-glass-scroll::-webkit-scrollbar-corner{background:transparent}`;

export function ensureGlassScrollStyle(doc: Document | undefined): void {
  if (!doc || !doc.head || doc.head.querySelector(`style[${GLASS_SCROLL_ATTR}]`)) {
    return;
  }
  const style = doc.createElement('style');
  style.setAttribute(GLASS_SCROLL_ATTR, 'true');
  style.textContent = GLASS_SCROLL_CSS;
  doc.head.appendChild(style);
}

/** Inline style for the n-th option's staggered entrance. */
export function optionDelay(index: number): { animationDelay: string } {
  return { animationDelay: `${Math.min(index, 8) * OPTION_STAGGER_MS + 80}ms` };
}
