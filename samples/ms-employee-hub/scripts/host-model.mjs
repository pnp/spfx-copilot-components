import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const json = file => JSON.parse(readFileSync(resolve(root, file), 'utf8'));
export const catalog = json('config/hub-catalog.json');
export const proof = [9, 22, 25, 30];
export const fixed = [
  { part: 'MicrosoftHomeWorkspace', landing: 'company', title: 'Microsoft home' },
  { part: 'HRwebWorkspace', landing: 'hr', title: 'HRweb' },
  { part: 'TechWebWorkspace', landing: 'tech', title: 'TechWeb' },
  { part: 'BusinessSLTWorkspace', landing: 'business', title: 'Business' }
];
export function entries(kind) {
  const tool = kind === 'copilotComponents';
  const suffix = tool ? 'CopilotComponent' : 'WebPart';
  const dir = `src/${kind}`;
  if (!existsSync(resolve(root, dir))) return [];
  return readdirSync(resolve(root, dir), { withFileTypes: true }).filter(item => item.isDirectory()).flatMap(item => {
    const folder = `${dir}/${item.name}`;
    return readdirSync(resolve(root, folder)).filter(file => file.endsWith(`${suffix}.manifest.json`)).map(file => {
      const path = `${folder}/${file}`;
      const parsed = ts.parseConfigFileTextToJson(file, readFileSync(resolve(root, path), 'utf8'));
      if (parsed.error) throw Error(`Malformed generator manifest: ${path}`);
      const manifest = parsed.config, alias = manifest.alias, name = alias.slice(0, -suffix.length).toLowerCase();
      const landing = !tool && fixed.find(x => x.part.toLowerCase() === name);
      const row = landing ? catalog.find(c => c.id === 30) : catalog.find(c => (tool ? c.tool : c.part).toLowerCase() === name);
      return { tool, folder, path, manifest, alias, row, landing, placeholder: alias === 'HelloWorldCopilotComponent' };
    });
  });
}
export const supported = e => e.landing ? ['SharePointWebPart', 'SharePointFullPage', 'TeamsPersonalApp'] : e.row.id === 30 ? ['TeamsPersonalApp'] : ['SharePointWebPart'];
export const publisher = {
  name: 'Contoso', websiteUrl: 'https://example.invalid/employee-hub',
  privacyUrl: 'https://example.invalid/employee-hub/privacy', termsOfUseUrl: 'https://example.invalid/employee-hub/terms'
};
