import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  normalizeRepositoryUrl,
  renderReadme,
  resolveThumbnailPath,
  selectPrimaryImage,
  validateVisitorStatsTracker,
} from '../../scripts/gallery-model.mjs';

describe('gallery metadata', () => {
  it('selects the first ordered image without requiring preview.png', () => {
    const selected = selectPrimaryImage([
      { type: 'video', order: 1, url: 'https://example.com/demo' },
      { type: 'image', order: 200, name: 'second.png' },
      { type: 'image', order: 100, name: 'introduction.png' },
    ]);

    expect(selected.name).toBe('introduction.png');
  });

  it('resolves encoded image URLs to the owning sample assets', () => {
    const resolved = resolveThumbnailPath('D:\\repo', 'time-off-absence', {
      url: 'https://github.com/pnp/spfx-copilot-apps/raw/main/samples/time-off-absence/assets/my%20time%20off.png',
    });

    expect(resolved).toBe(path.resolve('D:\\repo', 'samples', 'time-off-absence', 'assets', 'my time off.png'));
  });

  it('normalizes stale repository links for generated output', () => {
    expect(normalizeRepositoryUrl('https://github.com/pnp/spfx-copilot-apps/issues'))
      .toBe('https://github.com/pnp/spfx-copilot-components/issues');
  });

  it('sanitizes README HTML and secures external links', () => {
    const html = renderReadme('demo', '# Demo\n\n[Docs](https://example.com)\n\n<script>alert(1)</script>');

    expect(html).not.toContain('<script>');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('allows README links within samples and rejects repository escapes', () => {
    const html = renderReadme(
      'copilot-readiness-action-centre',
      '[Rules](../my-day/agentic-creation-rules.md)',
    );

    expect(html).toContain(
      'href="https://github.com/pnp/spfx-copilot-components/blob/main/samples/my-day/agentic-creation-rules.md"',
    );
    expect(() => renderReadme('demo', '[Root](../../README.md)'))
      .toThrow('Unsafe README link in demo: ../../README.md');
  });

  it('requires one sample-specific visitor tracker as the final README entry', () => {
    const tracker = '<img src="https://m365-visitor-stats.azurewebsites.net/spfx-copilot-components/samples/demo" />';

    expect(() => validateVisitorStatsTracker('demo', `# Demo\n\n${tracker}\n`)).not.toThrow();
    expect(() => validateVisitorStatsTracker('demo', `${tracker}\n\nMore content\n`))
      .toThrow('README must end with');
    expect(() => validateVisitorStatsTracker('demo', tracker.replace('/demo', '/other')))
      .toThrow('README must end with');
    expect(() => validateVisitorStatsTracker('demo', `${tracker}\n${tracker}`))
      .toThrow('README must contain exactly one visitor-stats tracker');
  });
});