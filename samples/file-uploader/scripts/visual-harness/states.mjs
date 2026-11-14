/**
 * The visual-evidence matrix, shared between the browser harness (harness.tsx)
 * and the capture / check scripts. Metadata only — the code that drives each
 * state into place lives in harness.tsx keyed by `id`.
 */

/** @type {{ id: string, displayMode: 'inline' | 'fullscreen', width: number, extraWidths?: number[], zoom?: boolean, expectsConsoleError?: boolean }[]} */
export const STATES = [
  { id: 'filing-empty', displayMode: 'inline', width: 760 },
  { id: 'filing-draft', displayMode: 'inline', width: 760, extraWidths: [340], zoom: true },
  { id: 'filing-validation', displayMode: 'inline', width: 760 },
  { id: 'filing-review', displayMode: 'inline', width: 760 },
  { id: 'filing-receipt', displayMode: 'inline', width: 760 },
  { id: 'filing-error', displayMode: 'inline', width: 760 },
  { id: 'recent-default', displayMode: 'inline', width: 760, extraWidths: [340] },
  { id: 'recent-filtered', displayMode: 'inline', width: 760 },
  { id: 'recent-no-match', displayMode: 'inline', width: 760 },
  { id: 'recent-error', displayMode: 'inline', width: 760 },
  { id: 'filing-bulk', displayMode: 'fullscreen', width: 1280, zoom: true },
  { id: 'filing-bulk-receipt', displayMode: 'fullscreen', width: 1280 },
  // Live-shaped links on a fictional host (8.8 L9, L10): URL as text and Open.
  { id: 'filing-receipt-link', displayMode: 'inline', width: 760, extraWidths: [340] },
  { id: 'recent-row-link', displayMode: 'inline', width: 760, extraWidths: [340] },
  { id: 'filing-bulk-receipt-link', displayMode: 'fullscreen', width: 1280 },
  { id: 'render-error', displayMode: 'inline', width: 760, expectsConsoleError: true },
  { id: 'store-starting', displayMode: 'inline', width: 760, extraWidths: [340] }
];

export const THEMES = ['light', 'dark'];

/** Every (state, theme) is captured; extraWidths and zoom add captures for that state in light only. */
export function expectedCaptures() {
  const list = [];
  for (const st of STATES) {
    for (const theme of THEMES) {
      list.push({ id: st.id, theme, variant: 'standard', width: st.width });
    }
    for (const w of st.extraWidths || []) {
      list.push({ id: st.id, theme: 'light', variant: 'w' + w, width: w });
    }
    if (st.zoom) {
      list.push({ id: st.id, theme: 'light', variant: 'zoom200', width: st.width });
    }
  }
  return list;
}

export const captureFileName = c =>
  `${c.id}.${c.theme}.${c.variant}.png`;

/**
 * One state is *supposed* to log to the console: `render-error` drives a real
 * throw into the error boundary, and React logs every error it catches. For
 * that state a silent console is the failure — it would mean nothing threw —
 * so the check is inverted rather than waived (todo.md 8.5 E1). Every other
 * state must stay silent.
 */
export function expectsConsoleError(id) {
  return STATES.some(s => s.id === id && s.expectsConsoleError === true);
}
