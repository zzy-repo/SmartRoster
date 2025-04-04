import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/server/**/*.test.{js,mjs,ts}'],
    exclude: ['node_modules', 'dist'],
  },
})
