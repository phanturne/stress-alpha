# Stage 1: Ingest — Facts Extraction

## Task

Extract structured financial facts from the most recent quarterly earnings for **{TICKER}**.

## Search Strategy

Run at minimum:
1. `"{COMPANY} {QUARTER} earnings results revenue operating income EPS"`
2. `"{TICKER} {QUARTER} guidance outlook analyst estimates"`
3. `"{TICKER} stock price today"`

## Extraction Checklist

- [ ] Revenue (actual vs estimate)
- [ ] Operating income and margin (YoY growth)
- [ ] EPS — headline AND operating (strip one-time items)
- [ ] Segment breakdown (revenue, growth, margin per segment)
- [ ] One-time items identified and quantified
- [ ] Forward guidance (next quarter and/or full year)
- [ ] Current price, market cap, trailing/forward EPS consensus
- [ ] Financial Model Baseline (Cost structure for StressAlpha flow-through):
  - Base gross margin %
  - Fixed OpEx baseline ($B)
  - Effective tax rate %
  - Diluted shares count (B)
  - Upstream exposure drivers (customer concentration %, segment elasticities)

## One-Time Item Rule (Critical)

If headline EPS significantly exceeds consensus (>2x), investigate WHY:
- Mark-to-market gains on investments
- Tax benefits
- Asset sale proceeds
- Legal settlements
- Restructuring charges

Record each in `oneTimeItems` array and compute `epsOperating` by excluding them.

## Output

Write `facts.json` to the run directory conforming to `FactsSchema`.
If constructing a StressAlpha baseline, also provide `stress-baseline.json` conforming to `FinancialModelBaselineSchema`.
