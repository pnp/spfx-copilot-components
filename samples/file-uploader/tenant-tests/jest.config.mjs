/**
 * Loop 2's Jest project (todo.md 8.9 N3). Deliberately outside the Heft rig:
 * nothing here is under src/, so `heft test` and `npm run build` never see it
 * and loop 1 stays offline (R10). Started only by `npm run test:tenant`
 * (scripts/test-tenant.mjs), which signs in and compiles the shipped service
 * first.
 *
 * Native ESM (`transform: {}`, run under --experimental-vm-modules), so the
 * ESM-only PnPjs packages load as they are — R36 is about loop 1's static
 * graph, and nothing in loop 1 imports this directory.
 */
export default {
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.test.mjs'],
  testEnvironment: 'node',
  transform: {},
  // One tenant, one library: scenarios run one at a time and in file order.
  maxWorkers: 1,
  testTimeout: 120000,
  verbose: true
};
