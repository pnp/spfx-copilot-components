import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const requiredDocuments = [
  'Zava-Revenue-Deal-Room-6-Minute-Keynote.md',
  'Zava-Revenue-Deal-Room-10-Minute-Business-Demo.md',
  'Zava-Revenue-Deal-Room-5-Minute-Technical-Demo.md',
  'Zava-Revenue-Deal-Room-Designer-Review.md',
  'Zava-Revenue-Deal-Room-Routing-Matrix.md'
];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
for (const document of requiredDocuments) {
  const file = path.join(root, document);
  assert(fs.existsSync(file), `Missing publication document: ${document}`);
  assert(fs.statSync(file).size > 500, `Publication document is unexpectedly small: ${document}`);
  assert(readme.includes(`](${document})`), `README does not link ${document}.`);
}
const technical = fs.readFileSync(path.join(root, 'Zava-Revenue-Deal-Room-5-Minute-Technical-Demo.md'), 'utf8');
assert(technical.includes('D3') && technical.includes('Natural Earth'), 'Technical demo must explain D3 and map implementation.');
const keynote = fs.readFileSync(path.join(root, 'Zava-Revenue-Deal-Room-6-Minute-Keynote.md'), 'utf8');
assert(keynote.includes('deterministic mock data') && keynote.includes('fallback'), 'Keynote must include safety and fallback guidance.');
for (const cue of ['0:00-0:45', '5:10-6:00', 'text-only', 'new interactive inline form', 'Summary & next steps']) {
  assert(keynote.includes(cue), `Keynote is missing its six-minute mode-aware continuation cue: ${cue}`);
}
const chartSource = fs.readFileSync(path.join(root, 'src', 'shared', 'visualizations', 'RevenueCharts.tsx'), 'utf8');
for (const dependency of ['d3-geo', './worldGeography', './revenueGeometry']) assert(chartSource.includes(dependency), `Visualization source does not use ${dependency}.`);
const geographySource = fs.readFileSync(path.join(root, 'src', 'shared', 'visualizations', 'worldGeography.ts'), 'utf8');
for (const dependency of ['topojson-client', 'world-atlas']) assert(geographySource.includes(dependency), `Shared offline geography does not use ${dependency}.`);
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const dependency of ['d3-array', 'd3-geo', 'd3-scale', 'd3-shape', 'd3-sankey', 'topojson-client', 'world-atlas']) assert(packageJson.dependencies[dependency], `Missing visualization dependency: ${dependency}`);
assert(fs.readFileSync(path.join(root, 'src', 'shared', 'visualizations', 'sankeyGeometry.ts'), 'utf8').includes("from 'd3-sankey'"), 'Sankey geometry must use the declared D3 layout.');
console.log(JSON.stringify({ documents: requiredDocuments.length, d3Modules: 5, offlineMap: true, readmeLinks: requiredDocuments.length }));
