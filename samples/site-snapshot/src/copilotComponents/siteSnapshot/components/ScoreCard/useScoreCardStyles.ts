import { makeStyles, tokens } from '@fluentui/react-components';

export const useScoreCardStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  // Score badge with a small "HEALTH SCORE" caption below it, matching the
  // full-screen dashboard so the number is unmistakable.
  badgeCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 },
  scoreCaption: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '.04em'
  },
  scoreBadge: {
    display: 'grid',
    placeItems: 'center',
    width: '52px',
    height: '52px',
    borderRadius: tokens.borderRadiusLarge,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0
  },
  healthy: { backgroundColor: tokens.colorPaletteGreenBackground3 },
  watch: { backgroundColor: tokens.colorPaletteMarigoldBackground3 },
  atRisk: { backgroundColor: tokens.colorPaletteRedBackground3 },
  headText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  subtle: { color: tokens.colorNeutralForeground3 },
  // Small uppercase eyebrow above the site name.
  kicker: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    fontWeight: tokens.fontWeightSemibold
  },

  // An evenly-aligned grid of the most important numbers. Wraps to two rows on
  // a narrow inline card.
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalS
  },
  stat: { display: 'flex', flexDirection: 'column' },
  statValue: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1.2',
    whiteSpace: 'nowrap'
  },
  statAlert: { color: tokens.colorPaletteRedForeground1 },
  statLabel: { color: tokens.colorNeutralForeground3 }
});
