import { makeStyles, tokens } from '@fluentui/react-components';

export const useDashboardStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxWidth: '1080px',
    margin: '0 auto'
  },

  // One compact summary card: header row + storage + sub-scores.
  summaryCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL
  },
  cardCorner: { position: 'absolute', top: tokens.spacingVerticalM, right: tokens.spacingHorizontalM },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL
  },
  identity: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL },
  badgeCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 },
  scoreCaption: { color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '.04em' },
  scoreBadge: {
    display: 'grid',
    placeItems: 'center',
    width: '68px',
    height: '68px',
    borderRadius: tokens.borderRadiusLarge,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0
  },
  healthy: { backgroundColor: tokens.colorPaletteGreenBackground3 },
  watch: { backgroundColor: tokens.colorPaletteMarigoldBackground3 },
  atRisk: { backgroundColor: tokens.colorPaletteRedBackground3 },
  meta: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  metaLine: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    color: tokens.colorNeutralForeground3
  },
  actions: { display: 'flex', gap: tokens.spacingHorizontalS, flexWrap: 'wrap' },

  // Storage + sub-scores
  scoreRow: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalXXS },
  rowHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '20px' },
  subGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalM
  },
  caption: { color: tokens.colorNeutralForeground3 },

  // KPI tiles - compact, with a hover lift and a corner info icon.
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(152px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  kpiCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'transform, box-shadow',
    ':hover': { transform: 'translateY(-1px)', boxShadow: tokens.shadow8 }
  },
  kpiCorner: { position: 'absolute', top: '6px', right: '8px' },
  kpiAlertCard: {
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    backgroundColor: tokens.colorPaletteRedBackground1
  },
  infoTip: {
    display: 'inline-flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
    cursor: 'default'
  },
  labelRow: { display: 'inline-flex', alignItems: 'center', gap: tokens.spacingHorizontalXS },
  kpiValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1.1',
    whiteSpace: 'nowrap'
  },
  kpiAlert: { color: tokens.colorPaletteRedForeground1 },
  kpiLabel: { color: tokens.colorNeutralForeground3 },

  tabsCard: { padding: tokens.spacingVerticalM },
  tabPanel: { paddingTop: tokens.spacingVerticalS, overflowX: 'auto' }
});
