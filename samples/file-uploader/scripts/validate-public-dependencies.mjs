import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const packagePath = path.join(root, 'package.json');
const lockPath = path.join(root, 'package-lock.json');
const npmrcPath = path.join(root, '.npmrc');
const publicRegistryHost = 'registry.npmjs.org';
const unsupportedSpecPattern = /^(?:file:|git(?:\+|:)|github:|https?:|link:|workspace:)/i;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
  ...packageJson.optionalDependencies
};

for (const [name, specifier] of Object.entries(directDependencies)) {
  assert(
    typeof specifier === 'string' && !unsupportedSpecPattern.test(specifier),
    `${name} uses a non-registry dependency specifier: ${specifier}`
  );

  const lockEntry = packageLock.packages?.[`node_modules/${name}`];
  assert(lockEntry, `${name} is missing from package-lock.json.`);
  assert(lockEntry.resolved, `${name} has no resolved public tarball in package-lock.json.`);
  const resolvedUrl = new URL(lockEntry.resolved);
  assert(
    resolvedUrl.protocol === 'https:' && resolvedUrl.hostname === publicRegistryHost,
    `${name} resolves outside the public npm registry: ${resolvedUrl.hostname}`
  );
}

for (const [packageLocation, lockEntry] of Object.entries(packageLock.packages ?? {})) {
  if (!lockEntry.resolved) {
    continue;
  }

  const resolvedUrl = new URL(lockEntry.resolved);
  assert(
    resolvedUrl.protocol === 'https:' && resolvedUrl.hostname === publicRegistryHost,
    `${packageLocation} resolves outside the public npm registry: ${resolvedUrl.hostname}`
  );
}

if (fs.existsSync(npmrcPath)) {
  const npmrc = fs.readFileSync(npmrcPath, 'utf8');
  assert(
    !/(?:pkgs\.dev\.azure\.com|visualstudio\.com|_authToken\s*=|always-auth\s*=\s*true)/i.test(npmrc),
    '.npmrc contains a private feed or project-scoped authentication setting.'
  );
}

const microsoftPackages = Object.keys(directDependencies).filter((name) =>
  name.startsWith('@microsoft/')
);
console.log(
  `Verified ${Object.keys(directDependencies).length} direct dependencies and the full lockfile against ${publicRegistryHost}; ${microsoftPackages.length} direct @microsoft packages use public tarballs.`
);