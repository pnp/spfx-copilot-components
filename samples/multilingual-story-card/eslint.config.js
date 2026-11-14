const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/default');

// Tests and their helpers are not part of the component's TypeScript program (tsconfig.json leaves
// them out; Vitest runs them). They are linted against tsconfig.test.json instead.
const TEST_FILES = ['src/**/*.test.ts', 'src/**/testing/**/*.ts'];

module.exports = [
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: TEST_FILES,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  },
  {
    files: TEST_FILES,
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.test.json'
      }
    }
  }
];
