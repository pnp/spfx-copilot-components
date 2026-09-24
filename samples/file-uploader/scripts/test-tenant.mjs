#!/usr/bin/env node
/**
 * `npm run test:tenant` — loop 2 (todo.md 8.9 N3). Runs the store contract and
 * the SharePoint platform checks against the tenant named in tenant.local.json.
 * Never part of `npm run build`.
 *
 *   1. No tenant.local.json -> says so and exits 0: loop 2 is opt-in.
 *   2. Compiles the shipped store from src/ into temp/tenant-lib.
 *   3. Signs in here, where a browser prompt can be answered (auth "user"), or
 *      proves the certificate works (auth "app"), and says which it was.
 *   4. Runs the tenant Jest project under --experimental-vm-modules.
 *
 * Extra arguments go to Jest, e.g. `npm run test:tenant -- -t L4`.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { COMPONENT_ROOT } from '../tenant-tests/config.mjs';
import { APP_MODE_WARNING } from '../tenant-tests/connection.mjs';
import { compileShippedOrExit, configOrExit, newRunId, signInOrExit } from '../tenant-tests/prepare.mjs';

const require = createRequire(import.meta.url);

// 1-3: config (or skip), the shipped store compiled from src/, sign-in.
const config = configOrExit('test:tenant');
compileShippedOrExit('test:tenant');
const identity = await signInOrExit('test:tenant', config);
const runId = newRunId();

console.log(`\nLoop 2 — store "${config.store}" at ${config.sharepoint.siteUrl} / ${config.sharepoint.libraryName}`);
console.log(`Signed in as ${identity}. Run id ${runId} — every file this run writes carries it.`);
if (config.auth === 'app') console.warn(`\nWARNING: ${APP_MODE_WARNING}\n`);

// 4. The suite.
const jest = spawnSync(
  process.execPath,
  [
    '--experimental-vm-modules',
    '--no-warnings=ExperimentalWarning',
    require.resolve('jest/bin/jest'),
    '--config',
    join(COMPONENT_ROOT, 'tenant-tests', 'jest.config.mjs'),
    ...process.argv.slice(2)
  ],
  { stdio: 'inherit', cwd: join(COMPONENT_ROOT, 'tenant-tests'), env: { ...process.env, TENANT_RUN_ID: runId } }
);

console.log(
  `\nRun ${runId} as ${identity}. Tags map to todo.md: [L1] [L4]-[L8] are the 8.8 Stage B items;` +
    '\n[Deferred] is the "Verify on the first live run" line.' +
    (config.auth === 'app' ? `\nReminder: ${APP_MODE_WARNING}` : '')
);
process.exit(jest.status ?? 1);
