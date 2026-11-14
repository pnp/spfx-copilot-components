/**
 * Reads tenant.local.json for loop 2 (todo.md 8.9 N1). The Node twin of
 * scripts/TenantConfig.ps1: same file, same rule that a value still holding the
 * example's placeholder counts as unset.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

export const COMPONENT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LOCAL_CONFIG = join(COMPONENT_ROOT, 'tenant.local.json');

const ZERO_GUID = '00000000-0000-0000-0000-000000000000';

function pick(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v === '' || v.includes('<') || v === ZERO_GUID ? undefined : v;
}

/**
 * `undefined` when there is no tenant.local.json; otherwise the values, with
 * every problem that would stop a run collected in `problems` rather than
 * thrown one at a time.
 */
export function readTenantConfig(path = LOCAL_CONFIG) {
  if (!existsSync(path)) return undefined;
  let json;
  try {
    json = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return { path, problems: [`${path} is not valid JSON (${e.message})`] };
  }

  const config = {
    path,
    tenantId: pick(json.tenantId),
    clientId: pick(json.clientId) ?? pick(process.env.PNP_CLIENT_ID),
    auth: pick(json.auth) ?? 'user',
    certificatePath: pick(json.certificatePath),
    certificateThumbprint: pick(json.certificateThumbprint),
    store: pick(json.store) ?? 'sharepoint',
    sharepoint: {
      siteUrl: pick(json.sharepoint?.siteUrl)?.replace(/\/+$/, ''),
      libraryName: pick(json.sharepoint?.libraryName) ?? 'Records'
    },
    filingUsers: (Array.isArray(json.filingUsers) ? json.filingUsers : []).map(pick).filter(Boolean),
    problems: []
  };

  const need = (value, field) => {
    if (!value) config.problems.push(`${field} is empty or still the example placeholder`);
  };
  need(config.tenantId, 'tenantId');
  need(config.clientId, 'clientId (and PNP_CLIENT_ID is not set)');
  if (config.auth !== 'user' && config.auth !== 'app') {
    config.problems.push(`auth is "${config.auth}"; it must be "user" or "app"`);
  }
  if (config.auth === 'app') {
    need(config.certificatePath, 'certificatePath (auth is "app")');
    need(config.certificateThumbprint, 'certificateThumbprint (auth is "app")');
    if (config.certificatePath) config.certificatePath = resolve(COMPONENT_ROOT, config.certificatePath);
  }
  if (config.store === 'sharepoint') {
    need(config.sharepoint.siteUrl, 'sharepoint.siteUrl');
  } else {
    config.problems.push(`store is "${config.store}"; test:tenant has contract scenarios for "sharepoint" only`);
  }
  return config;
}
