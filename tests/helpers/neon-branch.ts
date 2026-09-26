import { createApiClient, EndpointType } from "@neondatabase/api-client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export interface NeonTestBranch {
  branchId: string;
  branchName: string;
  connectionUri: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates an ephemeral copy-on-write branch from Neon PostgreSQL for isolated test execution.
 * Clones the parent branch (defaulting to 'production' or the default branch).
 */
export async function createNeonTestBranch(options?: {
  namePrefix?: string;
  parentBranchId?: string;
  maxStaleAgeMinutes?: number;
}): Promise<NeonTestBranch | null> {
  const apiKey = process.env.NEON_API_KEY;
  const projectId = process.env.NEON_PROJECT_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  const client = createApiClient({ apiKey });
  const prefix = options?.namePrefix ?? "test-vitest";
  const branchName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Best effort: Clean up stale test branches older than 30 minutes
  await cleanupStaleTestBranches(
    client,
    projectId,
    options?.maxStaleAgeMinutes ?? 30
  );

  // Create isolated branch with read-write compute endpoint
  const createRes = await client.createProjectBranch(projectId, {
    branch: {
      name: branchName,
      parent_id: options?.parentBranchId,
    },
    endpoints: [
      {
        type: EndpointType.ReadWrite,
      },
    ],
  });

  const branchId = createRes.data.branch.id;

  // Retrieve the connection URI for the new branch
  const uriRes = await client.getConnectionUri({
    projectId,
    branch_id: branchId,
    database_name: "neondb",
    role_name: "neondb_owner",
  });

  const connectionUri = uriRes.data.uri;

  const cleanup = async () => {
    try {
      await client.deleteProjectBranch({
        projectId,
        branchId,
      });
    } catch (err) {
      console.warn(
        `[Neon Branching] Failed to delete branch ${branchId}:`,
        err
      );
    }
  };

  return {
    branchId,
    branchName,
    connectionUri,
    cleanup,
  };
}

/**
 * Deletes test branches created by this runner that are older than maxStaleAgeMinutes.
 * Prevents exhausting branch quotas in case a previous test process was forcibly killed.
 */
export async function cleanupStaleTestBranches(
  client: ReturnType<typeof createApiClient>,
  projectId: string,
  maxStaleAgeMinutes = 30
): Promise<void> {
  try {
    const res = await client.listProjectBranches({ projectId });
    const now = Date.now();
    const staleThresholdMs = maxStaleAgeMinutes * 60 * 1000;

    for (const branch of res.data.branches) {
      if (
        branch.name.startsWith("test-vitest-") ||
        branch.name.startsWith("test-ephemeral-")
      ) {
        const createdAt = new Date(branch.created_at).getTime();
        if (now - createdAt > staleThresholdMs) {
          try {
            await client.deleteProjectBranch({
              projectId,
              branchId: branch.id,
            });
          } catch {
            // Ignore deletion failures of already-deleted branches
          }
        }
      }
    }
  } catch {
    // Non-critical background cleanup failure should not block tests
  }
}
