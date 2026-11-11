import { getDb } from "../src/db";
import { sql } from "drizzle-orm";
import { valuationRevisionsTable } from "../src/db/schema";

async function cleanupDuplicateRevisions() {
  const db = getDb();
  console.log(
    "🧹 [ValuationRevision Cleanup] Starting database deduplication..."
  );

  // 1. Fix LITE malformed ID to canonical rev-sec-lite-q12027
  const liteUpdate = await db.execute(sql`
    UPDATE valuation_revisions
    SET id = 'rev-sec-lite-q12027',
        headline = 'LITE Q1 2027 Earnings & SEC Filing Model',
        rationale = 'Q1 2027 SEC 10-Q/10-K model valuation (+27.0% vs prior WFV)'
    WHERE id = 'rev-sec-lite-qQ1 20272027';
  `);
  console.log(`✅ [1/3] Updated malformed LITE revision to canonical ID`);

  // 2. Delete the 9 remaining malformed SEC duplicate entries (e.g. rev-sec-crwv-qQ3 20262026)
  const secDelete = await db.execute(sql`
    DELETE FROM valuation_revisions
    WHERE id LIKE 'rev-sec-%-qQ%';
  `);
  console.log(`✅ [2/3] Deleted malformed SEC quarterly duplicates`);

  // 3. Deduplicate news/catalyst revisions by (ticker, headline), keeping the most recent
  const newsDelete = await db.execute(sql`
    DELETE FROM valuation_revisions
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY ticker, headline
                 ORDER BY created_at DESC, id DESC
               ) as rnum
        FROM valuation_revisions
      ) t
      WHERE t.rnum > 1
    );
  `);
  console.log(`✅ [3/3] Pruned duplicate event/news revisions`);

  // 4. Verify post-cleanup state
  const total = await db.execute(sql`
    SELECT COUNT(*) as count FROM valuation_revisions;
  `);
  const remainingDupes = await db.execute(sql`
    SELECT ticker, headline, COUNT(*) as cnt
    FROM valuation_revisions
    GROUP BY ticker, headline
    HAVING COUNT(*) > 1;
  `);

  console.log(
    `\n🎉 [Summary] Total clean revisions remaining: ${total.rows[0].count}`
  );
  console.log(
    `             Remaining duplicate groups: ${remainingDupes.rows.length}`
  );
}

cleanupDuplicateRevisions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  });
