import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.join(root, 'src', 'shared', 'assets', 'brand');
const provenancePath = path.join(root, 'assets', 'brand-provenance.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (process.argv.includes('--check')) {
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
  assert.equal(provenance.items.length, 10);
  for (const item of provenance.items) {
    assert.equal(hash(fs.readFileSync(path.join(root, item.file))), item.sha256, `Stale brand/geography asset: ${item.file}`);
  }
  assert.match(provenance.publicReviewStatus, /Pending/);
  console.log('ZavaCore provenance passed: 9 optimized brand/portrait/icon assets and bundled public-domain geography.');
} else {
  const source = process.argv[2];
  assert(source && fs.statSync(source).isDirectory(), 'Supply the local ZavaCore asset directory.');
  fs.mkdirSync(destination, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const items = [];
  try {
    for (const [relative, name, width, height, crop] of [
      ['Logos\\svg\\ZavaCore-logotype-clr.svg', 'logo.png', 480, 82],
      ['Logos\\svg\\ZavaCore-logotype-wht.svg', 'logo-white.png', 480, 82],
      ['Photos\\zavacore photo 2.jpg', 'field-operations.jpg', 960, 640],
      ['Photos\\Team\\carole.png', 'carole.jpg', 160, 160],
      ['Photos\\Team\\david.png', 'david.jpg', 160, 160],
      ['Photos\\Team\\serena.png', 'serena.jpg', 160, 160],
      ['Backgrounds\\Card\\ZavaCore card 4.png', 'core-pattern.jpg', 440, 464],
      ['Logos\\svg\\ZavaCore-logotype-clr.svg', '..\\..\\..\\..\\..\\copilot\\color.png', 192, 192, true],
      ['Logos\\svg\\ZavaCore-mark_wht.svg', '..\\..\\..\\..\\..\\copilot\\outline.png', 32, 32]
    ]) {
      const bytes = fs.readFileSync(path.join(source, relative));
      const extension = path.extname(relative);
      let image = extension === '.svg' ? bytes.toString('utf8') : undefined;
      if (crop) image = image.replace('width="1555" height="265" viewBox="0 0 1555 265"', 'width="265" height="265" viewBox="0 0 265 265"');
      const url = `data:${extension === '.svg' ? 'image/svg+xml' : extension === '.jpg' ? 'image/jpeg' : 'image/png'};base64,${Buffer.from(image || bytes).toString('base64')}`;
      const result = await page.evaluate(async ({ url, width, height, jpeg, icon }) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (icon) { context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, width, height); }
        const inset = icon ? 24 : 0;
        context.drawImage(image, inset, inset, width - inset * 2, height - inset * 2);
        return canvas.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.85).split(',')[1];
      }, { url, width, height, jpeg: name.endsWith('.jpg'), icon: crop });
      const target = name.includes('copilot') ? path.join(root, 'copilot', path.basename(name)) : path.join(destination, name);
      const output = Buffer.from(result, 'base64');
      fs.writeFileSync(target, output);
      items.push({ file: path.relative(root, target).replaceAll('\\', '/'), source: relative, sourceSha256: hash(bytes), sha256: hash(output), width, height, rights: 'User-supplied ZavaCore brand library; public redistribution approval pending' });
    }
  } finally { await browser.close(); }
  const geographyUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
  const response = await fetch(geographyUrl);
  assert(response.ok, `Geography download failed: ${response.status}`);
  const original = await response.text();
  const parsed = JSON.parse(original, (key, value) => typeof value === 'number' ? Math.round(value * 100) / 100 : value);
  const geography = { type: 'FeatureCollection', features: parsed.features.map(({ type, geometry, properties }) => ({ type, geometry, properties })) };
  const file = 'src/shared/worldLand.ts';
  const output = `import type { FeatureCollection } from 'geojson';\n\n// Natural Earth 1:110m land, public domain; rounded to 0.01 degrees for this offline overview.\nexport const WORLD_LAND: FeatureCollection = ${JSON.stringify(geography)};\n`;
  fs.writeFileSync(path.join(root, file), output);
  items.push({ file, source: geographyUrl, sourceSha256: hash(original), sha256: hash(output), rights: 'Natural Earth public domain: https://www.naturalearthdata.com/about/terms-of-use/' });
  fs.writeFileSync(provenancePath, `${JSON.stringify({ schemaVersion: 1, externalRuntimeMedia: false, publicReviewStatus: 'Pending final publisher and supplied-brand redistribution approval', items }, null, 2)}\n`);
  console.log(`Prepared ${items.length} ZavaCore assets with provenance.`);
}
