// WCAG contrast check for the card tokens, in light and dark.
// Reads the $light / $dark maps from Tokens.module.scss (one "name: #hex," per line) and checks the
// text/background pairs the card actually uses. Presets set no colours, so checking the tokens covers
// every preset × theme combination. Runs before the build (npm run build) and fails it on a miss.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKENS = fileURLToPath(new URL('../src/ui/tokens/Tokens.module.scss', import.meta.url));

/** [foreground, background, minimum ratio, where it is used] */
const PAIRS = [
  ['color-text-primary', 'color-background-primary', 4.5, 'title and body text'],
  ['color-text-secondary', 'color-background-primary', 4.5, 'legend, placeholder text'],
  ['color-text-secondary', 'color-background-secondary', 4.5, 'language chip'],
  ['color-text-primary', 'color-background-secondary', 4.5, 'language name in chip, diagnostics'],
  ['color-text-tertiary', 'color-background-primary', 4.5, 'credit line, reading time, notes'],
  ['color-text-info', 'color-background-primary', 4.5, 'credit links'],
  ['card-accent-text', 'card-accent', 4.5, 'primary button, selected design'],
  ['card-highlight-text', 'card-highlight-background', 4.5, 'sentence being read'],
  ['card-word-text', 'card-word-background', 4.5, 'word being read'],
  ['card-word-background', 'card-highlight-background', 1.5, 'word stands out from its sentence (non-text)'],
  ['color-text-secondary', 'card-placeholder-from', 4.5, 'placeholder label (gradient start)'],
  ['color-text-secondary', 'card-placeholder-to', 4.5, 'placeholder label (gradient end)'],
  ['color-ring-primary', 'color-background-primary', 3, 'focus ring (non-text)']
];

// Magazine: white title on a 66 % black scrim, over the worst case (a white photo).
const SCRIM_ALPHA = 0.66;

function parseMap(source, name) {
  const block = source.match(new RegExp(`\\$${name}:\\s*\\(([\\s\\S]*?)\\);`));
  if (!block) {
    throw new Error(`$${name} map not found in ${TOKENS}`);
  }
  const map = {};
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s*([\w-]+):\s*(#[0-9a-fA-F]{3,6})\s*,?\s*$/);
    if (m) {
      map[m[1]] = m[2];
    }
  }
  return map;
}

function rgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) {
    h = h.replace(/./g, (c) => c + c);
  }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const source = readFileSync(TOKENS, 'utf8');
const themes = { light: parseMap(source, 'light'), dark: parseMap(source, 'dark') };
let failures = 0;
const rows = [];

for (const [theme, map] of Object.entries(themes)) {
  for (const [fg, bg, min, usage] of PAIRS) {
    if (!map[fg] || !map[bg]) {
      rows.push(`  ✗ ${theme.padEnd(5)} ${fg} / ${bg}: token missing`);
      failures++;
      continue;
    }
    const r = ratio(rgb(map[fg]), rgb(map[bg]));
    const ok = r >= min;
    failures += ok ? 0 : 1;
    rows.push(`  ${ok ? '✓' : '✗'} ${theme.padEnd(5)} ${r.toFixed(2).padStart(5)} ≥ ${min}  ${fg} on ${bg} (${usage})`);
  }
}

const scrim = [255, 255, 255].map((c) => Math.round(c * (1 - SCRIM_ALPHA)));
const scrimRatio = ratio([255, 255, 255], scrim);
failures += scrimRatio >= 4.5 ? 0 : 1;
rows.push(`  ${scrimRatio >= 4.5 ? '✓' : '✗'} both  ${scrimRatio.toFixed(2).padStart(5)} ≥ 4.5  white title on scrim over a white photo (Magazine)`);

console.log(`Contrast check (${PAIRS.length * 2 + 1} pairs):\n${rows.join('\n')}`);
if (failures > 0) {
  console.error(`\n${failures} contrast check(s) failed.`);
  process.exit(1);
}
