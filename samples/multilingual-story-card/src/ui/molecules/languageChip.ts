// Molecule: "Detected: Deutsch (Österreich) · de-AT · Source: agent". The language name is written
// in that language, so it carries its own lang/dir (WCAG 3.1.2); the tag is always left-to-right.

import { h } from '../dom';
import { chip } from '../atoms/chip';

import styles from './LanguageChip.module.scss';

export interface ILanguageChipProps {
  /** "Detected:" */
  label: string;
  /** The language's own name for itself. */
  name: string;
  nameLang: string;
  nameDir: 'ltr' | 'rtl';
  /** BCP 47 tag. */
  tag: string;
  /** "Source: agent" */
  source: string;
}

export function languageChip(props: ILanguageChipProps): HTMLElement {
  return chip(
    h('span', null, props.label),
    h('span', { className: styles.chipName, lang: props.nameLang, dir: props.nameDir }, props.name),
    h('span', { 'aria-hidden': 'true' }, '·'),
    h('span', { className: styles.chipTag }, props.tag),
    h('span', { 'aria-hidden': 'true' }, '·'),
    h('span', null, props.source)
  );
}
