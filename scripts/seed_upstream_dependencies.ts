#!/usr/bin/env node
/**
 * Standalone seed script to populate and upsert critical cross-company
 * supply chain relationships into Neon PostgreSQL via Drizzle ORM.
 *
 * Usage:
 *   npx tsx scripts/seed_upstream_dependencies.ts
 */

import * as dotenv from "dotenv";
import { getDb } from "../src/db";
import { upstreamDependenciesTable, tickersTable } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

interface SeedDependency {
  sourceTicker: string;
  targetTicker: string;
  driverId: string;
  driverName: string;
  exposureShare: string;
  elasticity: string;
  notes: string;
}

const CRITICAL_SUPPLY_CHAIN_DEPENDENCIES: SeedDependency[] = [
  {
    sourceTicker: "TSM",
    targetTicker: "NVDA",
    driverId: "advanced-packaging-capex",
    driverName: "TSMC CoWoS Advanced Packaging & 3nm/4nm Foundry Allocation",
    exposureShare: "0.70",
    elasticity: "0.85",
    notes:
      "NVIDIA depends heavily on TSMC CoWoS capacity for Blackwell and Hopper architectures.",
  },
  {
    sourceTicker: "MU",
    targetTicker: "NVDA",
    driverId: "hbm-supply",
    driverName: "Micron HBM3E High-Bandwidth Memory Allocation",
    exposureShare: "0.25",
    elasticity: "0.75",
    notes: "Micron supplies 24GB/36GB HBM3E 8H/12H for Blackwell accelerators.",
  },
  {
    sourceTicker: "TSM",
    targetTicker: "AMD",
    driverId: "advanced-packaging-capex",
    driverName: "TSMC CoWoS & SoIC Packaging Allocation",
    exposureShare: "0.60",
    elasticity: "0.80",
    notes:
      "AMD Instinct MI300/MI350 accelerator manufacturing reliance on TSMC.",
  },
  {
    sourceTicker: "ASML",
    targetTicker: "TSM",
    driverId: "euv-lithography",
    driverName: "ASML EUV Tool Delivery & Fab Tooling Schedule",
    exposureShare: "0.40",
    elasticity: "0.90",
    notes:
      "TSMC relies on ASML High-NA and standard EUV lithography systems for 2nm/3nm expansion.",
  },
];

// Prerequisite company tickers to guarantee foreign key integrity
const PREREQUISITE_TICKERS = [
  {
    ticker: "TSM",
    company: "Taiwan Semiconductor Manufacturing Company Limited",
    sector: "Semiconductors",
    currentPrice: "185.00",
  },
  {
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    sector: "Semiconductors",
    currentPrice: "135.00",
  },
  {
    ticker: "MU",
    company: "Micron Technology, Inc.",
    sector: "Semiconductors",
    currentPrice: "105.00",
  },
  {
    ticker: "AMD",
    company: "Advanced Micro Devices, Inc.",
    sector: "Semiconductors",
    currentPrice: "160.00",
  },
  {
    ticker: "ASML",
    company: "ASML Holding N.V.",
    sector: "Semiconductor Equipment",
    currentPrice: "820.00",
  },
];

async function seedUpstreamDependencies() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL is not configured. Aborting supply chain dependency seed."
    );
    process.exit(1);
  }

  const db = getDb();
  console.log(
    "\n🌐 [StressAlpha Supply Chain Seed] Initializing cross-company dependency graph...\n"
  );

  // 1. Ensure prerequisite tickers exist in tickersTable to satisfy foreign key constraints
  console.log("  Ensuring prerequisite tickers exist in universe...");
  for (const tickerInfo of PREREQUISITE_TICKERS) {
    await db
      .insert(tickersTable)
      .values({
        ticker: tickerInfo.ticker,
        company: tickerInfo.company,
        sector: tickerInfo.sector,
        currentPrice: tickerInfo.currentPrice,
      })
      .onConflictDoNothing();
  }
  console.log("  ✅ Prerequisite tickers verified.\n");

  // 2. Upsert critical supply chain relationships
  console.log(
    `  Upserting ${CRITICAL_SUPPLY_CHAIN_DEPENDENCIES.length} core supply chain dependencies...`
  );

  let successCount = 0;
  for (const dep of CRITICAL_SUPPLY_CHAIN_DEPENDENCIES) {
    const id = `dep_${dep.sourceTicker.toLowerCase()}_${dep.targetTicker.toLowerCase()}_${dep.driverId}`;

    await db
      .insert(upstreamDependenciesTable)
      .values({
        id,
        sourceTicker: dep.sourceTicker,
        targetTicker: dep.targetTicker,
        driverId: dep.driverId,
        driverName: dep.driverName,
        exposureShare: dep.exposureShare,
        elasticity: dep.elasticity,
        notes: dep.notes,
      })
      .onConflictDoUpdate({
        target: [
          upstreamDependenciesTable.sourceTicker,
          upstreamDependenciesTable.targetTicker,
          upstreamDependenciesTable.driverId,
        ],
        set: {
          driverName: dep.driverName,
          exposureShare: dep.exposureShare,
          elasticity: dep.elasticity,
          notes: dep.notes,
        },
      });

    console.log(
      `  🔗 [${dep.sourceTicker.padEnd(4)} ➔ ${dep.targetTicker.padEnd(4)}] ${dep.driverId} (Exposure: ${Number(dep.exposureShare) * 100}%, Elasticity: ${dep.elasticity})`
    );
    console.log(`     "${dep.driverName}"`);
    successCount++;
  }

  console.log(
    `\n✨ Successfully seeded ${successCount} supply chain dependencies into Neon DB.\n`
  );
}

seedUpstreamDependencies().catch((err) => {
  console.error("❌ Fatal error seeding upstream dependencies:", err);
  process.exit(1);
});
