import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    testTimeout: 30000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    globalSetup: ["./tests/setup/neon-branch-global.ts"],
    setupFiles: ["./tests/setup/test-env.ts"],
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/lib/**/*.ts"],
    },
  },
});
