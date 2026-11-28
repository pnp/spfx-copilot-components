import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from '../scripts/review.mjs';

// Run against the local integrated harness after npm run review:build.
export async function checkTechLayouts(page, base) {
  const measurements = [];
  for (const [width, heightLimit] of [[760, 650], [390, 800]]) {
    await page.setViewportSize({ width, height: 840 });
    for (const id of [19,20,21,22,23,24,25,26,27,28,30]) {
      const mode = id === 30 ? 'full' : 'inline';
      const url = new URL(base);
      url.search = new URLSearchParams({ bare: '1', fixed: id === 30 ? '1' : '0', landing: 'tech', entry: String(id), clock: '2026-11-27T09:00:00Z', mode }).toString();
      await page.goto(url.href);
      await page.locator(`[data-tech-mode="${mode}"]`).waitFor();
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      const height = Math.ceil((await page.locator('main').boundingBox()).height);
      if (mode === 'inline') assert.ok(height <= heightLimit, `#${id} at ${width}px: ${height}px exceeds ${heightLimit}px`);
      for (const row of await page.locator('.tw-listrow').all()) {
        assert.ok(await row.evaluate(el => {
          const parts = [...el.querySelector('.tw-rowcopy').children].map(node => node.getBoundingClientRect());
          return getComputedStyle(el).display === 'grid' && parts.length === 3 && parts.slice(1).every((part, i) => part.top > parts[i].bottom);
        }), `#${id} at ${width}px: record metadata, title and detail must occupy distinct lines`);
      }
      if ([26,27].includes(id)) {
        const table = page.locator('.tw-data');
        await table.locator('summary').focus();
        await page.keyboard.press('Enter');
        const mark = table.getByRole('button').first();
        await mark.focus(); await page.keyboard.press('Enter');
        assert.equal(await mark.getAttribute('aria-pressed'), 'true');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `#${id} overflows at ${width}px`);
      measurements.push({ id, width, mode, height });
    }
  }
  return measurements;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const candidates = [process.env.BROWSER_PATH, process.env.ProgramFiles && path.join(process.env.ProgramFiles,'Google','Chrome','Application','chrome.exe'), process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'],'Microsoft','Edge','Application','msedge.exe')].filter(Boolean);
  let executablePath;
  for (const candidate of candidates) { try { await fs.access(candidate); executablePath = candidate; break; } catch (e) { if (e.code !== 'ENOENT') throw e; } }
  const server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath });
    const sizes = await checkTechLayouts(await browser.newPage({ reducedMotion: 'reduce' }), server.url);
    console.table(sizes.filter(m => m.mode === 'inline'));
  } finally { await browser?.close(); await server.close(); }
}
