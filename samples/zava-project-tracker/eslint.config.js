const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/default');

module.exports = [
  {
    ignores: ['ux-review/review.js']
  },
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json', './ux-review/tsconfig.json']
      }
    }
  }
];
