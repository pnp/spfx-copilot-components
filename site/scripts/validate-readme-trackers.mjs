import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateVisitorStatsTracker } from './gallery-model.mjs';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..');
const samplesRoot = path.join(repositoryRoot, 'samples');
const entries = await readdir(samplesRoot, { withFileTypes: true });
const samples = entries.filter((entry) => entry.isDirectory()).sort((left, right) => left.name.localeCompare(right.name));

for (const sample of samples) {
  const readme = await readFile(path.join(samplesRoot, sample.name, 'README.md'), 'utf8');
  validateVisitorStatsTracker(sample.name, readme);
}

console.log(`[gallery] validated README view trackers for ${samples.length} samples`);