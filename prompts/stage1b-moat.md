# Stage 1b: Economic Moat & Competitor Benchmarking

## Task

Audit the structural defensibility (Economic Moat) of **{TICKER}** and benchmark it head-to-head against 3–5 primary direct competitors and market challengers.

## Retrieval Strategy

1. **Massive Financials & Ratios API** ([Massive Pricing](https://massive.com/pricing)):
   - Query `/stocks/financials/v1/ratios?ticker={PEER}` for direct competitor margins, P/E multiples, and capital structure benchmarking.
2. `"{COMPANY} economic moat competitive advantage rating"`
3. `"{COMPANY} top competitors market share peer comparison {YEAR}"`
4. `"{COMPANY} gross margin vs competitors pricing power"`
5. `"{COMPANY} patents IP pipeline regulatory barrier to entry"`
6. `"{TICKER} vs {PEER_1_TICKER} {PEER_2_TICKER} valuation multiple growth margin"`

## Moat Rating Criteria & Sector-Calibrated Timelines

In modern high-velocity markets (AI architectures, optical/semiconductor design cycles, biopharma patent laws), rigid 20-year and 10-year blanket horizons are often unrealistic. StressAlpha adopts a **modern, sector-velocity-calibrated economic moat framework**:

### 1. Overall Rating Definitions
- **Wide Moat**: Multi-pillar compounding structural barriers insulating return on invested capital above cost of capital ($\text{ROIC} > \text{WACC}$) through the maximum achievable sector lifecycle (typically 12–20+ years for physical/cloud scale and biopharma; or sustained multi-generational architectural dominance in tech).
- **Narrow Moat**: Defensible excess economic returns sustained with high confidence over a 5–10 year horizon, but vulnerable to technological substitution, generational tape-out cycles, or patent cliffs.
- **None**: Commoditized economics or transient advantage mean-reverting to cost of capital within 3–5 years.

### 2. Velocity-Adjusted Durability Calibration Matrix
When assigning `durabilityYears` to each moat pillar, calibrate against sector velocity rather than assuming arbitrary 20-year perpetuity:

| Industry Sector / Asset Archetype | Velocity & Obsolescence Dynamics | Calibrated Durability Horizon | Example |
| :--- | :--- | :---: | :--- |
| **High-Velocity Hardware / AI & Optics** | 2–4 year architecture shifts; tape-out and packaging cycles | **4 – 8 Years** | InP laser diodes, 800G/1.6T transceivers, custom AI ASICs |
| **Enterprise Cloud & Data Workloads** | High data gravitational pull, IAM security, proprietary DBs | **10 – 15 Years** | AWS/Azure hyperscale architectures, ERP migration |
| **Regulated Biopharma & Therapeutics** | Composition of matter patents vs. IRA Medicare price negotiation | **10 – 15 Years** | Tirzepatide (GLP-1/GIP) patent protection through 2039+ |
| **Physical Distribution & Scaled Hubs** | Multi-billion-dollar Capex density, automated robotics networks | **15 – 20+ Years** | Tier-1 national logistics grids, rail/pipeline networks |

## Five Moat Sources Audit (Calibrate `durabilityYears` for Each)

Audit each dimension and assign specific `durabilityYears` reflective of industry velocity:
1. **Intangible Assets**: Patents, trademarks, regulatory approvals (e.g. FDA exclusivity, trade secrets), and brand pricing power.
2. **Switching Costs**: Frictional costs (monetary, operational, data lock-in, clinical training) that deter customers from moving to rivals.
3. **Cost Advantage**: Scale-driven unit manufacturing efficiency, automated process patents, or supply chain vertical integration.
4. **Network Effects**: Value of the platform increases non-linearly as more users/participants join.
   - *Distribution Gatekeeper Audit:* If top-of-funnel discovery or customer acquisition depends heavily on third-party gateways (e.g. search engine referrals, app store gatekeepers, prime contractors), audit whether platform disintermediation or algorithm changes are eroding the network effect. If referral traffic or channel access is deteriorating without offsetting growth in direct channels or pricing power, critically evaluate whether `moatTrend` is `"Narrowing"` or `"Stable"`.
5. **Efficient Scale**: Markets of limited size effectively served by one or a few incumbents, where new entrants would depress market returns below WACC.

## Peer Benchmarking Matrix (Deterministic Quantitative Hydration)

> **CRITICAL GUARDRAIL — NEVER INVENT PEER NUMBERS:**
> All quantitative peer metrics (`marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`) are deterministically fetched and hydrated by TypeScript (`npm run fetch:data`, `fetchPeerBenchmarks`, and `scripts/analyze.ts`).
> The LLM must **NEVER** guess, invent, or alter those numerical fields. Your responsibility is strictly selecting the 3–5 direct competitor `ticker` symbols and authoring the qualitative fields (`name`, `pricingPower`, `productComparison`, and `keyAdvantageOrVulnerability`), keeping all quantitative metrics identical to the deterministic pipeline output in both `moat-competitors.json` and `moat-competitors_zh.json`.

For each of the 3–5 direct peers:
- **Deterministic Quantitative Fields** (hydrated by `fetchPeerBenchmarks` / `analyze.ts` — do NOT guess):
  - `marketCapBillions`, `revenueBillions`, `revenueGrowthPct`, `grossMarginPct`, `operatingMarginPct`, `forwardPe`, `marketSharePct`
- **Qualitative Audit Fields** (authored by LLM):
  - `ticker` & `name`
  - `pricingPower`: `Superior` | `Parity` | `Inferior`
  - `productComparison`: Concise head-to-head product/architecture comparison
  - `keyAdvantageOrVulnerability`: Key structural advantage or vulnerability vs. **{TICKER}**

## Output Format

Write `moat-competitors.json` to the report directory conforming to `MoatCompetitorsSchema`:

```json
{
  "ticker": "{TICKER}",
  "overallMoatRating": "Wide",
  "moatTrend": "Widening",
  "moatSources": [
    {
      "source": "Intangible Assets",
      "strength": "Strong",
      "description": "...",
      "durabilityYears": 15
    }
  ],
  "competitors": [
    {
      "ticker": "PEER",
      "name": "Peer Corp",
      "marketCapBillions": 150.0,
      "revenueBillions": 28.0,
      "revenueGrowthPct": 14.5,
      "grossMarginPct": 78.5,
      "operatingMarginPct": 32.0,
      "forwardPe": 22.5,
      "marketSharePct": 35.0,
      "productComparison": "...",
      "pricingPower": "Parity",
      "keyAdvantageOrVulnerability": "..."
    }
  ],
  "competitiveDynamicsSummary": "...",
  "sources": [{"url": "...", "title": "...", "date": "..."}]
}
```
