export {};
declare const require: (id: string) => unknown;
const fs = require('fs') as { readFileSync(p: string, enc: string): string; readdirSync(p: string): string[]; statSync(p: string): { isDirectory(): boolean } };
const path = require('path') as { join(...parts: string[]): string };
const root = (process as unknown as { cwd(): string }).cwd();

function sources(dir: string): string[] {
  return fs.readdirSync(dir).reduce<string[]>((acc, name) => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      return name === '__tests__' ? acc : acc.concat(sources(p));
    }
    return /\.(ts|tsx)$/.test(name) ? acc.concat([p]) : acc;
  }, []);
}

describe('no raw HTML', () => {
  const files = sources(path.join(root, 'src'));

  it('finds the sources', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it.each(['dangerouslySetInnerHTML', '.innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function('])('never uses %s', (needle) => {
    files.forEach((f) => expect({ file: f, found: fs.readFileSync(f, 'utf8').indexOf(needle) >= 0 }).toEqual({ file: f, found: false }));
  });

  it('has no literal unicode escapes in JSX text (JSX does not decode them)', () => {
    files.filter((f) => /\.tsx$/.test(f)).forEach((f) => {
      const found = /<[A-Za-z][^>]*>[^<{]*\\u[0-9a-fA-F]{4}/.test(fs.readFileSync(f, 'utf8'));
      expect({ file: f, found }).toEqual({ file: f, found: false });
    });
  });
});
