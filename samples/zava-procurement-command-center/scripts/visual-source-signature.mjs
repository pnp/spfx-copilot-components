import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
export function visualSourceSignature() {
  const files = [];
  function collect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'evidence') collect(file);
      } else if (/\.(?:tsx?|html|png|jpg|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) files.push(file);
    }
  }
  collect(path.join(root, 'src'));
  collect(path.join(root, 'ux-review'));
  for (const file of ['config/conversation-starters.json', 'copilot/declarativeAgent.json', 'copilot/instruction.txt', 'scripts/build-visual-harness.mjs']) files.push(path.join(root, file));
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) hash.update(path.relative(root, file).replaceAll('\\', '/')).update('\0').update(fs.readFileSync(file)).update('\0');
  return hash.digest('hex');
}
