import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: [
      'src/features/assessment/**/*.test.ts',
      'src/features/career/tests/**/*.test.ts',
      'src/features/roadmap/**/*.test.ts',
      'tests/unit/e2e-simulation.test.ts',
      'tests/unit/phase1-pipeline.test.ts',
      'tests/unit/riasec-converter.test.ts',
    ],
    exclude: [
      'tests/e2e/**',
      'tests/golden/**',
      'tests/integration/**',
      'src/features/career/actions/matching-engine.test.ts',
      'tests/unit/features/university-recommendation.test.ts',
    ],
  },
})
