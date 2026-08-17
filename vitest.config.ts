import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // happy-dom over jsdom: markedly faster startup, and we only need it for
    // the handful of component tests. Domain tests need no DOM at all.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    coverage: {
      // Coverage targets the contracts, not the pixels. CONCEPT §37: the goal
      // is confidence that the modular contract holds, not a headline number.
      include: ['src/domain/**', 'src/features/**/lib/**', 'src/features/**/hooks/**'],
    },
  },
})
