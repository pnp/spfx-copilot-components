import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function visualSourceSignature(root) {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|jpg|png)$/i.test(entry.name) && !/\.(test\.tsx?|d\.ts)$/.test(entry.name)) files.push(file);
    }
  }
  walk(path.join(root, 'src', 'shared'));
  files.push(path.join(root, 'scripts', 'visual-harness', 'entry.tsx'), path.join(root, 'scripts', 'visual-harness', 'index.html'));
  const hash = crypto.createHash('sha256');
  for (const file of files.sort()) hash.update(path.relative(root, file).split(path.sep).join('/')).update(fs.readFileSync(file));
  return hash.digest('hex');
}
