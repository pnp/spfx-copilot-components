const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  { ignores: ['ux-review/dist/**'] },
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
