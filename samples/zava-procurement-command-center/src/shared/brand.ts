import logo from './assets/brand/logo.png';
import logoWhite from './assets/brand/logo-white.png';
import fieldOperations from './assets/brand/field-operations.jpg';
import pattern from './assets/brand/core-pattern.jpg';
import carole from './assets/brand/carole.jpg';
import david from './assets/brand/david.jpg';
import serena from './assets/brand/serena.jpg';

export const ZAVACORE = {
  logo, logoWhite, fieldOperations, pattern,
  orange: 'var(--zava-orange)', magenta: 'var(--zava-magenta)',
  ink: 'var(--zava-ink)', heroInk: 'var(--zava-hero-ink)', white: 'var(--zava-white)'
} as const;
export const OWNERS = {
  finance: { name: 'Carole', role: 'Budget owner', image: carole },
  sourcing: { name: 'David', role: 'Category lead', image: david },
  risk: { name: 'Serena', role: 'Supplier risk', image: serena }
} as const;
