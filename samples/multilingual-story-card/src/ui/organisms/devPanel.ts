// Organism: a developer drawer. A collapsed disclosure with a row of actions, readable sections
// (headings, key/value tables, data tables) and all values as JSON underneath. Generic: the page
// supplies the actions, the sections and the JSON. Developer-facing, so its language is fixed
// (lang/dir on the drawer, WCAG 3.1.2). Pages usually load it on demand (its own chunk).

import type { Action, IActionRunner } from '../actions';
import { h, type Child } from '../dom';
import { button } from '../atoms/button';

import styles from './DevPanel.module.scss';

export interface IDevPanelAction {
  label: string;
  run: () => void | Promise<void>;
}

export interface IDevPanelProps {
  title: string;
  /** Language of the drawer's own texts (default English). */
  lang?: string;
  actions: IDevPanelAction[];
  /** Readable sections, rebuilt on every refresh. */
  sections(): Node[];
  /** Everything, for the raw view and for copying. */
  json(): unknown;
  /** Label of the collapsed raw view. */
  jsonLabel?: string;
  /** An action threw. */
  onError?(error: unknown): void;
}

export interface IDevPanel {
  element: HTMLDetailsElement;
  refresh(): void;
  /** The JSON as shown. */
  text(): string;
}

function cell(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function panelHeading(text: string): HTMLElement {
  return h('h3', { className: styles.heading }, text);
}

export function panelNote(text: string): HTMLElement {
  return h('p', { className: styles.panelNote }, text);
}

/** Label/value rows (skips nothing: an empty value is information too). */
export function keyValueTable(rows: Record<string, unknown>): HTMLElement {
  return h(
    'table',
    { className: styles.table },
    h('tbody', null, Object.keys(rows).map((k: string) => h('tr', null, h('th', { scope: 'row' }, k), h('td', null, cell(rows[k])))))
  );
}

export interface IDataRow {
  cells: unknown[];
  /** 'found' | 'failed' | 'skipped' colour the row. */
  outcome?: string;
}

/** A table with column headers; `empty` is shown when there are no rows. */
export function dataTable(columns: string[], rows: IDataRow[], empty: string): HTMLElement {
  return h(
    'table',
    { className: styles.table },
    h('thead', null, h('tr', null, columns.map((c: string) => h('th', { scope: 'col' }, c)))),
    h(
      'tbody',
      null,
      rows.length === 0
        ? h('tr', null, h('td', { colspan: columns.length }, empty))
        : rows.map((r: IDataRow) => h('tr', { 'data-outcome': r.outcome }, r.cells.map((c: unknown) => h('td', null, cell(c)))))
    )
  );
}

export function devPanel(props: IDevPanelProps): IDevPanel {
  const pre: HTMLPreElement = h('pre', { className: styles.pre });
  const readable: HTMLElement = h('div', { className: styles.readable });

  const refresh = (): void => {
    readable.replaceChildren(...props.sections());
    pre.textContent = JSON.stringify(props.json(), undefined, 2);
  };

  // Every action refreshes the drawer afterwards; a failure is reported, never thrown.
  const runner: IActionRunner = {
    run: (action: Action): Promise<boolean> =>
      Promise.resolve()
        .then(action)
        .catch((error: unknown) => props.onError?.(error))
        .then(() => {
          refresh();
          return true;
        })
  };

  const actions: Child[] = props.actions.map((a: IDevPanelAction) => button(runner, a.label, () => a.run()));
  const element: HTMLDetailsElement = h(
    'details',
    { className: styles.panel, lang: props.lang || 'en', dir: 'ltr' },
    h('summary', { className: styles.summary }, props.title),
    h(
      'div',
      { className: styles.body },
      h('div', { className: styles.row }, actions),
      readable,
      h('details', { className: styles.raw }, h('summary', null, props.jsonLabel || 'All values (JSON)'), pre)
    )
  );
  element.addEventListener('toggle', () => {
    if (element.open) {
      refresh();
    }
  });
  refresh();
  return { element, refresh, text: () => pre.textContent || '' };
}
