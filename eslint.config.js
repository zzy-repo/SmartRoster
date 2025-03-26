import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.conda/**',
    'dist/**',
    'node_modules/**',
  ],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error', 'info', 'log'] }],
  },
})
