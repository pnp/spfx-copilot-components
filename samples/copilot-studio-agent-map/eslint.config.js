const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

// The Agent Map view comes from a project that uses eslint-plugin-react-hooks 7,
// which has the `set-state-in-effect` rule. SPFx uses version 5. This no-op rule
// keeps the original disable comments valid, so the view files can stay unchanged.
const noOpRule = { meta: { type: 'problem', schema: [] }, create: () => ({}) };
const profile = spfxProfile.map((config) => {
  const reactHooks = config.plugins && config.plugins['react-hooks'];
  if (!reactHooks || (reactHooks.rules && reactHooks.rules['set-state-in-effect'])) {
    return config;
  }
  return {
    ...config,
    plugins: {
      ...config.plugins,
      'react-hooks': {
        ...reactHooks,
        rules: { ...reactHooks.rules, 'set-state-in-effect': noOpRule }
      }
    }
  };
});

module.exports = [
  ...profile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  },
  {
    // The Agent Map view and its model code keep the style of the Agent Review MCP App,
    // so these SPFx style rules do not apply. The other code in src/app and
    // src/copilotComponents uses all the SPFx rules.
    files: ['src/app/{agent-map,copilot-studio,tools,widgets}/**/*.{ts,tsx}'],
    linterOptions: {
      // The original disable comments target rules that the newer plugin reports.
      reportUnusedDisableDirectives: 'off'
    },
    rules: {
      '@rushstack/no-new-null': 'off',
      '@rushstack/security/no-unsafe-regexp': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'dot-notation': 'off',
      eqeqeq: 'off',
      'no-control-regex': 'off',
      'no-script-url': 'off',
      'no-useless-concat': 'off',
      'no-void': 'off',
      'require-atomic-updates': 'off'
    }
  }
];
