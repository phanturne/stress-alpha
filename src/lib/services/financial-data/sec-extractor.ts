import { resilientFetch } from "../http-client";
import type { SecFilingItem } from "./types";

export interface SecFilingExcerpts {
  commitmentsText?: string;
  customerConcentrationText?: string;
  segmentFootnoteText?: string;
  competitionAndMoatText?: string;
  mdaAndRisksText?: string;
  pressReleaseText?: string;
}

const SEC_HEADERS = {
  "User-Agent": "StressAlphaResearch/1.0 (contact@stressalpha.app)",
  Accept: "text/html,application/xhtml+xml,text/plain",
};

function cleanHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#160;|&nbsp;/gi, " ")
    .replace(/&#8211;|&#8212;/gi, "-")
    .replace(/&#8216;|&#8217;/gi, "'")
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&#58;/gi, ":")
    .replace(/&#64;/gi, "@")
    .replace(/&#8226;|&#149;/gi, "•")
    .replace(/&#59;/gi, ";")
    .replace(/&#47;/gi, "/")
    .replace(/&#34;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Finds an actual Note heading in 10-Q/10-K text while ignoring inline cross-references
 * (such as 'Refer to "Note 14. Commitments and Contingencies"').
 */
function extractNoteSection(
  text: string,
  titlePattern: RegExp,
  maxLength: number
): string | undefined {
  const noteHeadingRegex =
    /Note\s+(\d+)[\s\.\:\–\-]+([A-Z][A-Za-z0-9\s,&\-\(\)\/]{3,90})/g;
  for (const match of text.matchAll(noteHeadingRegex)) {
    const idx = match.index ?? 0;
    const title = match[2] || "";
    if (!titlePattern.test(title)) continue;

    // Skip inline cross-references like 'Refer to "Note 14...' or 'see Note 14...'
    const prefix = text.slice(Math.max(0, idx - 35), idx);
    if (/(?:refer\s+to|see|in)\s*["'“”]?$/i.test(prefix.trim())) {
      continue;
    }
    if (/["“]$/.test(prefix.trim())) {
      continue;
    }

    return text.slice(idx, idx + maxLength);
  }
  return undefined;
}

/**
 * Finds the real MD&A section in a 10-Q/10-K, skipping the Table of Contents entry.
 */
function extractMdaSection(
  text: string,
  maxLength: number
): string | undefined {
  const mdaRegex =
    /Item\s+(?:2|7)[\.\:\s–\-]+Management(?:'|’)?s\s+Discussion\s+and\s+Analysis/gi;
  let fallbackIdx = -1;
  for (const match of text.matchAll(mdaRegex)) {
    const idx = match.index ?? 0;
    if (fallbackIdx === -1) fallbackIdx = idx;
    const windowAfter = text.slice(idx, idx + 300);
    // In the Table of Contents, Item 2/7 is immediately followed by Item 3/7A
    if (/Item\s+(?:3|7A)[\.\:\s–\-]+Quantitative/i.test(windowAfter)) {
      continue;
    }
    return text.slice(idx, idx + maxLength);
  }
  return fallbackIdx !== -1
    ? text.slice(fallbackIdx, fallbackIdx + maxLength)
    : undefined;
}

/**
 * Extracts targeted qualitative and quantitative disclosures from SEC EDGAR 10-Q/10-K and 8-K filings:
 * 1. Off-balance-sheet commitments, purchase obligations, and credit guarantees (Note: Commitments)
 * 2. Segment revenue/margin breakdown & RPO/deferred revenue contract balances (Notes: Segments & Revenue)
 * 3. Customer and geographic concentration percentages
 * 4. 10-K Item 1 Business: Competition, Strategy, IP & Moat durability
 * 5. 8-K Item 2.02 earnings release quotes, Non-GAAP metrics, and forward guidance (+ material strategic 8-Ks)
 */
export async function extractSecFilingExcerpts(
  filings: SecFilingItem[]
): Promise<SecFilingExcerpts> {
  const excerpts: SecFilingExcerpts = {};
  if (!filings || filings.length === 0) return excerpts;

  const tenQ = filings.find((f) => f.form === "10-Q");
  const tenK = filings.find((f) => ["10-K", "20-F"].includes(f.form));
  const primaryPeriodic = tenQ || tenK;
  const eightKs = filings.filter((f) => ["8-K", "6-K"].includes(f.form));

  // 1. Process Primary Periodic Filing (10-Q or 10-K)
  if (primaryPeriodic?.reportUrl) {
    try {
      const res = await resilientFetch(
        primaryPeriodic.reportUrl,
        { headers: SEC_HEADERS },
        { timeoutMs: 25_000 }
      );
      if (res.ok) {
        const html = await res.text();
        const text = cleanHtmlToText(html);

        // A. Commitments and Contingencies (guarantees, supply capacity obligations)
        excerpts.commitmentsText = extractNoteSection(
          text,
          /Commitments|Contingencies|Purchase\s+Obligations|Guarantees/i,
          4500
        );
        if (!excerpts.commitmentsText) {
          const fallbackIdx = text.lastIndexOf("Commitments and Contingencies");
          if (fallbackIdx !== -1) {
            excerpts.commitmentsText = text.slice(
              fallbackIdx,
              fallbackIdx + 4000
            );
          }
        }

        // B. Operating Segments, Disaggregation of Revenue & Contract Liabilities (RPO)
        const segNote = extractNoteSection(
          text,
          /Segment|Geographic\s+Information/i,
          4500
        );
        const revNote = extractNoteSection(
          text,
          /Revenue|Contract\s+Balances|Disaggregation/i,
          4000
        );
        const combinedSegments = [segNote, revNote]
          .filter(Boolean)
          .join("\n\n");
        if (combinedSegments) {
          excerpts.segmentFootnoteText = combinedSegments.slice(0, 7500);
        }

        // C. Customer Concentration (look for explicit % customer disclosures first)
        const custRegex =
          /(?:one|two|three|four|single)\s+(?:direct\s+|end\s+)?customers?\s+(?:individually\s+)?(?:accounted\s+for|represented)|Concentrations\s+We\s+operate|customer\s+concentration/i;
        const custMatch = custRegex.exec(text);
        if (custMatch) {
          excerpts.customerConcentrationText = text.slice(
            Math.max(0, custMatch.index - 100),
            custMatch.index + 2000
          );
        }

        // D. MD&A (skipping Table of Contents)
        excerpts.mdaAndRisksText = extractMdaSection(text, 4500);
      }
    } catch (err) {
      console.warn("⚠️ Warning fetching SEC periodic filing text:", err);
    }
  }

  // 2. Process 10-K for Item 1 Business: Competition, Customers & Moat (if separate from 10-Q or in 10-K)
  if (tenK?.reportUrl) {
    try {
      const res = await resilientFetch(
        tenK.reportUrl,
        { headers: SEC_HEADERS },
        { timeoutMs: 25_000 }
      );
      if (res.ok) {
        const html = await res.text();
        const text = cleanHtmlToText(html);

        // Locate "Competition" section inside Item 1 Business (avoiding TOC)
        const compSnapshots: string[] = [];
        for (const match of text.matchAll(
          /\b(?:Competition|Competitive\s+Strengths|Strategy)\b/g
        )) {
          const idx = match.index ?? 0;
          // Skip Table of Contents in the first 4,000 chars
          if (idx < 4000) continue;
          const after = text.slice(idx, idx + 250);
          if (/Item\s+1A[\.\s]+Risk\s+Factors/i.test(after)) continue;

          compSnapshots.push(text.slice(Math.max(0, idx - 600), idx + 3200));
          if (compSnapshots.length >= 2) break;
        }
        if (compSnapshots.length > 0) {
          excerpts.competitionAndMoatText = compSnapshots
            .join("\n---\n")
            .slice(0, 5000);
        }
      }
    } catch (err) {
      console.warn("⚠️ Warning fetching SEC 10-K competition text:", err);
    }
  }

  // 3. Process 8-K Filings (Prioritize Item 2.02 Earnings Release + concurrent strategic 8-Ks)
  if (eightKs.length > 0) {
    const earnings8k =
      eightKs.find((f) => f.items?.some((it) => it.includes("2.02"))) ||
      eightKs[0];
    const candidate8ks = [earnings8k];
    // Include latest strategic 8-K (e.g. Item 1.01 M&A) if filed on or after the earnings 8-K
    if (
      eightKs[0] &&
      eightKs[0].reportUrl !== earnings8k.reportUrl &&
      eightKs[0].filedDate >= earnings8k.filedDate
    ) {
      candidate8ks.push(eightKs[0]);
    }

    const pressTexts: string[] = [];
    for (const f8k of candidate8ks) {
      if (!f8k?.reportUrl) continue;
      try {
        const res = await resilientFetch(
          f8k.reportUrl,
          { headers: SEC_HEADERS },
          { timeoutMs: 15_000 }
        );
        if (!res.ok) continue;
        const raw8k = await res.text();
        let targetText = raw8k;

        // Check for exhibit link (e.g. lite_ex991xq1fy27.htm, q2fy27pr.htm, ex-99.1)
        const exhibitMatch = raw8k.match(
          /href="([^"]*(?:pr|cfocommentary|ex-99|ex99|ex991)[^"]*\.htm)"/i
        );
        if (exhibitMatch && exhibitMatch[1]) {
          try {
            const exhibitUrl = new URL(
              exhibitMatch[1],
              f8k.reportUrl
            ).toString();
            const exRes = await resilientFetch(
              exhibitUrl,
              { headers: SEC_HEADERS },
              { timeoutMs: 15_000 }
            );
            if (exRes.ok) {
              targetText = await exRes.text();
            }
          } catch {
            // fallback to raw 8-K text
          }
        }

        const cleaned = cleanHtmlToText(targetText);
        pressTexts.push(cleaned.slice(0, 6500));
      } catch (err) {
        console.warn("⚠️ Warning fetching SEC 8-K text:", err);
      }
    }

    if (pressTexts.length > 0) {
      excerpts.pressReleaseText = pressTexts
        .join("\n\n=== ADDITIONAL 8-K ===\n\n")
        .slice(0, 9000);
    }
  }

  return excerpts;
}
