import { inject } from "vitest";

// Injected from tests/setup/neon-branch-global.ts
const testDatabaseUrl = inject("testDatabaseUrl" as never) as
  string | undefined;
const isTestBranch = inject("isTestBranch" as never) as boolean | undefined;

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
}

if (isTestBranch) {
  process.env.IS_TEST_BRANCH = "true";
}
