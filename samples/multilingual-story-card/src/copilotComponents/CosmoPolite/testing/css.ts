// Test-only: the compiled stylesheets of every piece, for the static preview and catalog pages.
// Gathered from lib/ (every *.module.scss.css, written by `heft build`), in atomic order:
// tokens → atoms → molecules → organisms → templates → the component's own files. In the tests the
// class names are not hashed, so the pages use them as written; classNamesByFile() lets a test make sure
// no two files define the same class (which would merge in the preview but not in the real bundle).

import fs from 'node:fs';
import path from 'node:path';

/** Heft's compiled output; the sass task writes every *.module.scss.css there. Paths are from the project root. */
export const COMPILED_ROOT: string = path.resolve('lib');

const ORDER: string[] = ['ui/tokens/', 'ui/atoms/', 'ui/molecules/', 'ui/organisms/', 'ui/templates/', 'ui/', ''];

export interface ICssFile {
  /** Relative to lib/, e.g. "ui/atoms/Button.module.scss.css". */
  file: string;
  css: string;
}

function walk(dir: string, out: string[]): void {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry: fs.Dirent) => {
    const full: string = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.name.endsWith('.module.scss.css')) {
      out.push(full);
    }
  });
}

function rank(file: string): number {
  return ORDER.findIndex((prefix: string) => file.startsWith(prefix));
}

export function cssFiles(): ICssFile[] {
  const files: string[] = [];
  walk(COMPILED_ROOT, files);
  return files
    .map((full: string) => ({ file: path.relative(COMPILED_ROOT, full).replace(/\\/g, '/'), css: fs.readFileSync(full, 'utf8') }))
    .sort((a: ICssFile, b: ICssFile) => rank(a.file) - rank(b.file) || a.file.localeCompare(b.file));
}

/** All stylesheets as one string, in atomic order. */
export function allCss(): string {
  return cssFiles()
    .map((f: ICssFile) => `/* ${f.file} */\n${f.css}`)
    .join('\n');
}

/** The class names each file defines (comments and strings stripped). */
export function classNamesByFile(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  cssFiles().forEach((f: ICssFile) => {
    const code: string = f.css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"|'[^']*'/g, '""');
    const names: string[] = [];
    (code.match(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g) || []).forEach((m: string) => {
      const name: string = m.slice(1);
      if (names.indexOf(name) === -1 && !/^\d/.test(name)) {
        names.push(name);
      }
    });
    out[f.file] = names;
  });
  return out;
}
