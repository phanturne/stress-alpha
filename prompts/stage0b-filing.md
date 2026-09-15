# Stage 0B: 10-Q Filing — Targeted Section Extraction

## Task

Download and extract structured insights from **{TICKER}**'s most recent 10-Q filing. This supplements the press-release-based Stage 1 with deeper detail that only the filing contains.

## Retrieval

1. Search: `"{COMPANY} 10-Q {QUARTER} {YEAR} SEC filing site:sec.gov"`
2. Alternative: `"{TICKER} 10-Q {QUARTER} {YEAR} EDGAR"`
3. If direct EDGAR access unavailable, use search to find the filing summary or analyst breakdowns of specific sections.

## Sections to Extract (in priority order)

### Must-extract (always):

| Section | What to look for |
|---------|-----------------|
| **MD&A** (Item 2) | Forward-looking statements, management's explanation of segment performance, known trends, uncommitted guidance language ("we expect", "headwinds") |
| **Risk Factors** (Item 1A) | NEW risks added since prior quarter (diff vs previous filing); risks with updated language suggesting escalation |
| **Revenue disaggregation** (Notes) | Geographic breakdown, contract vs on-demand mix, recurring vs transactional |
| **Commitments & contingencies** (Notes) | Legal proceedings, purchase obligations (e.g., long-term cloud infrastructure contracts, lease commitments) |

### Extract-if-relevant:

| Section | Trigger |
|---------|---------|
| **Debt & financing** | If capex is a key thesis (new issuances, maturity schedule) |
| **Segment detail** | If press release lacked margin or asset detail |
| **Accounting policy changes** | If EPS has unusual items or restatements |
| **Subsequent events** | Anything material after quarter-end |

## Extraction Rules

1. **Do NOT summarize the entire filing** — extract only facts that inform the catalyst/scenario stages
2. **Flag NEW information** — anything that wasn't in the press release or earnings call
3. **Quote exact language** for forward-looking statements (management tone matters)
4. **Diff risk factors** — note which risks are new, removed, or have changed language vs prior quarter

## Output Format

Write `filing-extracts.json` to the run directory:

```json
{
  "ticker": "{TICKER}",
  "filingType": "10-Q",
  "period": "{QUARTER} {YEAR}",
  "filingUrl": "https://...",
  "sections": [
    {
      "section": "MD&A",
      "keyFindings": [
        {
          "finding": "Management disclosed AWS backlog grew to $496B, up from $450B prior quarter",
          "quote": "exact quote if available",
          "implication": "growth | risk | neutral",
          "novelty": "new | updated | unchanged"
        }
      ]
    }
  ],
  "newRiskFactors": [
    {
      "risk": "description",
      "priorLanguage": "what it said before (or 'new')",
      "currentLanguage": "what it says now",
      "severity": "high | medium | low"
    }
  ],
  "purchaseObligations": {
    "totalBillions": 0,
    "within1YearBillions": 0,
    "note": "context"
  },
  "legalProceedings": [
    {
      "case": "FTC v. Amazon",
      "status": "trial scheduled Oct 2026",
      "potentialImpact": "description"
    }
  ],
  "sources": [{"url": "...", "title": "...", "date": "..."}]
}
```

## Fallback

If the actual 10-Q text is not accessible via search tools, extract what's available from analyst summaries of the filing and note `"accessLevel": "indirect"` in the output. The pipeline continues either way — this stage enriches but does not gate subsequent stages.
