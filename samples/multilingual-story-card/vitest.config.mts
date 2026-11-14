// Unit tests, preview pages and the pattern catalog run on Vitest, straight from the TypeScript
// sources. Heft only builds, lints and packages the shipping code (tsconfig.json leaves the tests
// out); tsconfig.test.json type-checks the tests. Run after `heft build`: the stylesheet tests and
// the preview read the compiled *.module.scss.css from lib/.

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const SP: string = fileURLToPath(new URL('./node_modules/@microsoft/sp-copilot-component/lib-commonjs/', import.meta.url));

// `vitest run --mode preview` (npm run preview) also writes the preview pages and the pattern
// catalog; a mode instead of an inline env variable, so the script runs in Windows cmd too.
export default defineConfig(({ mode }) => ({
  resolve: {
    // The SPFx runtime in its CommonJS build: Node loads it with require(), so the Microsoft-internal
    // packages it requires reach the stub in testing/setup.ts (the ESM build would go through Vite's
    // resolver, which can't find them).
    alias: [
      { find: /^@microsoft\/sp-copilot-component\/dist\/test-api$/, replacement: `${SP}test-api/index.js` },
      { find: /^@microsoft\/sp-copilot-component$/, replacement: `${SP}index.js` }
    ]
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/copilotComponents/CosmoPolite/testing/setup.ts'],
    // Stylesheets are not processed: a *.module.scss import is a proxy that returns each class
    // name as written (not hashed), which is what the tests and the static preview pages rely on.
    css: { include: [], modules: { classNameStrategy: 'non-scoped' } },
    testTimeout: 10000,
    env: mode === 'preview' ? { COSMO_PREVIEW: '1' } : {}
  }
}));
