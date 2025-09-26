module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'google',
    'prettier', // This disables rules that conflict with Prettier
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
    '/generated/**/*', // Ignore generated files.
    '/src/shared-generated/**/*', // Ignore shared generated files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'import/no-unresolved': 'off',

    // Disable rules that conflict with Prettier - these are handled by eslint-config-prettier
    indent: 'off',
    'max-len': 'off',
    quotes: 'off',

    // Disable some default rules for TypeScript
    'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
    'no-undef': 'off', // TypeScript handles this
  },
}
