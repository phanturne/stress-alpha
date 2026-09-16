# Stage 1c: Wall Street Analyst Consensus & Price Targets

## Task

Extract and synthesize sell-side Wall Street analyst estimates, price target revisions, consensus ratings breakdown, and institutional research notes for **{TICKER}** in the style of **Perplexity Finance**.

## Fast Automated Extraction (Recommended)

Run the dedicated Yahoo Finance extraction script to automatically pull live Street consensus, price target statistics, and all covering brokerages:
```bash
python3 /Users/krding/Projects/stress-alpha/scripts/fetch_analyst_estimates.py {TICKER} reports/{TICKER}-{QUARTER}-{YEAR}-analysis --price {CURRENT_PRICE}
```
This automatically queries Yahoo Finance API via `yfinance`, extracts the full Wall Street consensus breakdown, calculates 52-week price target statistics (Low, Mean, Median, High), aggregates covering brokerages/analysts with prior target adjustments, generates an institutional synthesis narrative, and writes both `analyst-estimates.json` and `analyst-estimates_zh.json` conforming to `AnalystEstimatesSchema`.

## Manual Search Strategy (Fallback or Supplemental)

If manual research or supplementary qualitative synthesis is needed, run at minimum:
1. `"{TICKER} analyst price targets ratings consensus {YEAR}"`
2. `"{TICKER} sell side research notes price target revision post earnings {QUARTER} {YEAR}"`
3. `"{COMPANY} analyst consensus buy hold sell price target high low average"`
4. `"{TICKER} price target raised lowered {QUARTER} {YEAR} Morgan Stanley Goldman Sachs JPMorgan Citigroup"`

## Core Extraction Dimensions

### 1. Consensus Distribution
- **Consensus Rating**: `Strong Buy` | `Moderate Buy` | `Hold` | `Moderate Sell` | `Strong Sell`
- **Total Analysts**: Total number of covering sell-side analysts
- **Bullish Count & %**: Buy / Outperform / Overweight count and percentage
- **Neutral Count & %**: Hold / Neutral / Equal-Weight count and percentage
- **Bearish Count & %**: Sell / Underperform / Underweight count and percentage

### 2. 52-Week Price Target Range
- **Current Price**: Reference trading stock price at the time of report
- **Low**: Lowest Street price target
- **Average**: Mean consensus price target across all covering analysts
- **Median**: Median price target (if available)
- **High**: Highest Street price target
- **Currency**: `USD` (or local trading currency)

### 3. Sell-Side Estimates Roster
Gather 6–15 individual sell-side bank/brokerage notes:
- **Firm**: Brokerage / investment bank (e.g. Goldman Sachs, Morgan Stanley, JPMorgan, Citigroup, Bernstein, Mizuho, Needham, UBS, etc.)
- **Analyst**: Named covering analyst
- **Rating**: e.g. `Buy`, `Overweight`, `Outperform`, `Neutral`, `Hold`, `Underweight`, `Sell`
- **Price Target**: 52-week price target ($)
- **Prior Price Target**: Previous price target prior to earnings revision wave (if available)
- **Upside %**: $((PT - Current) / Current) \times 100\%$
- **Date**: Date of note publication (e.g. `Aug 28, 2026`)
- **Action**: `Raised` | `Lowered` | `Reiterated` | `Initiated` | `Upgraded` | `Downgraded`
- **Notes**: 1-sentence synopsis of the core analyst thesis / revision rationale

### 4. Institutional Ratings Synthesis Narrative
Provide a comprehensive 1–2 paragraph executive synthesis summarizing:
- Post-earnings revision wave direction (e.g. broad-based target increases vs. multiple compression)
- Key consensus catalysts cited by sell-side desks
- Street high vs. Street low dispersion drivers (what bull vs. bear analysts are modeling differently)
- Valuation multiple expectations and EPS revisions

## Output Format

Write `analyst-estimates.json` and `analyst-estimates_zh.json` into the report directory conforming to `AnalystEstimatesSchema`:

```json
{
  "ticker": "{TICKER}",
  "asOfDate": "YYYY-MM-DD",
  "consensus": {
    "consensus": "Strong Buy",
    "totalAnalysts": 26,
    "bullishCount": 26,
    "bullishPct": 100.0,
    "neutralCount": 0,
    "neutralPct": 0.0,
    "bearishCount": 0,
    "bearishPct": 0.0
  },
  "priceTargets": {
    "currentPrice": 212.17,
    "low": 275.00,
    "average": 347.81,
    "median": 320.00,
    "high": 515.00,
    "currency": "USD"
  },
  "synthesisNarrative": "Executive narrative summarizing sell-side sentiment...",
  "estimates": [
    {
      "firm": "Rosenblatt Securities",
      "analyst": "Kevin Cassidy",
      "rating": "Buy",
      "priceTarget": 390.00,
      "priorPriceTarget": 280.00,
      "upsidePct": 83.8,
      "date": "Aug 28, 2026",
      "action": "Raised",
      "notes": "Highlights Blackwell ramp velocity and multi-year architecture advantages."
    }
  ],
  "sources": [
    {
      "title": "NVIDIA Q2 FY2027 Post-Earnings Wall Street Research Consensus Digest",
      "publisher": "Perplexity Finance / Bloomberg Consensus",
      "url": "https://www.perplexity.ai/finance/{TICKER}",
      "date": "YYYY-MM-DD"
    }
  ]
}
```
