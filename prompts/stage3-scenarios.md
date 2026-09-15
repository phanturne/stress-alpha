# Stage 3: Scenario Construction

## Task

Build a probability-weighted scenario tree (3–5 scenarios) for **{TICKER}** over the next 12 months.

## Scenario Design Rules

1. **Probabilities MUST sum to 1.0** (the engine validates this)
2. **Base case anchors on consensus** — the forward EPS and typical multiple
3. **Bull/bear deviate with explicit reasons** — never just "things go well/badly"
4. Each scenario specifies:
   - Forward EPS for the basis year
   - P/E multiple justified by growth rate, margin trajectory, or comparables
   - Key assumptions (what has to be true for this scenario)
   - Key drivers (which catalysts from Stage 2 dominate)

## Multiple Regimes & Multiple Justification

Define 3 valuation regimes for the StressAlpha engine:
- **Bull Regime**: Peak multiple during market euphoria or multiple expansion
- **Base Regime**: Historical median / normalized multiple
- **Panic Regime**: Crisis or de-rating floor (e.g. rate spike, AI monetization pause, recessionary multiple)

| Growth Profile | Typical Base P/E | Typical Panic P/E | Example |
|---|---|---|---|
| >30% growth, high margins | 28–35x | 18–22x | Hyperscaler in AI buildout |
| 20–30% growth | 24–30x | 16–20x | Cloud/SaaS at scale |
| 10–20% growth | 18–24x | 13–16x | Mature tech |
| <10% growth / value | 12–16x | 9–12x | Retail/hardware |

## Required Fields

```json
{
  "ticker": "{TICKER}",
  "basisYear": "FY{YEAR}",
  "currentPrice": <current>,
  "consensusTarget": <analyst avg>,
  "baseline": {
    "baseRevenueBillions": <FY revenue>,
    "baseGrossMarginPct": <gross margin %>,
    "fixedOpexBillions": <OpEx excluding COGS>,
    "taxRatePct": <effective tax rate>,
    "dilutedSharesBillions": <diluted shares>,
    "multipleRegimes": { "bull": 34, "base": 28, "panic": 18 },
    "upstreamDrivers": [
      {
        "id": "hyperscaler-capex",
        "name": "Hyperscaler Cloud CapEx Growth",
        "exposureShare": 0.35,
        "elasticity": 0.85,
        "defaultShockPct": 0
      }
    ]
  },
  "scenarios": [...]
}
```

*Note: `baseline` can be embedded directly in `scenarios.json` or placed in a dedicated `stress-baseline.json`.*

## DO NOT compute fair values yourself

The engine multiplies `forwardEps × multiple` for standard scenarios and evaluates the full deterministic accounting flow-through (Revenue $\rightarrow$ Gross Profit $\rightarrow$ Operating Income $\rightarrow$ Taxes $\rightarrow$ Shares $\rightarrow$ Stressed EPS $\rightarrow$ Regime Targets). Your job is the assumptions, drivers, and cost parameters, not the arithmetic.

## Output

Write `scenarios.json` (and optionally `stress-baseline.json`) to the run directory conforming to `ScenariosSchema`.
