/** @jest-environment node */
declare const __dirname: string;
/** The compiled round-trip folder; this test sits in its __tests__ folder. */
const folder = __dirname + '/..';

// The folder is meant to be copied into another card. Nothing in it may reach outside it, apart from Zod (including its built-in
// JSON-schema emitter) and React DOM for the shared root.
describe('The round-trip folder stands on its own', () => {
  it('imports nothing from the rest of the sample, the SPFx packages or the UI library', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs: { readdirSync(dir: string): string[]; readFileSync(file: string, encoding: string): string } = require('fs');
    // tslib holds the compiler's helpers; every compiled file needs it.
    const allowed = ['tslib', 'zod', 'react-dom/client'];
    const files = fs.readdirSync(folder).filter(name => name.endsWith('.js') && !name.endsWith('.test.js'));
    expect(files.length).toBeGreaterThan(8);
    const outside: string[] = [];
    for (const name of files) {
      const source = fs.readFileSync(folder + '/' + name, 'utf8');
      const requires = /require\("([^"]+)"\)/g;
      let match: RegExpExecArray | null;
      while ((match = requires.exec(source)) !== null) {
        const specifier = match[1];
        const sibling = specifier.startsWith('./') && specifier.indexOf('..') < 0;
        if (!sibling && allowed.indexOf(specifier) < 0) outside.push(`${name} -> ${specifier}`);
      }
    }
    expect(outside).toEqual([]);
  });
});
