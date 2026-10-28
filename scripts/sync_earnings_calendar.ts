#!/usr/bin/env node
/**
 * Standalone script to query Finnhub's earnings calendar, gate against active coverage universe,
 * scaffold missing quarterly report models, and persist valuations to Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/sync_earnings_calendar.ts [OPTIONS]
 *
 * Options:
 *   --date=YYYY-MM-DD      Specify target earnings reporting date (defaults to today)
 *   --session=bmo|amc      Filter by Before Market Open (bmo) or After Market Close (amc)
 *   --force                Force re-scaffold even if report already exists and is populated
 *   --dry-run              Simulate calendar match without writing to database
 *
 * Examples:
 *   npx tsx scripts/sync_earnings_calendar.ts
 *   npx tsx scripts/sync_earnings_calendar.ts --date=2026-10-19 --session=bmo
 *   npx tsx scripts/sync_earnings_calendar.ts --dry-run
 *   npx tsx scripts/sync_earnings_calendar.ts --date=2026-10-19 --force
 */

import path from "node:path";
import * as dotenv from "dotenv";
import { syncEarningsCalendar } from "../src/lib/services/earnings-calendar";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const args = process.argv.slice(2);
  let date: string | undefined;
  let force = false;
  let dryRun = false;
  let session: "bmo" | "amc" | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--date=")) {
      date = arg.split("=")[1];
    } else if (arg === "--date" && args[i + 1]) {
      date = args[++i];
    } else if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--dry-run" || arg === "-d") {
      dryRun = true;
    } else if (arg.startsWith("--session=")) {
      const s = arg.split("=")[1].toLowerCase();
      if (s === "bmo" || s === "amc") session = s;
    } else if (arg === "--session" && args[i + 1]) {
      const s = args[++i].toLowerCase();
      if (s === "bmo" || s === "amc") session = s;
    }
  }

  const targetDate = date || new Date().toISOString().split("T")[0];

  if (!dryRun && !process.env.DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL is not set. Aborting earnings calendar sync."
    );
    process.exit(1);
  }

  if (!process.env.FINNHUB_API_KEY) {
    console.error(
      "❌ FINNHUB_API_KEY is not configured in environment. Cannot query earnings calendar."
    );
    process.exit(1);
  }

  console.log("\n" + "=".repeat(66));
  console.log(
    "⚡ [StressAlpha Inverted Earnings Calendar & Scaffolding Engine]"
  );
  console.log(` • Target Date:   ${targetDate}`);
  console.log(
    ` • Session:       ${session ? session.toUpperCase() : "ALL (bmo + amc)"}`
  );
  console.log(` • Dry Run:       ${dryRun ? "YES (simulation)" : "NO"}`);
  console.log(` • Force Sync:    ${force ? "YES" : "NO"}`);
  console.log("=".repeat(66) + "\n");

  const result = await syncEarningsCalendar({
    date: targetDate,
    force,
    dryRun,
    session,
  });

  const errorCount = result.results.filter((r) => r.status === "error").length;

  console.log("\n" + "=".repeat(66));
  console.log("📊 [StressAlpha Earnings Calendar Scaffolding Telemetry]");
  console.log(` • Target Date:                      ${targetDate}`);
  console.log(
    ` • Session Scope:                    ${session ? session.toUpperCase() : "ALL (BMO + AMC)"}`
  );
  console.log(
    ` • Execution Mode:                   ${dryRun ? "SIMULATION (Dry-Run)" : "LIVE (Neon DB)"}`
  );
  console.log(` • Total Reporting on Calendar:      ${result.totalOnCalendar}`);
  console.log(` • Matched Coverage Universe:        ${result.matchedUniverse}`);
  console.log(` • Scaffolded Reports:               ${result.scaffolded}`);
  console.log(` • Skipped (Already Populated):      ${result.skipped}`);
  console.log(` • Errors Encountered:               ${errorCount}`);
  console.log("=".repeat(66));

  if (result.results.length > 0) {
    console.log("\n📋 Summary Breakdown:");
    for (const r of result.results) {
      const badge =
        r.status === "scaffolded"
          ? "✅ SCAFFOLDED"
          : r.status === "skipped"
            ? "⏭️  SKIPPED   "
            : "❌ ERROR     ";
      console.log(
        `   ${badge} | [${r.symbol}] ${r.folderSlug}${r.error ? ` - ${r.error}` : ""}`
      );
    }
  }
  console.log("\n");

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("❌ Fatal unhandled exception in sync_earnings_calendar:", err);
  process.exit(1);
});
