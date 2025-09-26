import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
// Note: eslint-config-prettier doesn't have flat config support yet, so we manually disable conflicting rules

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      '**/dist/**',
      '.next/**',
      '**/.next/**',
      'out/**',
      '**/out/**',
      'build/**',
      '**/build/**',
      '**/shared-generated/**',
      'shared-generated/**',
      'web/src/shared-generated/**',
      'functions/lib/**',
      'functions/src/shared-generated/**',
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',

      // Disable rules that conflict with Prettier
      indent: 'off',
      'linebreak-style': 'off',
      'max-len': 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'space-before-function-paren': 'off',
      'arrow-parens': 'off',

      // Disable some default rules for TypeScript
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
      'no-undef': 'off', // TypeScript handles this
    },
  },
]
