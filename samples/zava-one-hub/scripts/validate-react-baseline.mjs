import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const packageLock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
const errors = [];
const expectedDependencies = {
  react: '18.3.1',
  'react-dom': '18.3.1',
  '@fluentui/react-components': '9.74.9',
  '@fluentui/react-icons': '2.0.314',
  '@griffel/react': '1.7.8',
  '@microsoft/sp-component-base': '1.24.0',
  '@microsoft/sp-copilot-component': '1.24.0',
  '@microsoft/sp-core-library': '1.24.0',
  '@microsoft/sp-webpart-base': '1.24.0'
};

for (const [name, version] of Object.entries(expectedDependencies)) {
  if (packageJson.dependencies?.[name] !== version) errors.push(`Expected ${name}@${version}, found ${packageJson.dependencies?.[name] || 'missing'}.`);
}
if (packageJson.dependencies?.['@fluentui/react']) errors.push('Direct Fluent UI v8 dependency is not allowed.');
if (packageJson.engines?.node !== '>=22.14.0 <23.0.0 || >=24.0.0 <25.0.0 || >=26.0.0 <27.0.0') errors.push(`Unexpected Node engine: ${packageJson.engines?.node}.`);
if (packageJson.devDependencies?.['@types/react'] !== '18.3.31' || packageJson.devDependencies?.['@types/react-dom'] !== '18.3.7') errors.push('React types must match the GA baseline.');

const allowedReactPaths = new Set([
  'node_modules/react',
  'node_modules/react-dom',
  'node_modules/@microsoft/sp-loader/node_modules/react',
  'node_modules/@microsoft/sp-loader/node_modules/react-dom',
  'node_modules/@microsoft/sp-property-pane/node_modules/react',
  'node_modules/@microsoft/sp-property-pane/node_modules/react-dom',
  'node_modules/@microsoft/sp-webpart-base/node_modules/react',
  'node_modules/@microsoft/sp-webpart-base/node_modules/react-dom'
]);
const reactPaths = Object.keys(packageLock.packages || {}).filter((path) => path === 'node_modules/react' || path === 'node_modules/react-dom' || path.endsWith('/node_modules/react') || path.endsWith('/node_modules/react-dom'));
for (const path of reactPaths) {
  if (!allowedReactPaths.has(path)) errors.push(`Unexpected React runtime copy: ${path}@${packageLock.packages[path]?.version}.`);
}
if (packageLock.packages?.['node_modules/react']?.version !== '18.3.1') errors.push('Application React lockfile version must be 18.3.1.');
if (packageLock.packages?.['node_modules/react-dom']?.version !== '18.3.1') errors.push('Application ReactDOM lockfile version must be 18.3.1.');

function sourceFiles(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return ['.ts', '.tsx'].includes(extname(entry.name).toLowerCase()) ? [child] : [];
  });
}

const forbiddenPatterns = [
  { pattern: /from ['"]@fluentui\/react['"]/, message: 'Fluent UI v8 import' },
  { pattern: /ReactDOM\.render\s*\(/, message: 'legacy ReactDOM.render call' },
  { pattern: /unmountComponentAtNode\s*\(/, message: 'legacy unmountComponentAtNode call' }
];
for (const path of sourceFiles(resolve(root, 'src'))) {
  const content = readFileSync(path, 'utf8');
  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(content)) errors.push(`${forbidden.message}: ${path}`);
  }
}

for (const path of ['src/shared/hosts/ZavaOneWebPartBase.ts', 'src/shared/hosts/ZavaOneCopilotComponentBase.tsx']) {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) {
    errors.push(`Missing host lifecycle owner: ${path}.`);
    continue;
  }
  const content = readFileSync(absolutePath, 'utf8');
  if (!content.includes("from 'react-dom/client'")) errors.push(`${path} must import the React 18 client root API.`);
  if (!content.includes('createRoot(')) errors.push(`${path} must create one React root.`);
  if (!content.includes('.unmount()')) errors.push(`${path} must unmount its React root.`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated SPFx GA / React 18 baseline with ${reactPaths.length} allowed application/framework React package paths.`);