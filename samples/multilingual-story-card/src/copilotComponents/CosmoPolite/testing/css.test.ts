import { describe, expect, it } from 'vitest';
import { classNamesByFile, cssFiles, type ICssFile } from './css';

// The real bundle hashes class names per file; the tests (and so the preview and the catalog) do not.
// A class defined in two files would merge in the preview but not in the bundle: forbid it, so what
// the preview shows is what ships.
describe('stylesheets', () => {
  it('are found for every level', () => {
    const files: string[] = cssFiles().map((f: ICssFile) => f.file);
    ['ui/tokens/', 'ui/atoms/', 'ui/molecules/', 'ui/organisms/', 'ui/templates/'].forEach((level: string) => {
      expect(files.some((f: string) => f.startsWith(level))).toBe(true);
    });
  });

  it('define every class name in one file only', () => {
    const owner: Record<string, string> = {};
    const clashes: string[] = [];
    const byFile: Record<string, string[]> = classNamesByFile();
    Object.keys(byFile).forEach((file: string) => {
      byFile[file].forEach((name: string) => {
        if (owner[name] && owner[name] !== file) {
          clashes.push(`.${name}: ${owner[name]} and ${file}`);
        }
        owner[name] = owner[name] || file;
      });
    });
    expect(clashes).toEqual([]);
  });
});
