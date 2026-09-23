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
- [ ] **Forensic Governance & Risk Audit (Critical for QPCE)**:
  - `governanceRisk`: `"none" | "low" | "moderate" | "severe"`
  - `accountingFlags`: Array of detected forensic issues (e.g. auditor resignations, internal control material weaknesses, related-party transactions, revenue recognition pull-forwards, late 10-K/10-Q filings)
  - `materialLitigationOrDoj`: Boolean indicating active DOJ, SEC formal investigation, or class-action fraud litigation
- [ ] Financial Model Baseline (Cost structure for StressAlpha flow-through):
  - Base gross margin %
  - Fixed OpEx baseline ($B)
  - Effective tax rate %
  - Diluted shares count (B)
  - Upstream exposure drivers (customer concentration %, segment elasticities)

## One-Time Item Rule (Income Quality Guardrail)

If headline EPS significantly exceeds consensus (>2x), investigate WHY:
- Mark-to-market gains on investments (e.g. ASU 2016-01 paper gains)
- Tax benefits
- Asset sale proceeds
- Legal settlements
- Restructuring charges

Record each in `oneTimeItems` array and compute `epsOperating` by excluding them.

## Governance & Accounting Risk Rule (QPCE Anchor)

Assess company governance rigorously:
- **`severe`**: Independent auditor resignation citing lack of faith in management/internal controls (e.g. EY resigning from SMCI), formal DOJ subpoena, accounting restatements, or short-seller fraud allegations verified by special committees.
- **`moderate`**: Material weaknesses in internal controls reported in 10-K, executive turnover in CFO/CAO, or regulatory inquiries without indictment.
- **`low`**: Minor patent or routine commercial litigation in ordinary course of business.
- **`none`**: Standard clean unqualified audit opinions and robust institutional governance.

## Valuation Archetype & Capital Runway Rule (QPCE Archetype Branching)

Determine the company's valuation archetype and balance sheet runway:
- **`valuationArchetype`**:
  - `"compounder"`: Mature, profitable cash cow (e.g. AAPL, CSCO, MSFT, COST).
  - `"operating_scaler"`: High growth ($\ge 25\%$), gross margins $\ge 60\%$, operating margins inflecting/positive (e.g. RDDT, PLTR, NOW).
  - `"venture_hypergrowth"`: Hyper-growth ($\ge 50\%$) scale-up with operating losses (e.g. ONDS). Requires positive gross margin ($\ge 35\%$) to claim Unit Economics Exemption.
- **Runway & Capital Metrics**:
  - `grossMarginPct`: Extracted GAAP gross margin % (e.g. 52.0 for ONDS, 82.0 for META).
  - `cashAndEquivalentsBillions`: Total cash + short-term marketable securities.
  - `shortTermDebtBillions`: Debt maturing within 12 months.
  - `quarterlyCashBurnBillions`: Quarterly negative operating cash flow / cash burn.
  - `cashRunwayMonths`: Net liquid months of cash remaining ($\tau_{\text{net}} = (\text{cash} - \text{debt}) / (\text{quarterly burn} / 3)$).

## Output

Write `facts.json` to the run directory conforming to `FactsSchema`.
If constructing a StressAlpha baseline, also provide `stress-baseline.json` conforming to `FinancialModelBaselineSchema`.
