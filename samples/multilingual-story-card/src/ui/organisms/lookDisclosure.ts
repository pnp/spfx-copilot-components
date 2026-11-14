// Organism: the advanced path, one level deeper. A native disclosure (keyboard and screen readers
// for free) with a chevron, holding a row of settings. The page remembers whether it was open.

import { h, type Child } from '../dom';

import styles from './LookDisclosure.module.scss';

export interface ILookDisclosureProps {
  summary: string;
  open: boolean;
  onToggle(open: boolean): void;
  settings: Child[];
}

export function lookDisclosure(props: ILookDisclosureProps): HTMLDetailsElement {
  const details: HTMLDetailsElement = h(
    'details',
    { className: styles.look, open: props.open },
    h('summary', { className: styles.lookSummary }, props.summary),
    h('div', { className: styles.settings }, props.settings)
  );
  details.addEventListener('toggle', () => props.onToggle(details.open));
  return details;
}
