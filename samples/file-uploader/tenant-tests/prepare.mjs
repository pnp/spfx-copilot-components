/**
 * What every loop 2 entry point does before it touches the tenant: read the
 * config (or say why it is skipping), compile the shipped store from src/, and
 * sign in where a browser prompt can be answered. Shared by
 * scripts/test-tenant.mjs and scripts/capture-tenant-fixtures.mjs so the two
 * cannot sign in or compile differently.
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { readTenantConfig, LOCAL_CONFIG, COMPONENT_ROOT } from './config.mjs';
import { tokenSource } from './connection.mjs';

const require = createRequire(import.meta.url);

/** The config, or exits: 0 with a message when there is none (opt-in), 1 when it is unusable. */
export function configOrExit(command) {
  const config = readTenantConfig();
  if (!config) {
    console.log(
      `${command} skipped: there is no ${LOCAL_CONFIG}.\n` +
        'It runs against a real tenant and is opt-in. Copy tenant.example.json to tenant.local.json,\n' +
        'fill it in (docs/TENANT-SETUP.md), provision the library, then run this again.'
    );
    process.exit(0);
  }
  if (config.problems.length > 0) {
    console.error(`${command} cannot start — ${config.path}:\n  - ${config.problems.join('\n  - ')}`);
    process.exit(1);
  }
  return config;
}

/** Compiles the shipped store from src/ into temp/tenant-lib (tenant-tests/tsconfig.shipped.json). */
export function compileShippedOrExit(command) {
  const tsc = spawnSync(
    process.execPath,
    [require.resolve('typescript/bin/tsc'), '-p', join(COMPONENT_ROOT, 'tenant-tests', 'tsconfig.shipped.json')],
    { stdio: 'inherit', cwd: COMPONENT_ROOT }
  );
  if (tsc.status !== 0) {
    console.error(`${command}: compiling the shipped store failed (above).`);
    process.exit(tsc.status ?? 1);
  }
}

/** Signs in (interactively if it must) and says as whom. */
export async function signInOrExit(command, config) {
  try {
    const token = await tokenSource(config, { interactive: true })();
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return config.auth === 'app'
      ? `the app ${claims.appid || config.clientId} (app-only)`
      : `${claims.upn || claims.unique_name || claims.name || 'an unnamed user'} (delegated)`;
  } catch (e) {
    console.error(`${command}: sign-in failed (auth "${config.auth}"): ${e.message}`);
    process.exit(1);
  }
}

/** A run id that sorts by time and is unique enough to find a run's files by. */
export function newRunId() {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  return `t${stamp}${Math.random().toString(36).slice(2, 6)}`;
}
