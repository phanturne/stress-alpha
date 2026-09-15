# Stage 0C: Earnings Call Sentiment Analysis

## Task

Extract sentiment signals from **{TICKER}**'s most recent earnings call transcript. Focus on management tone, analyst concern patterns, and forward-looking language that reveals confidence levels not captured in the numbers.

## Retrieval

1. Search: `"{COMPANY} earnings call transcript {QUARTER} {YEAR}"`
2. Search: `"{COMPANY} earnings call highlights analyst questions {QUARTER} {YEAR}"`
3. Search: `"{TICKER} CEO comments guidance confidence {QUARTER}"`

## Extraction Framework

### A. Management Tone (Prepared Remarks)

Score each dimension 1–5 (1=defensive/evasive, 5=confident/specific):

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Specificity** | ? | Are they giving concrete numbers or vague "momentum" language? |
| **Forward confidence** | ? | "We expect" vs "we hope" vs "headwinds may impact" |
| **Capex justification** | ? | Do they quantify ROI or just cite "demand"? |
| **Competitive positioning** | ? | Naming competitors or dismissing them? |
| **Risk acknowledgment** | ? | Addressing known risks proactively or deflecting? |

### B. Analyst Q&A Pattern Analysis

Analysts ask about what worries the market. Track:

1. **Most-asked topics** (ranked by frequency): What did multiple analysts probe?
2. **Dodged questions**: Where did management pivot away or give non-answers?
3. **Surprising questions**: Anything unexpected that signals a new concern?
4. **Management defensiveness**: Any moment where tone shifted to justify/defend?

### C. Key Quotes

Extract 3–5 direct quotes that are most informative for the scenario/catalyst stages:
- The strongest forward-looking commitment
- The most hedged/cautious statement
- Any quote that moved the stock after-hours (if identifiable)

### D. Sentiment Delta

Compare to PRIOR quarter's call tone:
- More confident or less?
- New topics introduced?
- Topics conspicuously absent that were discussed before?

## Scoring Summary

Produce an overall **management confidence score** (1–10) and **market concern alignment score** (how well management addressed what analysts were worried about, 1–10).

## Output Format

Write `earnings-sentiment.json` to the run directory:

```json
{
  "ticker": "{TICKER}",
  "quarter": "{QUARTER} {YEAR}",
  "callDate": "YYYY-MM-DD",
  
  "managementTone": {
    "specificity": 4,
    "forwardConfidence": 4,
    "capexJustification": 5,
    "competitivePositioning": 3,
    "riskAcknowledgment": 3,
    "overallConfidence": 7,
    "evidenceNotes": "Jassy provided granular AWS ROI data but deflected FTC questions"
  },
  
  "analystConcerns": {
    "topTopics": [
      {"topic": "capex sustainability", "frequency": 5, "managementResponse": "strong"},
      {"topic": "FCF timeline", "frequency": 3, "managementResponse": "hedged"}
    ],
    "dodgedQuestions": ["specific FTC remedy scenarios"],
    "surprisingQuestions": ["Anthropic valuation dependency"],
    "newConcernsVsPrior": ["memory cost inflation not discussed last quarter"]
  },
  
  "keyQuotes": [
    {
      "speaker": "Andy Jassy",
      "quote": "We have a clear line of sight to strong financial returns",
      "context": "Responding to capex ROI question",
      "sentiment": "bullish",
      "reliability": "high — backed by specific backlog data"
    }
  ],
  
  "sentimentDelta": {
    "vsLastQuarter": "more confident",
    "newTopics": ["AI revenue annualized run rate disclosed for first time"],
    "droppedTopics": [],
    "note": "First time management quantified AI-specific revenue ($25B ARR)"
  },
  
  "scores": {
    "managementConfidence": 7,
    "marketConcernAlignment": 6,
    "summary": "Management convincingly addressed capex ROI but left FCF timeline vague"
  },
  
  "sources": [{"url": "...", "title": "...", "date": "..."}]
}
```

## How This Feeds Downstream

- **Stage 2 (Catalysts)**: Analyst concern frequency → probability anchoring. If 5/8 analysts asked about capex, the market is pricing that as a live risk.
- **Stage 3 (Scenarios)**: Management confidence score informs base-case weighting. A hedged, evasive call tilts probability toward bear.
- **Stage 4 (Reactions)**: Tone + stock move correlation — did the market react to what was said or what was avoided?

## Fallback

If no transcript is accessible, use earnings call highlight articles (search result 2–3). Score with lower confidence and note `"transcriptAccess": "indirect"`. The pipeline continues either way.
