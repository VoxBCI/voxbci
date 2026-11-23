import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Each file boots its own app + temp data dir, so files can run in parallel.
    fileParallelism: true,
  },
});
