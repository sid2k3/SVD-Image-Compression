// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: 'eslint:recommended',
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
  },
  globals: {
    Module: 'readonly',
  },
  ignorePatterns: ['dist/*', 'node_modules/*', 'public/*'],
}
