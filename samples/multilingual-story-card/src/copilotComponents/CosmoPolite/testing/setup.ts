// Vitest setup for every test file (vitest.config.mts → setupFiles). The SPFx runtime requires
// Microsoft-internal packages that are not on npm. Those requires happen inside node_modules, which
// Vitest leaves to Node, so vi.mock can't reach them: Node's resolver sends them to a stub instead.
// Plus the build-time defines the SPFx webpack config normally injects and the User Timing calls the
// base class makes.

import Module from 'node:module';
import path from 'node:path';

const STUBBED: string[] = [
  '@msinternal/ecs-flight',
  '@msinternal/sp-telemetry',
  '@msinternal/sp-copilot-bridge-internal',
  '@msinternal/odsp-core-bundle',
  '@msinternal/utilities-features',
  '@msinternal/sp-safehtml',
  '@msinternal/ms-graph-v3-bundle',
  '@msinternal/odsp-datasources/lib/interfaces/ISpPageContext',
  '@azure/msal-browser-1p',
  '@azure/msal-browser-legacy-1p'
];
const STUB: string = path.resolve('src/copilotComponents/CosmoPolite/testing/stubModule.cjs');

type Resolve = (request: string, ...rest: unknown[]) => string;
const resolver: { _resolveFilename: Resolve } = Module as unknown as { _resolveFilename: Resolve };
const resolve: Resolve = resolver._resolveFilename;
resolver._resolveFilename = function (request: string, ...rest: unknown[]): string {
  return STUBBED.indexOf(request) !== -1 ? STUB : resolve.call(this, request, ...rest);
};

const g: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
g.DEBUG = false;
g.DEPRECATED_UNIT_TEST = true;
// jsdom's performance has no User Timing; the base class measures init with it.
const perf: Record<string, unknown> = performance as unknown as Record<string, unknown>;
perf.mark = perf.mark || ((): void => undefined);
perf.measure = perf.measure || ((): void => undefined);
