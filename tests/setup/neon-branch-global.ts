import {
  createNeonTestBranch,
  type NeonTestBranch,
} from "../helpers/neon-branch";

interface GlobalSetupContext {
  provide: (key: string, value: unknown) => void;
}

let activeBranch: NeonTestBranch | null = null;

export default async function globalSetup({ provide }: GlobalSetupContext) {
  if (process.env.NEON_API_KEY && process.env.NEON_PROJECT_ID) {
    console.log(
      "\n🌿 [Neon Branching] Initializing isolated ephemeral database branch for Vitest..."
    );
    const startTime = Date.now();
    try {
      activeBranch = await createNeonTestBranch();
      if (activeBranch) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(
          `✅ [Neon Branching] Branch '${activeBranch.branchName}' ready in ${elapsed}s (100% production copy-on-write parity)`
        );
        provide("testDatabaseUrl", activeBranch.connectionUri);
        provide("isTestBranch", true);
      }
    } catch (err) {
      console.warn(
        "⚠️ [Neon Branching] Failed to create ephemeral branch. Falling back to default DATABASE_URL:",
        err
      );
    }
  } else {
    console.log(
      "ℹ️ [Neon Branching] NEON_API_KEY or NEON_PROJECT_ID not found. Running tests against standard DATABASE_URL."
    );
  }

  // Teardown function called by Vitest after all tests complete
  return async () => {
    if (activeBranch) {
      console.log(
        `\n🧹 [Neon Branching] Deleting ephemeral branch '${activeBranch.branchName}'...`
      );
      await activeBranch.cleanup();
      console.log("✅ [Neon Branching] Ephemeral branch deleted successfully.");
    }
  };
}
