# Stage 2: Catalyst Identification

## Task

Enumerate growth and risk catalysts for **{TICKER}** based on the latest earnings, current macro environment, and sector-level dynamics.

## Search Strategy

Run at minimum:
1. `"{TICKER} growth catalysts {YEAR}"`
2. `"{TICKER} risks bear case {YEAR}"` (mandatory — sell-side skews bullish)
3. `"{COMPANY} antitrust regulation {YEAR}"` or other known sector risk
4. `"AI bubble capex overcapacity {YEAR}"` — sector-level narrative risk
5. `"Fed rate cuts 2026 2027 impact tech stocks"` — macro context

## Required Catalyst Categories

Every analysis MUST include at least one catalyst from EACH category:

### Company-Specific
- Segment growth trajectory (acceleration/deceleration)
- Margin expansion/compression
- Management execution (guidance track record, capital allocation)
- Regulatory/legal (antitrust, compliance deadlines)

### Macro / Rates
- Interest rate trajectory (fed funds, 10yr) and impact on multiples
- Consumer spending / recession indicators (relevant for retail/consumer segments)
- Currency effects for international segments
- Credit conditions affecting enterprise IT budgets

### AI / Technology Narrative
- Capex ROI realization timeline — are customers actually seeing returns?
- Open-source model risk (Llama, Mistral, etc. matching frontier at lower cost)
- Hyperscaler capex coordination — if one cuts, does it signal demand saturation?
- AI investment partner risk (e.g., Anthropic valuation sustainability, competitive position vs OpenAI/Google DeepMind)
- Enterprise AI adoption rate vs hype cycle

### Competitive / Sector
- Market share shifts (cloud, ads, retail)
- Competitor strategic moves (Azure, GCP pricing; Temu/Shein in retail)
- Platform shifts that could disintermediate

### Geopolitical
- Export controls (AI chips, cloud infrastructure)
- Data sovereignty regulations
- Trade policy / tariffs on hardware

## Requirements

For each catalyst:
- **Direction**: growth or risk
- **Probability** (0–1): MUST be grounded in evidence, not vibes
  - Good: "65% — $496B backlog provides ~3yr revenue visibility at current run rate"
  - Good: "30% — historically, open-source models close the frontier gap within 12-18 months (GPT-3→Llama timeline), but Anthropic's safety moat adds 6-12mo buffer"
  - Bad: "60% — seems likely"
- **Horizon**: near-term (<6mo), medium-term (6-18mo), long-term (>18mo)
- **Evidence**: at least one concrete fact with source

## Probability Anchoring Techniques

- **Backlog/pipeline coverage**: contracted revenue vs growth assumption
- **Management track record**: has this team delivered on similar guidance before?
- **Base rates**: how often does X happen in this industry/situation?
- **Market-implied**: options pricing, prediction markets, spread data, futures curves
- **Scheduled events**: regulatory timelines, FOMC dates, product launches with confirmed dates
- **Historical analogs**: "last time capex grew >50% YoY for hyperscalers (2021-22), the correction came within 18 months"

## Balance Rule

Include at minimum:
- 3 growth catalysts across at least 2 categories
- 3 risk catalysts across at least 2 categories

If your list is >70% one direction, add another from the minority direction.

## Output

Write `catalysts.json` to the run directory conforming to `CatalystsSchema`.
