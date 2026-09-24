/**
 * The connection builder for loop 2 — the ONLY place `auth` is read (todo.md
 * 8.9 Decision 16). Everything downstream gets an SPFI and cannot tell which
 * way it was signed in; the scenarios are identical under both.
 *
 *   auth: "user" (default) — delegated, as a person, through the same Entra app
 *     the PowerShell scripts use. Interactive browser sign-in on a loopback
 *     redirect, which is the flow that app registration already serves for
 *     PnP.PowerShell; the token is cached in the git-ignored
 *     .tenant-token-cache.json, so later runs are silent until it lapses.
 *   auth: "app" — app-only with a certificate (PEM private key + SHA-1
 *     thumbprint). Unattended, CI-able, and proves nothing about what a user may
 *     do: the harness says so on every run.
 *
 * The SPFI is `@pnp/nodejs`'s SPDefault (Node fetch with retry, default
 * headers and parsing) plus one hook that stamps a fresh bearer token on every
 * request, so a token that lapses mid-run is renewed rather than failing.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ConfidentialClientApplication, PublicClientApplication } from '@azure/msal-node';
import { spfi } from '@pnp/sp';
import { SPDefault } from '@pnp/nodejs';
import { COMPONENT_ROOT } from './config.mjs';

export const TOKEN_CACHE = join(COMPONENT_ROOT, '.tenant-token-cache.json');

/** What an app-mode run cannot prove. Printed by the runner and by the suite. */
export const APP_MODE_WARNING =
  'auth is "app": this run signs in as the app, not as a person. A pass says nothing about user ' +
  'permissions — in particular it does NOT prove the filing user can recycle files (the delete ' +
  'prerequisite, Decision 7). Run with "auth": "user" as a filing user for that.';

const cachePlugin = {
  async beforeCacheAccess(context) {
    if (existsSync(TOKEN_CACHE)) context.tokenCache.deserialize(readFileSync(TOKEN_CACHE, 'utf8'));
  },
  async afterCacheAccess(context) {
    if (context.cacheHasChanged) writeFileSync(TOKEN_CACHE, context.tokenCache.serialize(), { mode: 0o600 });
  }
};

function openBrowser(url) {
  console.log(`\nSign in to the tenant in the browser window that opened. If none did, open:\n  ${url}\n`);
  const [command, args] =
    process.platform === 'win32'
      ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
      : [process.platform === 'darwin' ? 'open' : 'xdg-open', [url]];
  try {
    spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
  } catch {
    // The URL is printed above; a missing opener is not a failure.
  }
  return Promise.resolve();
}

/**
 * A function that resolves an access token for the configured site. With
 * `interactive: false` (inside Jest) a user-mode run that has no cached sign-in
 * fails with instructions instead of opening a browser from a test worker.
 */
export function tokenSource(config, { interactive }) {
  const authority = `https://login.microsoftonline.com/${config.tenantId}`;
  const scopes = [`${new URL(config.sharepoint.siteUrl).origin}/.default`];

  if (config.auth === 'app') {
    const app = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority,
        clientCertificate: {
          thumbprint: config.certificateThumbprint,
          privateKey: readFileSync(config.certificatePath, 'utf8')
        }
      }
    });
    return async () => (await app.acquireTokenByClientCredential({ scopes })).accessToken;
  }

  const app = new PublicClientApplication({ auth: { clientId: config.clientId, authority }, cache: { cachePlugin } });
  return async () => {
    const accounts = await app.getTokenCache().getAllAccounts();
    if (accounts.length > 0) {
      try {
        return (await app.acquireTokenSilent({ account: accounts[0], scopes })).accessToken;
      } catch {
        // Expired beyond refresh, or consent changed: fall through to a prompt.
      }
    }
    if (!interactive) {
      throw new Error(
        'No usable cached sign-in. Start loop 2 with `npm run test:tenant`, which signs in before the ' +
          'suite runs; the tenant Jest project is not meant to be started on its own.'
      );
    }
    const result = await app.acquireTokenInteractive({
      scopes,
      openBrowser,
      successTemplate: 'Signed in. You can close this tab and return to the terminal.',
      errorTemplate: 'Sign-in failed: {error}. Return to the terminal for details.'
    });
    return result.accessToken;
  };
}

/** Stamps a token from `getToken` on every request. */
function AccessToken(getToken) {
  return instance => {
    instance.on.auth.replace(async function (url, init) {
      init.headers = { ...init.headers, Authorization: `Bearer ${await getToken()}` };
      return [url, init];
    });
    return instance;
  };
}

/**
 * An SPFI on the configured site. `behaviors` are appended after the defaults,
 * which is how a scenario injects a fault into an otherwise real connection.
 */
export function connect(config, { interactive = false, behaviors = [] } = {}) {
  const getToken = tokenSource(config, { interactive });
  return spfi(config.sharepoint.siteUrl).using(SPDefault(), AccessToken(getToken), ...behaviors);
}
