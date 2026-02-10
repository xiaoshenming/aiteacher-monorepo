// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const tsParser = require('@typescript-eslint/parser')

export default withNuxt({
  files: ['**/*.vue'],
  languageOptions: {
    parserOptions: {
      parser: tsParser,
    },
  },
}, {
  files: ['app/**/*.ts'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  rules: {
    'no-unused-vars': 'off',
  },
}, {
  rules: {
    // Prevent memory leaks & stack overflow
    'no-constant-condition': 'error',
    'no-unreachable': 'error',
    'no-self-assign': 'error',
    'no-self-compare': 'error',
    'no-unmodified-loop-condition': 'error',

    // Vue best practices
    'vue/no-unused-refs': 'warn',
    'vue/no-unused-properties': ['warn', {
      groups: ['props', 'data', 'computed', 'methods', 'setup'],
    }],

    // Style consistency
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
})
