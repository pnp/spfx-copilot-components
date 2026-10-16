import { makeStyles, tokens } from '@fluentui/react-components';

export const useExplorerStyles = makeStyles({
  root: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '1440px',
    marginLeft: 'auto',
    marginRight: 'auto',
    color: tokens.colorNeutralForeground1,
    '@media (max-width: 480px)': { padding: '12px', gap: '16px' }
  },
  hero: {
    backgroundImage: `linear-gradient(125deg, ${tokens.colorBrandBackground2}, ${tokens.colorNeutralBackground2})`,
    borderRadius: tokens.borderRadiusXLarge,
    padding: '28px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    '@media (max-width: 480px)': { padding: '16px' }
  },
  eyebrow: { color: tokens.colorBrandForeground1, letterSpacing: '2px', fontWeight: 600, fontSize: '11px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' },
  actions: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  muted: { color: tokens.colorNeutralForeground2 },
  summaries: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' },
  summary: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 },
  count: { fontSize: '32px', lineHeight: '40px', fontWeight: 600, color: tokens.colorBrandForeground1 },
  filters: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' },
  search: { flexGrow: 2, flexBasis: '240px', minWidth: 0 },
  filter: { flexGrow: 1, flexBasis: '155px', minWidth: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: '16px' },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: '16px'
  },
  card: { display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
  cardHeading: { display: 'flex', gap: '12px', alignItems: 'start' },
  cardTitle: { overflowWrap: 'anywhere', flexGrow: 1, minWidth: 0 },
  description: {
    color: tokens.colorNeutralForeground2,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
    flexGrow: 1
  },
  empty: {
    padding: '32px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center'
  },
  details: { display: 'flex', flexDirection: 'column', gap: '20px', overflowWrap: 'anywhere' },
  fullDescription: { whiteSpace: 'pre-wrap' },
  definition: { margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  value: { marginLeft: 0, color: tokens.colorNeutralForeground2, userSelect: 'text' }
});
