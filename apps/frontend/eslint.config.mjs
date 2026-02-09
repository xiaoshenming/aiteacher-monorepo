// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
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
