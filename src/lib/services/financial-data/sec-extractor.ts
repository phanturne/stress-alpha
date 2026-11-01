import { resilientFetch } from "../http-client";
import type { SecFilingItem } from "./types";

export interface SecFilingExcerpts {
  commitmentsText?: string;
  customerConcentrationText?: string;
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
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts targeted qualitative and quantitative disclosures from SEC EDGAR 10-Q/10-K and 8-K filings:
 * 1. Off-balance-sheet commitments, purchase obligations, and credit guarantees
 * 2. Customer and segment concentration percentages
 * 3. 8-K earnings release quotes, segment performance, and guidance
 */
export async function extractSecFilingExcerpts(
  filings: SecFilingItem[]
): Promise<SecFilingExcerpts> {
  const excerpts: SecFilingExcerpts = {};
  if (!filings || filings.length === 0) return excerpts;

  const tenQ = filings.find((f) => ["10-Q", "10-K", "20-F"].includes(f.form));
  const eightK = filings.find((f) => ["8-K", "6-K"].includes(f.form));

  // 1. Process 10-Q / 10-K
  if (tenQ?.reportUrl) {
    try {
      const res = await resilientFetch(
        tenQ.reportUrl,
        { headers: SEC_HEADERS },
        { timeoutMs: 25_000 }
      );
      if (res.ok) {
        const html = await res.text();
        const text = cleanHtmlToText(html);

        // A. Commitments and Contingencies (guarantees, supply capacity obligations)
        const commitRegex =
          /Note\s*(\d+)[\s\.\:\–\-]+(?:Commitments\s+and\s+Contingencies|Commitments|Purchase\s+Obligations)/gi;
        const commitMatch = commitRegex.exec(text);
        if (commitMatch) {
          excerpts.commitmentsText = text.slice(
            commitMatch.index,
            commitMatch.index + 4500
          );
        } else {
          const fallbackIdx = text.search(/Commitments\s+and\s+Contingencies/i);
          if (fallbackIdx !== -1) {
            excerpts.commitmentsText = text.slice(
              fallbackIdx,
              fallbackIdx + 4000
            );
          }
        }

        // B. Customer Concentration
        const custRegex =
          /(?:one|two|three)\s+direct\s+customers?\s+represented|customer\s+concentration|concentration\s+of\s+credit\s+risk/i;
        const custMatch = custRegex.exec(text);
        if (custMatch) {
          excerpts.customerConcentrationText = text.slice(
            Math.max(0, custMatch.index - 50),
            custMatch.index + 1500
          );
        }

        // C. MD&A and Risk Factors
        const mdaIdx = text.search(
          /Item\s+2[\.\s]+Management(?:'|&#8217;)?s\s+Discussion/i
        );
        if (mdaIdx !== -1) {
          excerpts.mdaAndRisksText = text.slice(mdaIdx, mdaIdx + 3000);
        }
      }
    } catch (err) {
      console.warn("⚠️ Warning fetching SEC 10-Q text:", err);
    }
  }

  // 2. Process 8-K (Earnings Press Release & Commentary)
  if (eightK?.reportUrl) {
    try {
      const res = await resilientFetch(
        eightK.reportUrl,
        { headers: SEC_HEADERS },
        { timeoutMs: 15_000 }
      );
      if (res.ok) {
        const raw8k = await res.text();
        let targetText = raw8k;

        // Check for exhibit link (e.g. q2fy27pr.htm, q2fy27cfocommentary.htm, ex-99.1)
        const exhibitMatch = raw8k.match(
          /href="([^"]*(?:pr|cfocommentary|ex-99|ex99)[^"]*\.htm)"/i
        );
        if (exhibitMatch && exhibitMatch[1]) {
          try {
            const exhibitUrl = new URL(
              exhibitMatch[1],
              eightK.reportUrl
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

        const text = cleanHtmlToText(targetText);
        excerpts.pressReleaseText = text.slice(0, 5000);
      }
    } catch (err) {
      console.warn("⚠️ Warning fetching SEC 8-K text:", err);
    }
  }

  return excerpts;
}
