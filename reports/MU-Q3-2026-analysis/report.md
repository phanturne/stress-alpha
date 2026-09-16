# Earnings Analysis: MU — Q3 2026

*Analysis date: 2026-09-15 | Report date: 2026-06-25 | Price: $145*

## Summary

| Metric | Value |
|--------|-------|
| Weighted Fair Value | **$155.75** |
| Upside from Current | +7.41% |
| Consensus PT | $175 |
| Verdict | Below consensus ($175) by 11% — more cautious |

## ⚠️ Income Quality Adjustment

Headline EPS $3.32 includes one-time items:

- **CHIPS and Science Act Title IV direct capital grant milestone recognition**: $0.38B (non-operating) — Direct federal and Idaho state capital expenditure grant milestone recognition for Boise and Syracuse megafabs; non-operating capital subsidy inflating GAAP net income.
- **Discrete foreign tax valuation allowance release**: $0.18B (non-operating) — Discrete tax reserve release under deferred tax asset reassessment and international restructuring under ASC 740, inflating GAAP net income.
- **Reversal of lower-of-cost-or-market (LCM) inventory valuation reserve**: $0.12B (operating) — Operating gross margin benefited by $120M (~105 bps) from the recovery and commercial sale of previously written-down legacy 3D NAND wafer inventory.

Operating EPS (adjusted): **$3.03**

## Earnings Breakdown

| Metric | Actual | Estimate | Beat/Miss |
|--------|--------|----------|-----------|
| Revenue | $11.45B | $10.95B | ✅ Beat |
| Op. Income | $4.12B | — | +188% YoY |
| EPS (operating) | $3.03 | $2.85 | ✅ Beat |

### Segments

| Segment | Revenue | Growth | Op. Margin |
|---------|---------|--------|------------|
| Compute and Networking (CNBU) | $5.45B | +85% | 47% |
| Mobile (MBU) | $2.15B | +42% | 27% |
| Embedded (EBU) | $1.45B | +26% | 25% |
| Storage (SBU) | $2.4B | +82% | 26% |

## Catalysts

| # | Catalyst | Dir. | Prob. | Horizon | Anchor |
|---|----------|------|-------|---------|--------|
| 1 | HBM3e & HBM4 Capacity Sold Out Through CY2026/2027 via NVIDIA Blackwell & AMD MI350 Attach | 📈 growth | 90% | near-term | Management confirmed entire calendar 2026 HBM allocation is 100% contracted under binding supply agreements, with over 80% of calendar 2027 capacity already allocated to NVIDIA Blackwell Ultra/Rubin and AMD Instinct platforms. |
| 2 | Surging High-Density Enterprise SSD (D5/QLC) Adoption for AI Inferencing & Data Lakes | 📈 growth | 85% | near-term | Storage Business Unit (SBU) revenue surged 82% YoY to $2.40B as AI hyperscalers replace legacy hard disk drive (HDD) storage with Micron 60TB+ D5/QLC enterprise SSDs for high-throughput model checkpointing and RAG pipelines. |
| 3 | DRAM Blended ASP Expansion & Structurally Constrained Wafer Fab Capacity | 📈 growth | 80% | medium-term | HBM manufacturing consumes roughly 3x the clean wafer capacity of standard DDR5 for equivalent gigabits, creating an industry-wide wafer supply deficit and lifting commodity DRAM blended pricing by mid-to-high single digits sequentially. |
| 4 | PC & Smartphone On-Device AI Memory Content Increases (16GB-32GB DRAM per Device) | 📈 growth | 75% | medium-term | Next-generation generative AI smartphones and Copilot+ PCs mandate a minimum baseline of 16GB LPDDR5X (up from 8GB-12GB), with premium tier systems scaling to 24GB-32GB to accommodate local 7B-13B parameter LLM inference. |
| 5 | Samsung & SK Hynix Competitive HBM Yield Recovery & Packaging Scale Pressure | 📉 risk | 55% | medium-term | Samsung is heavily investing in next-gen packaging and resolving earlier 12-high HBM3e yield hurdles, while SK Hynix retains incumbent market share dominance with TSMC and NVIDIA. |
| 6 | Memory Industry Peak-Cycle CapEx Overbuilding & Fab Expansion Risk | 📉 risk | 40% | long-term | Historical memory cycles show that multi-year price expansions inevitably incentivize excessive cleanroom and wafer capacity build-outs across Boise, Syracuse, Pyeongtaek, and Yongin. |

## 🏰 Economic Moat & Competitor Benchmarking

- **Overall Moat Rating:** **Narrow Moat**
- **Moat Trend:** **Widening**

### Moat Sources

| Moat Source | Strength | Durability | Description |
|-------------|----------|------------|-------------|
| Efficient Scale | Strong | 6 yrs | The global DRAM industry has consolidated into a highly disciplined 3-player oligopoly (Micron, Samsung, SK Hynix) controlling >95% of worldwide production. Constructing a modern sub-10nm DRAM wafer fab requires $15B-$20B in capital expenditure, 3+ years of construction and equipment commissioning, and scarce EUV lithography allocations from ASML. Market participants understand that irrational capacity additions destroy capital returns for all players, sustaining an efficient scale barrier. |
| Cost Advantage | Moderate | 5 yrs | Micron achieved cost parity and bit-density leadership on its 1-beta DRAM node without requiring high-cost EUV tools, and is currently ramping its 1-gamma node utilizing EUV in Hiroshima, Japan and Taichung, Taiwan. Additionally, Micron's in-house monolithic 232-layer and 276-layer 3D NAND architectures enable low-cost bit production for high-density QLC Enterprise SSDs. |
| Intangible Assets | Moderate | 5 yrs | Over 30,000 global patents covering DRAM cell scaling, high-aspect-ratio 3D NAND etch processes, and specialized Through-Silicon Via (TSV) advanced packaging. Proprietary thermal dissipation and circuit architectures enable Micron's 8-high and 12-high HBM3e modules to consume ~30% less power than competing stacks, creating intellectual property differentiation in power-constrained AI datacenters. |
| Switching Costs | Moderate | 4 yrs | While standardized commodity memory has minimal switching costs, high-performance HBM3e and HBM4 architectures require 9-12 months of deep collaborative co-design, electrical qualification, and custom base-die integration with GPU vendors (NVIDIA, AMD) and TSMC CoWoS packaging lines. Once an accelerator platform is validated and deployed in mass production, swapping HBM suppliers mid-cycle is commercially and technically prohibitive. |
| Network Effects | None | 0 yrs | Standardized semiconductor memory components and JEDEC-compliant DRAM/NAND devices do not exhibit user-driven network effects. |

### Competitor Peer Benchmarking

| Peer | Market Cap | Revenue | YoY Growth | Gross Margin | Op. Margin | Forward P/E | Market Share | Pricing Power | Key Advantage / Vulnerability |
|------|------------|---------|------------|--------------|------------|-------------|--------------|---------------|-------------------------------|
| **005930.KS** (Samsung Electronics Co., Ltd.) | $390B | $215B | +24% | 38% | 18.5% | 11.5x | 41% | Superior | Advantage: Unmatched cleanroom footprint, cash reserves, and multi-fab economies of scale in Pyeongtaek and Taylor. Vulnerability: Delayed validation yield cycles for 12-high HBM3e at NVIDIA, allowing Micron and SK Hynix to capture early premium HBM allocations. |
| **000660.KS** (SK Hynix Inc.) | $125B | $48B | +75% | 49% | 38% | 8.5x | 34% | Superior | Advantage: Deepest technical co-design partnership with NVIDIA and TSMC, commanding premier HBM volume share and industry-leading operating profitability. Vulnerability: High single-customer concentration and aggressive capital expenditure needs for the Yongin semiconductor cluster. |
| **WDC** (Western Digital Corporation) | $28B | $15.5B | +28% | 35% | 17% | 10.5x | 14% | Parity | Advantage: Dominant enterprise nearline HDD install base providing complementary hyperscaler cloud storage relationships. Vulnerability: Completely absent from DRAM and HBM, leaving the company exposed strictly to cyclical NAND pricing fluctuations. |
| **285A.T** (Kioxia Holdings Corporation) | $16.5B | $11B | +32% | 32% | 14% | 12x | 13.5% | Inferior | Advantage: Proprietary 3D BiCS Flash stacking IP and cost-shared wafer manufacturing operations at Yokkaichi and Kitakami. Vulnerability: Pure NAND exposure lacking DRAM balance, sub-scale R&D budget relative to Samsung/Micron, and significant historical leverage. |

### Competitive Dynamics Summary

> Micron operates within a rationalized 3-player global DRAM oligopoly alongside Samsung Electronics and SK Hynix, which together control >95% of global market supply. The rapid architectural transition to High-Bandwidth Memory (HBM3e/HBM4) has structurally altered memory dynamics from commoditized cyclical pricing toward high-margin, custom co-engineered accelerators with multi-year supply contracts. Micron's breakthrough in 8-high and 12-high HBM3e offering 30% superior power efficiency has established it as a primary tier-1 supplier alongside SK Hynix. In NAND, where industry consolidation is less complete (Samsung, SK Hynix/Solidigm, Micron, Kioxia, WDC), Micron differentiates via high-density 60TB+ D5/QLC Enterprise SSDs that displace HDDs in AI data centers. Given cyclical capital intensity and rapid 4-6 year technology migration curves, Micron maintains a defensible Narrow Economic Moat with a Widening trend.

## ⚡ StressAlpha Dynamic Valuation Bands & Flow-Through

- **Stressed Diluted EPS:** $12.93
- **Stressed Revenue:** $52.5B
- **Stressed Gross Profit:** $22.84B
- **Stressed Operating Income:** $17.24B
- **Stressed Net Income:** $14.74B
- **Downside to Panic Floor:** -28.66%
- **Market Priced-In Multiple:** 11.21x

| Regime | Multiple | Target Price | Delta vs Current |
|--------|----------|--------------|------------------|
| 🐂 Bull | 15x | $193.95 | +33.76% |
| ⚖️ Base | 12.5x | $161.63 | +11.47% |
| 🚨 Panic | 8x | $103.44 | -28.66% |

## Scenario Analysis

| Scenario | Prob. | Fair Value | Upside |
|----------|-------|------------|--------|
| Bull: AI Memory Supercycle & Structural HBM Moat | 25% | $217 | +49.66% |
| Base: Controlled Disciplined Oligopoly Expansion | 55% | $160 | +10.34% |
| Bear: Cyclical Capex Digestion & Pricing Pressure | 20% | $67.5 | -53.45% |

## Sensitivity Analysis

| Scenario | Parameter | Base → Alt | FV Delta |
|----------|-----------|------------|----------|
| Bull: AI Memory Supercycle & Structural HBM Moat | EPS +10% | 15.5 → 17.05 | +$21.7 |
| Bull: AI Memory Supercycle & Structural HBM Moat | EPS -10% | 15.5 → 13.95 | $-21.7 |
| Bull: AI Memory Supercycle & Structural HBM Moat | Multiple +2 | 14 → 16 | +$31 |
| Bull: AI Memory Supercycle & Structural HBM Moat | Multiple -2 | 14 → 12 | $-31 |
| Base: Controlled Disciplined Oligopoly Expansion | EPS +10% | 12.8 → 14.08 | +$16 |
| Base: Controlled Disciplined Oligopoly Expansion | EPS -10% | 12.8 → 11.52 | $-16 |
| Base: Controlled Disciplined Oligopoly Expansion | Multiple +2 | 12.5 → 14.5 | +$25.6 |
| Base: Controlled Disciplined Oligopoly Expansion | Multiple -2 | 12.5 → 10.5 | $-25.6 |
| Bear: Cyclical Capex Digestion & Pricing Pressure | EPS +10% | 7.5 → 8.25 | +$6.75 |
| Bear: Cyclical Capex Digestion & Pricing Pressure | EPS -10% | 7.5 → 6.75 | $-6.75 |
| Bear: Cyclical Capex Digestion & Pricing Pressure | Multiple +2 | 9 → 11 | +$15 |
| Bear: Cyclical Capex Digestion & Pricing Pressure | Multiple -2 | 9 → 7 | $-15 |

## Historical Reactions

> Micron stock historically stages strong rallies (+6% to +15%) when quarterly gross margin guidance expands sequentially by >300 bps and management confirms tight wafer supply and full-year HBM capacity sellouts. Negative reactions (-3% to -8%) occur when capital expenditure guidance rises faster than operating cash flow, sparking fears of peak-cycle overbuilding, or when consumer PC/smartphone DRAM softness overshadows data center strength.

| Date | Event | Price Move | Context |
|------|-------|------------|---------|
| 2026-06-25 | Q3 FY2026 Earnings Release | +6.8% | Reported revenue of $11.45B (beating $10.95B estimate) and clean operating EPS of $3.03 (beating $2.85 consensus); provided blowout Q4 guidance of $12.50B revenue and guided gross margins to 42.5%. |
| 2026-03-20 | Q2 FY2026 Earnings Release | +8.4% | Confirmed commercial volume shipments of 12-high 36GB HBM3e for NVIDIA Blackwell GB200 systems; full-year calendar 2026 HBM allocation completely sold out. |
| 2025-12-18 | Q1 FY2026 Earnings Release | +4.5% | DRAM blended ASPs climbed 12% QoQ driven by server DDR5 and high-density Enterprise SSD shipments; guided Q2 revenue above street expectations. |
| 2025-09-24 | Q4 FY2025 Earnings Release | +14.7% | Breakout quarter signaling the decisive end of the memory downcycle; gross margins surged back into positive territory at 36.5% with stellar guidance across cloud AI segments. |
| 2025-06-26 | Q3 FY2025 Earnings Release | -3.2% | Delivered solid AI memory revenue, but announcement of an elevated $8.1B FY2025 capex plan triggered temporary investor concerns regarding premature supply additions. |
