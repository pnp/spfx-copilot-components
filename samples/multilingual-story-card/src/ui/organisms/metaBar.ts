// Organism: the row above the headline. Language chip, an optional notice (on its own line),
// optional quiet info such as reading time, and a control at the far end (e.g. the theme switch).

import { h, type Child } from '../dom';
import { spacer } from '../atoms/spacer';

import styles from './MetaBar.module.scss';

export interface IMetaBarProps {
  chip: HTMLElement;
  notice?: HTMLElement;
  /** Quiet text after the chip, e.g. "Reading time: 1 min". */
  info?: string;
  /** At the inline end of the row. */
  end?: Child;
}

export interface IMetaBar {
  element: HTMLElement;
  /** The info element, so the page can show it in one display mode only. */
  info: HTMLElement | undefined;
}

export function metaBar(props: IMetaBarProps): IMetaBar {
  const info: HTMLElement | undefined = props.info ? h('span', { className: styles.info }, props.info) : undefined;
  const element: HTMLElement = h('div', { className: styles.meta }, props.chip, props.notice, info, spacer(), props.end);
  return { element, info };
}
