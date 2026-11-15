const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');
module.exports = [
  // Generated output is not linted: the local preview bundle, the compiled libraries and the packages.
  { ignores: ['lib/**', 'lib-commonjs/**', 'lib-esm/**', 'lib-dts/**', 'dist/**', 'temp/**', 'release/**', 'sharepoint/**', 'teams/**'] },
  ...spfxProfile, {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parserOptions: { tsconfigRootDir: __dirname, project: './tsconfig.json' } }
  }];
