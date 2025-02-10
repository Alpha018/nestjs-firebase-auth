/** @type {import("eslint").Linter.FlatConfig[]} */
const eslintConfig = [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      '@stylistic/ts': require('@stylistic/eslint-plugin-ts'),
      prettier: require('eslint-plugin-prettier'),
      sonarjs: require('eslint-plugin-sonarjs'),
      security: require('eslint-plugin-security'),
    },
    rules: {
      '@stylistic/ts/semi': 'error',
      '@stylistic/ts/indent': ['error', 2],
      '@stylistic/ts/quotes': ['error', 'single'],
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
    ignores: ['.eslintrc.js', '**/__mocks__/*'],
  },
];

module.exports = eslintConfig;
