# Stage 4: Market-Reaction Context (Optional)

## Task

Gather historical earnings-reaction data for **{TICKER}** to provide conditional framing. This stage is OPTIONAL — skip if insufficient data is found.

## Search & Retrieval Strategy

1. **Massive Historical Daily Aggregates API** ([Massive Pricing](https://massive.com/pricing)):
   - Query `/v2/aggs/ticker/{TICKER}/range/1/day/{earningsDate-2}/{earningsDate+2}` to accurately extract exact post-earnings day-1 percentage price moves.
2. `"{TICKER} earnings stock reaction history"`
3. `"{TICKER} after hours move earnings {YEAR-1} {YEAR-2}"`
4. `"{TICKER} stock drop capex guidance"` (or other known catalyst)

## Rules

1. **Conditional framing only** — describe what happened under what conditions
   - Good: "When AWS growth decelerated below 20% (Q2 2023), AMZN fell 8% after-hours"
   - Bad: "AMZN will drop 5% if AWS misses"
2. **Never predict** the next reaction
3. Identify the market's revealed sensitivity: what metric/miss/beat size moves the stock most?

## Required Fields

For each historical event:
- Date
- What happened (the trigger)
- Price move (%)
- Context (why the market reacted that way)

Plus a `conditionalFraming` summary that synthesizes the pattern.

## Skip Conditions

If fewer than 3 well-sourced historical events are found, skip this stage entirely. Do not fabricate events from memory — every event must have a verifiable date and source.

## Output

Write `reactions.json` to the run directory conforming to `ReactionsSchema`, OR skip this file.
