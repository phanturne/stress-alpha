export type Locale = "en" | "zh";

export interface Translations {
  header: {
    engineTag: string;
    currentPrice: string;
    weightedFairValue: string;
    cleanEps: string;
    fwdEstimate: string;
    cockpit: string;
    memo: string;
    screener: string;
    methodology: string;
    github: string;
    share: string;
    shareTooltip: string;
    exportCard: string;
    exportCardTooltip: string;
    snowflake: string;
    snowflakeTooltip: string;
    linkCopied: string;
    settings: string;
    language: string;
    shortcuts: string;
  };
  selector: {
    selectReport: string;
    availableReports: string;
    noReportsFound: string;
    refreshTitle: string;
    openScreener: string;
  };
  cockpit: {
    title: string;
    reset: string;
    resetTooltip: string;
    snowflakeButton: string;
    snowflakeTooltip: string;
    stressedForwardEps: string;
    cleanOperatingEps: string;
    stressedRev: string;
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
    valuationRegimes: string;
    current: string;
    currentPrice: string;
    weightedFairValue: string;
    wfvShort: string;
    regimes: {
      bull: string;
      base: string;
      bear: string;
      panic: string;
      panicFloorLabel: string;
    };
    asymmetry: {
      upsideToBull: string;
      downsideToPanic: string;
      pricedInMultiple: string;
      asymmetrySkew: string;
    };
    upstreamTitle: string;
    exposure: string;
    elasticity: string;
    accountingTitle: string;
    grossMarginPerturbation: string;
    fixedOpexShift: string;
    metadata: {
      baseRev: string;
      shares: string;
      tax: string;
    };
    guardrail: {
      title: string;
      description: string;
      operatingCleanEps: string;
      operating: string;
      nonOperating: string;
      toggleShow: string;
      toggleHide: string;
      itemsCount: (count: number) => string;
    };
    presets: {
      title: string;
      baseline: string;
      baselineTooltip: string;
      mild: string;
      mildTooltip: string;
      severe: string;
      severeTooltip: string;
    };
    sliderTabs: {
      volume: string;
      margins: string;
      all: string;
    };
  };
  shortcuts: {
    title: string;
    tabSwitch: string;
    resetModel: string;
    toggleMemo: string;
    toggleLang: string;
    exportCard: string;
    openSnowflake: string;
    toggleScreener: string;
    close: string;
  };
  snowflake: {
    title: string;
    subtitle: string;
    badgeTitle: string;
    scoreCardTitle: string;
    totalScore: string;
    outOf30: string;
    viewAudit: string;
    hideAudit: string;
    clickToViewAudit: string;
    modalTitle: string;
    modalSubtitle: string;
    filterAll: string;
    filterByPillar: string;
    passedBadge: string;
    exportCard: string;
    close: string;
    footerNotice: string;
    overallScoreSub: (
      score: number,
      max: number,
      pct: number,
      label: string
    ) => string;
    wfvLabel: string;
    upsideLabel: string;
  };
  priceMeter: {
    title: string;
    current: string;
    panicFloor: string;
    base: string;
    bullRegime: string;
  };
  tabs: {
    valuation: string;
    estimates?: string;
    moat: string;
    segments: string;
    catalysts: string;
    audit: string;
    report: string;
    scenarios?: string;
    sensitivity?: string;
    tone?: string;
    filing?: string;
    reactions?: string;
  };
  estimatesTab: {
    title: string;
    subtitle: string;
    empty: string;
    consensusTitle: string;
    totalAnalysts: string;
    ratingLabel: string;
    bullish: string;
    neutral: string;
    bearish: string;
    priceTargetsTitle: string;
    currentPrice: string;
    targetRange: string;
    low: string;
    average: string;
    median: string;
    high: string;
    avgUpside: string;
    tableTitle: string;
    colFirm: string;
    colAnalyst: string;
    colRating: string;
    colTarget: string;
    colPriorTarget: string;
    colUpside: string;
    colDate: string;
    colAction: string;
    colNotes: string;
    synthesisTitle: string;
    sourcesTitle: string;
    fromPrior: string;
  };
  auditTab: {
    title: string;
    subtitle: string;
    empty: string;
    subTone: string;
    subFiling: string;
    subReactions: string;
  };
  moatTab: {
    title: string;
    subtitle: string;
    empty: string;
    ratingLabel: string;
    trendLabel: string;
    sourcesTitle: string;
    durability: string;
    peersTitle: string;
    dynamicsTitle: string;
    colTicker: string;
    colCompany: string;
    colMarketCap: string;
    colRevenue: string;
    colGrowth: string;
    colGrossMargin: string;
    colOperatingMargin: string;
    colFwdPe: string;
    colShare: string;
    colPricingPower: string;
    colAdvantage: string;
    colVulnerability: string;
  };
  catalystsTab: {
    title: string;
    subtitle: string;
    empty: string;
    countLabel: string;
    growth: string;
    risk: string;
    nearTerm: string;
    mediumTerm: string;
    longTerm: string;
    evidenceTitle: string;
    probabilityWeight: string;
    resetTooltip: string;
  };
  scenariosTab: {
    title: (year: string) => string;
    subtitle: string;
    probMismatch: (pct: number) => string;
    probValid: string;
    wfv: string;
    vsCurrent: string;
    consensusTarget: string;
    implied: string;
    alphaConsensus: string;
    bullishPremium: string;
    discountedSafety: string;
    viewCards: string;
    viewTable: string;
    targetPrice: string;
    weight: string;
    fwdEps: string;
    exitPe: string;
    assumptionsTitle: string;
    sensitivityTitle: string;
    sensitivitySubtitle: string;
    colScenario: string;
    colProbability: string;
    colFwdEps: string;
    colExitPe: string;
    colFairValue: string;
    colUpside: string;
    colAssumptions: string;
  };
  segmentsTab: {
    title: string;
    subtitle: string;
    breakdownTitle: string;
    totalRevenue: string;
    colName: string;
    colRevenue: string;
    colGrowth: string;
    colMargin: string;
    guidanceTitle: string;
    operatingIncomeRange: string;
    revenueRange: string;
  };
  toneTab: {
    title: string;
    subtitle: string;
    empty: string;
    overallConfidence: string;
    behavioralDimensions: string;
    metrics: {
      specificity: string;
      forwardConfidence: string;
      capexJustification: string;
      competitivePositioning: string;
      riskAcknowledgment: string;
    };
    qaFocus: string;
    colTopic: string;
    colMentions: string;
    colResponse: string;
    keyQuotes: string;
    sentimentLabels: {
      bullish: string;
      bearish: string;
      neutral: string;
    };
  };
  filingTab: {
    title: string;
    subtitle: string;
    empty: string;
    newRisksTitle: string;
    newTag: string;
    expandedTag: string;
    findingsTitle: string;
    newBadge: string;
  };
  reactionsTab: {
    title: string;
    subtitle: string;
    empty: string;
    colDate: string;
    colEvent: string;
    colMove: string;
    colContext: string;
  };
  sensitivityTab: {
    title: string;
    subtitle: string;
    empty: string;
    sensitivitySuffix: string;
    deltaFairValue: string;
  };
  memo: {
    backToCockpit: string;
    enMemoBtn: string;
    zhMemoBtn: string;
    printPdf: string;
    committeeMemo: string;
    decisionAudit: string;
    reportDate: string;
    generatedVia: string;
    currentStock: string;
    weightedFairValue: string;
    sec1Title: string;
    sec2Title: string;
    sec3Title: string;
    sec4Title: string;
    secMoatTitle: string;
    secEstimatesTitle?: string;
    sec5Title: string;
    colRegime: string;
    colMultiple: string;
    colStressedEps: string;
    colTargetPrice: string;
    colDelta: string;
    colThesis: string;
    regimeBull: string;
    regimeBase: string;
    regimePanic: string;
    prob: string;
    secSnowflakeTitle: string;
    snowflakeView30: string;
    analystsCount: (count: number) => string;
    bullish: string;
    neutral: string;
    bearish: string;
    targetRange: string;
    colFirm: string;
    colAnalyst: string;
    colRating: string;
    colPriceTarget: string;
    colUpside: string;
    colDate: string;
    targetPriorFrom: string;
  };
  page: {
    loading: string;
    noReportSelected: string;
    noReportDesc: string;
    uploadFolderBtn: string;
    reportTitleZh: string;
    reportTitleEn: string;
    copyBtn: string;
    copiedZh: string;
    copiedEn: string;
    noReportFileZh: string;
    noReportFileEn: string;
    resetSlidersToast: string;
    linkCopiedToast: string;
    customLoadedToast: string;
  };
  uploader: {
    title: string;
    description: string;
    dropzoneTitle: string;
    dropzoneHint: string;
    chooseFolder: string;
    selectFiles: string;
    minFilesError: string;
    schemaError: (msg: string) => string;
  };
  screener: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAll: string;
    filterUndervalued: string;
    filterHighUpside: string;
    allMoats: string;
    wideMoat: string;
    narrowMoat: string;
    colTicker: string;
    colCompany: string;
    colSnowflake: string;
    colMoat: string;
    colPrice: string;
    colAnalystTarget: string;
    colBaseFairValue: string;
    colWeightedFairValue: string;
    colUpside: string;
    colOperatingMargin: string;
    colRevenueGrowth: string;
    colValuationRange: string;
    colAction: string;
    openCockpit: string;
    openMemo: string;
    statsCoverage: string;
    statsAvgUpside: string;
    statsTopPick: string;
    statsWideMoat: string;
    noResults: string;
    resetFilters: string;
    bearLabel: string;
    baseLabel: string;
    bullLabel: string;
    currentPriceLabel: string;
    sortPrompt: string;
    loading: string;
  };
  socialCard: {
    modalTitle: string;
    modalSubtitle: string;
    templates: {
      valuation: string;
      valuationDesc: string;
      earnings: string;
      earningsDesc: string;
      thesis: string;
      thesisDesc: string;
      summary: string;
      summaryDesc: string;
      snowflake: string;
      snowflakeDesc: string;
    };
    sections: {
      valuationHero: string;
      valuationHeroDesc: string;
      regimes: string;
      regimesDesc: string;
      earnings: string;
      earningsDesc: string;
      segments: string;
      segmentsDesc: string;
      moat: string;
      moatDesc: string;
      catalysts: string;
      catalystsDesc: string;
      snowflake: string;
      snowflakeDesc: string;
    };
    presets: {
      label: string;
      custom: string;
    };
    aspectRatios: {
      landscape: string;
      square: string;
      portrait: string;
    };
    themes: {
      cyber: string;
      navy: string;
      emerald: string;
      crimson: string;
    };
    controls: {
      templateLabel: string;
      sectionsLabel: string;
      formatLabel: string;
      themeLabel: string;
      scenarioLinkLabel: string;
      includeStress: string;
      includeWatermark: string;
      customNote: string;
      customNotePlaceholder: string;
      cardLanguage: string;
      liveStressParams: string;
      previewScale: string;
      clear: string;
      defaultNote: (company: string, quarter: string) => string;
    };
    actions: {
      downloadPng: string;
      copyImage: string;
      copyText: string;
      copyLink: string;
      copied: string;
      copiedToast: string;
      textCopiedToast: string;
      linkCopiedToast: string;
      downloadSuccessToast: string;
      exportError: string;
      clipboardError: string;
      generating: string;
      copying: string;
      close: string;
    };
    labels: {
      earningsAuditTag: string;
      tickerLabel: string;
      secAuditVerified: string;
      currentPriceLabel: string;
      weightedFairValueLabel: string;
      riskRewardLabel: string;
      panicDefenseLabel: string;
      marketPricingLabel: string;
      bullRegimeLabel: string;
      baseCaseLabel: string;
      panicFloorLabel: string;
      stressedFwdEpsLabel: string;
      stressedRevLabel: string;
      netIncomeLabel: string;
      earningsBeatLabel: string;
      revenueLabel: string;
      operatingIncomeLabel: string;
      cleanOperatingEpsLabel: string;
      consensusLabel: string;
      beatLabel: string;
      incomeQualityFilterLabel: string;
      marketCapLabel: string;
      nextFyConsensusLabel: string;
      segmentsLabel: string;
      ofTotalRevenueLabel: string;
      valuationUpsideLabel: string;
      weightedFairValueShortLabel: string;
      snowflake30Label: string;
      wfvShortLabel: string;
      upsideShortLabel: string;
      secDisclosuresVerified: string;
      tagline: string;
      auditGrade: string;
      asymmetryLabel: string;
      panicFloorShortLabel: string;
      valuationSpectrumLabel: string;
      financialHighlightsLabel: string;
      moatRatingLabel: string;
      pricedInMultipleLabel: string;
      probLabel: string;
    };
  };
}

export const translations: Record<Locale, Translations> = {
  en: {
    header: {
      engineTag: "ENGINE",
      currentPrice: "PRICE",
      weightedFairValue: "WFV",
      cleanEps: "CLEAN EPS",
      fwdEstimate: "FWD EST",
      cockpit: "Cockpit",
      memo: "Memo",
      screener: "Screener",
      methodology: "Methodology",
      github: "GitHub",
      share: "Share",
      shareTooltip: "Share analysis & export visual cards (E)",
      exportCard: "Card",
      exportCardTooltip: "Export as polished social media card (E)",
      snowflake: "Snowflake",
      snowflakeTooltip: "30-Point Snowflake (W)",
      linkCopied: "Scenario link copied to clipboard!",
      settings: "Settings & Resources",
      language: "Language",
      shortcuts: "Keyboard Shortcuts",
    },
    selector: {
      selectReport: "Select Report...",
      availableReports: "Available Reports",
      noReportsFound: "No reports found under reports/",
      refreshTitle: "Refresh reports folder",
      openScreener: "Open Universe Screener",
    },
    cockpit: {
      title: "Stress Flow-Through Cockpit",
      reset: "Reset All",
      resetTooltip: "Reset all shock sliders to initial baseline values",
      snowflakeButton: "Snowflake",
      snowflakeTooltip: "30-Point Snowflake Audit (W)",
      stressedForwardEps: "Stressed Forward EPS (Annual)",
      cleanOperatingEps: "Clean Operating EPS",
      stressedRev: "Stressed Rev",
      grossProfit: "Gross Profit",
      operatingIncome: "Op. Income",
      netIncome: "Net Income",
      valuationRegimes: "Dynamic Scenario Targets",
      current: "Current",
      currentPrice: "Current Price",
      weightedFairValue: "Weighted Fair Value",
      wfvShort: "WFV",
      regimes: {
        bull: "🐂 Bull",
        base: "⚖️ Base",
        bear: "🐻 Bear",
        panic: "🚨 Panic",
        panicFloorLabel: "Panic Multiple Floor",
      },
      asymmetry: {
        upsideToBull: "Upside to Bull",
        downsideToPanic: "Downside to Panic",
        pricedInMultiple: "Priced-in Multiple",
        asymmetrySkew: "Asymmetry Skew",
      },
      upstreamTitle: "Upstream Demand Shock Sliders",
      exposure: "Exposure",
      elasticity: "Elasticity",
      accountingTitle: "Accounting Margin & Leverage Controls",
      grossMarginPerturbation: "Gross Margin Perturbation",
      fixedOpexShift: "Fixed OpEx Shift",
      metadata: {
        baseRev: "Base Rev",
        shares: "Shares",
        tax: "Tax",
      },
      guardrail: {
        title: "Income Quality Guardrail",
        description:
          "Audited GAAP adjustments isolating non-operating or transitory items:",
        operatingCleanEps: "Operating Clean EPS:",
        operating: "operating",
        nonOperating: "non-operating",
        toggleShow: "Breakdown: Closed",
        toggleHide: "Breakdown: Open",
        itemsCount: (count: number) => `${count} non-operating items adjusted`,
      },
      presets: {
        title: "Macro Presets",
        baseline: "0% Neutral",
        baselineTooltip:
          "Preset: Apply 0% flat baseline across all volume drivers",
        mild: "-10% Strain",
        mildTooltip:
          "Preset: Apply -10% volume strain, -100 bps margin, +2% OpEx",
        severe: "-25% Panic",
        severeTooltip:
          "Preset: Apply -25% severe shock, -300 bps margin, +5% OpEx",
      },
      sliderTabs: {
        volume: "Volume Drivers",
        margins: "Cost & Margins",
        all: "All Controls",
      },
    },
    shortcuts: {
      title: "Keyboard Shortcuts",
      tabSwitch: "Switch Tabs (1–6)",
      resetModel: "Reset Model (R)",
      toggleMemo: "Toggle Cockpit / Memo (M)",
      toggleLang: "Toggle Language (L)",
      exportCard: "Export Social Media Card (E)",
      openSnowflake: "Snowflake Analysis (W)",
      toggleScreener: "Toggle Universe Screener (S)",
      close: "Close Dialog (Esc / ?)",
    },
    snowflake: {
      title: "Snowflake Analysis",
      subtitle:
        "5-Pillar Comprehensive Institutional Quality & Valuation Audit",
      badgeTitle: "30-Point Snowflake",
      scoreCardTitle: "Snowflake Score",
      totalScore: "Total Score",
      outOf30: "out of 30 points",
      viewAudit: "View 30-Point Audit",
      hideAudit: "Hide Audit",
      clickToViewAudit: "Click to view 30-point audit",
      modalTitle: "30-Point Snowflake Audit",
      modalSubtitle:
        "Complete deterministic evaluation across Valuation, Growth, Quality, Moat & Resilience",
      filterAll: "All 30 Points",
      filterByPillar: "Filter by Pillar",
      passedBadge: "Passed",
      exportCard: "Export Card",
      close: "Close (Esc)",
      footerNotice:
        "Deterministic fundamental & stress valuation audit • Zero conjecture",
      overallScoreSub: (
        score: number,
        max: number,
        pct: number,
        label: string
      ) => `Overall Score: ${score}/${max} (${pct}%) • ${label}`,
      wfvLabel: "WFV",
      upsideLabel: "Upside",
    },
    priceMeter: {
      title: "Valuation Meter",
      current: "Current",
      panicFloor: "🚨 Panic Floor",
      base: "⚖️ Base",
      bullRegime: "🐂 Bull Regime",
    },
    tabs: {
      valuation: "Valuation & Scenarios",
      estimates: "Analyst Estimates",
      moat: "Moat & Peers",
      segments: "Segments & Financials",
      catalysts: "Catalysts & Risks",
      audit: "Earnings Audit",
      report: "Raw Filings & Notes",
      scenarios: "Valuation & Scenarios",
      sensitivity: "Sensitivity Heatmap",
      tone: "Management Tone",
      filing: "10-Q Risks",
      reactions: "Historical Reactions",
    },
    estimatesTab: {
      title: "Wall Street Analyst Consensus & Estimates",
      subtitle:
        "Sell-side price targets, ratings distribution, revision dynamics, and consensus synthesis.",
      empty: "No analyst estimates data available for this report.",
      consensusTitle: "Analyst Consensus",
      totalAnalysts: "Total Analysts",
      ratingLabel: "Consensus Rating",
      bullish: "Bullish",
      neutral: "Neutral",
      bearish: "Bearish",
      priceTargetsTitle: "Analyst 52W Price Targets",
      currentPrice: "Current Price",
      targetRange: "Target Range",
      low: "Low",
      average: "Average",
      median: "Median",
      high: "High",
      avgUpside: "Avg Upside",
      tableTitle: "Wall Street Analyst Estimates",
      colFirm: "Firm",
      colAnalyst: "Analyst",
      colRating: "Rating",
      colTarget: "52W Price Target",
      colPriorTarget: "Prior Target",
      colUpside: "Upside",
      colDate: "Date",
      colAction: "Action",
      colNotes: "Notes / Focus",
      synthesisTitle: "Analyst Ratings Synthesis",
      sourcesTitle: "Open Web Research Reports & Sources",
      fromPrior: "from",
    },
    auditTab: {
      title: "Earnings Print & Filing Audit",
      subtitle:
        "Management call tone, 10-Q risk disclosures, and post-earnings historical volatility.",
      empty: "No earnings audit artifacts available for this report.",
      subTone: "Call Tone & Q&A",
      subFiling: "10-Q Risk Deltas",
      subReactions: "Historical Moves",
    },
    moatTab: {
      title: "Economic Moat & Competitor Benchmarking",
      subtitle:
        "Morningstar 5-pillar moat evaluation, durability assessment, and financial benchmarking against core industry peers.",
      empty:
        "No economic moat or competitor benchmarking artifacts available for this report.",
      ratingLabel: "Economic Moat Rating",
      trendLabel: "Moat Trend",
      sourcesTitle: "Moat Source Breakdown",
      durability: "Durability",
      peersTitle: "Head-to-Head Competitor Benchmarking",
      dynamicsTitle: "Strategic Competitive Dynamics & Industry Structure",
      colTicker: "Ticker",
      colCompany: "Company",
      colMarketCap: "Market Cap",
      colRevenue: "Revenue / YoY",
      colGrowth: "YoY Growth",
      colGrossMargin: "Gross Margin",
      colOperatingMargin: "Operating Margin",
      colFwdPe: "FWD P/E",
      colShare: "Market Share",
      colPricingPower: "Pricing Power",
      colAdvantage: "Key Advantage",
      colVulnerability: "Key Vulnerability",
    },
    catalystsTab: {
      title: "Qualitative Filing Catalysts & Probability Anchors",
      subtitle:
        "Key operational drivers extracted from SEC disclosures and earnings calls. Adjust sliders to test thesis sensitivity.",
      empty: "No catalyst audit artifacts available for this report.",
      countLabel: "Catalysts",
      growth: "growth",
      risk: "risk",
      nearTerm: "near-term",
      mediumTerm: "medium-term",
      longTerm: "long-term",
      evidenceTitle: "Documented Evidence & Audit Notes",
      probabilityWeight: "Probability Weight:",
      resetTooltip: "Reset to original weight",
    },
    scenariosTab: {
      title: (year: string) => `Scenario Probability Tree (${year})`,
      subtitle:
        "Deterministic valuation matrix. Edit probabilities, forward EPS, or exit multiples inline for instant recalculation.",
      probMismatch: (pct: number) =>
        `Probabilities sum to ${pct}% (should be 100%)`,
      probValid: "100% Probability Distributed",
      wfv: "Weighted Fair Value",
      vsCurrent: "vs current",
      consensusTarget: "Consensus Price Target",
      implied: "implied",
      alphaConsensus: "Alpha vs Consensus",
      bullishPremium: "Bullish premium",
      discountedSafety: "Discounted safety",
      viewCards: "Scenario Columns",
      viewTable: "Dense Table",
      targetPrice: "Target Price",
      weight: "Probability Weight",
      fwdEps: "FWD EPS",
      exitPe: "Exit P/E",
      assumptionsTitle: "Key Assumptions & Drivers",
      sensitivityTitle: "Scenario Sensitivity Analysis",
      sensitivitySubtitle:
        "Estimated Fair Value flex across key parameter variations",
      colScenario: "Scenario",
      colProbability: "Probability",
      colFwdEps: "FWD EPS",
      colExitPe: "Exit P/E",
      colFairValue: "Fair Value Target",
      colUpside: "Upside",
      colAssumptions: "Key Assumptions",
    },
    segmentsTab: {
      title: "Operational Segments & Management Guidance",
      subtitle:
        "Audited unit economics, business unit growth velocities, and forward guidance ranges.",
      breakdownTitle: "Revenue Contribution Breakdown",
      totalRevenue: "Total Segment Revenue",
      colName: "Segment Name",
      colRevenue: "Revenue",
      colGrowth: "YoY Growth",
      colMargin: "Operating Margin",
      guidanceTitle: "Executive Forward Guidance Summary",
      operatingIncomeRange: "Operating Income Guidance Range",
      revenueRange: "Revenue Guidance Range",
    },
    toneTab: {
      title: "Management Tone & Earnings Call Sentiment Audit",
      subtitle:
        "Audited qualitative signals, executive confidence metrics, analyst concern frequencies, and high-impact quotes.",
      empty: "No earnings call sentiment data available for this report.",
      overallConfidence: "Overall Executive Confidence",
      behavioralDimensions: "Executive Behavioral Dimensions (1-5 Scale)",
      metrics: {
        specificity: "Specificity",
        forwardConfidence: "Forward Confidence",
        capexJustification: "CapEx Justification",
        competitivePositioning: "Competitive Positioning",
        riskAcknowledgment: "Risk Acknowledgment",
      },
      qaFocus: "Analyst Q&A Focus & Executive Responses",
      colTopic: "Topic",
      colMentions: "Mentions",
      colResponse: "Executive Response",
      keyQuotes: "Key Executive Quotes",
      sentimentLabels: {
        bullish: "bullish",
        bearish: "bearish",
        neutral: "neutral",
      },
    },
    filingTab: {
      title: "SEC 10-Q Filing Audit & Escalated Disclosures",
      subtitle:
        "Diff audit against previous regulatory filings highlighting novel disclosures and modified legal risk factors.",
      empty: "No SEC 10-Q filing extract artifacts available for this report.",
      newRisksTitle: "New / Escalated Risk Disclosures",
      newTag: "⚡ Newly added this filing period",
      expandedTag: "Language expanded from previous quarter",
      findingsTitle: "Key Section Extractions & Findings",
      newBadge: "NEW",
    },
    reactionsTab: {
      title: "Historical Earnings Market Reactions & Framing",
      subtitle:
        "Empirical post-earnings 1-day price reaction history and conditional catalyst framing.",
      empty: "No historical earnings reactions data available for this report.",
      colDate: "Report Date",
      colEvent: "Event / Quarter",
      colMove: "Day 1 Move",
      colContext: "Context & Primary Driver",
    },
    sensitivityTab: {
      title: "Valuation Sensitivity & Perturbation Matrix",
      subtitle:
        "Isolated dollar impact on scenario fair value per incremental shift in fundamental parameters.",
      empty: "No sensitivity matrix data available for this report.",
      sensitivitySuffix: "Sensitivity",
      deltaFairValue: "Δ Target Fair Value",
    },
    memo: {
      backToCockpit: "Back to Cockpit",
      enMemoBtn: "English Memo",
      zhMemoBtn: "🇨🇳 中文备忘录",
      printPdf: "Print / Export PDF Memo",
      committeeMemo: "StressAlpha Investment Committee Memorandum",
      decisionAudit: "Decision Audit",
      reportDate: "Report Date",
      generatedVia: "Generated via Deterministic Stress Engine",
      currentStock: "Current Stock",
      weightedFairValue: "Weighted Fair Value",
      sec1Title: "1. Executive Decision Synthesis",
      sec2Title: "2. Valuation Regimes & Stress Flow-Through",
      sec3Title: "3. Income Quality Audit",
      sec4Title: "4. Key Audited Catalysts & Probability Anchors",
      secMoatTitle: "5. Economic Moat & Competitor Benchmarking",
      secEstimatesTitle: "5b. Wall Street Analyst Consensus & Estimates",
      sec5Title: "6. SEC Regulatory Risk Escalations",
      colRegime: "Regime",
      colMultiple: "Multiple",
      colStressedEps: "Stressed EPS",
      colTargetPrice: "Target Price",
      colDelta: "Delta vs Current",
      colThesis: "Core Scenario Thesis",
      regimeBull: "🐂 Bull Regime",
      regimeBase: "⚖️ Base Regime",
      regimePanic: "🚨 Panic Floor",
      prob: "prob",
      secSnowflakeTitle: "30-Point Snowflake Fundamental Audit",
      snowflakeView30: "View 30 Checks",
      analystsCount: (count: number) => `${count} Analysts Covering`,
      bullish: "Bullish",
      neutral: "Neutral",
      bearish: "Bearish",
      targetRange: "52W Range: ",
      colFirm: "Firm",
      colAnalyst: "Analyst",
      colRating: "Rating",
      colPriceTarget: "Price Target",
      colUpside: "Upside",
      colDate: "Date",
      targetPriorFrom: "from",
    },
    page: {
      loading: "Loading StressAlpha Report...",
      noReportSelected: "No Report Selected",
      noReportDesc:
        "Select an earnings analysis report from the dropdown above or upload an analysis folder.",
      uploadFolderBtn: "Upload Analysis Folder",
      reportTitleZh: "中文财报深度研报 (report_zh.md)",
      reportTitleEn: "Equity Markdown Report (report.md)",
      copyBtn: "Copy",
      copiedZh: "中文研报已复制到剪贴板！",
      copiedEn: "Report markdown copied!",
      noReportFileZh: "暂无中文研报文件 (report_zh.md)。",
      noReportFileEn: "No report.md file available in this folder.",
      resetSlidersToast: "Reset all sliders to baseline defaults.",
      linkCopiedToast: "Scenario link copied to clipboard!",
      customLoadedToast: "Custom report loaded successfully!",
    },
    uploader: {
      title: "Upload Analysis Folder",
      description:
        "Drag and drop your analysis folder containing facts.json, scenarios.json, and optional baseline files.",
      dropzoneTitle: "Drag & drop folder or JSON files here",
      dropzoneHint: "Requires facts.json + scenarios.json",
      chooseFolder: "Choose Folder",
      selectFiles: "Select Files",
      minFilesError: "Minimum required files: facts.json and scenarios.json",
      schemaError: (msg: string) => `Schema validation failed: ${msg}`,
    },
    screener: {
      title: "Universe Screener & Valuation Comparison",
      subtitle:
        "Cross-ticker fundamental comparison, stress valuation upside, and economic moat quality across covered equities",
      searchPlaceholder: "Search ticker or company name...",
      filterAll: "All Tickers",
      filterUndervalued: "Undervalued (>0% Upside)",
      filterHighUpside: "High Upside (>20%)",
      allMoats: "All Moats",
      wideMoat: "Wide Moat",
      narrowMoat: "Narrow Moat",
      colTicker: "Ticker",
      colCompany: "Company",
      colSnowflake: "Snowflake",
      colMoat: "Economic Moat",
      colPrice: "Current Price",
      colAnalystTarget: "Analyst Target",
      colBaseFairValue: "Base Fair Value",
      colWeightedFairValue: "Weighted Fair Value",
      colUpside: "Implied Upside",
      colOperatingMargin: "Operating Margin",
      colRevenueGrowth: "Rev Growth (YoY)",
      colValuationRange: "Stress Range (Bear / Base / Bull)",
      colAction: "Action",
      openCockpit: "Cockpit",
      openMemo: "Memo",
      statsCoverage: "Coverage Universe",
      statsAvgUpside: "Avg. Weighted Upside",
      statsTopPick: "Highest Upside",
      statsWideMoat: "Wide Moat Share",
      noResults: "No companies match your filters.",
      resetFilters: "Reset Filters",
      bearLabel: "Bear",
      baseLabel: "Base",
      bullLabel: "Bull",
      currentPriceLabel: "Current",
      sortPrompt: "Sort By",
      loading: "Loading universe reports...",
    },
    socialCard: {
      modalTitle: "Share Analysis & Export Cards",
      modalSubtitle:
        "Copy interactive scenario link or generate high-resolution visual cards for Twitter/X, LinkedIn, and Instagram.",
      templates: {
        valuation: "Valuation & Stress",
        valuationDesc:
          "Fair value upside, 4-tier regimes, and stress test drivers",
        earnings: "Earnings Scorecard",
        earningsDesc:
          "Revenue growth, operating margins, EPS beat/miss, and segments",
        thesis: "Thesis & Catalysts",
        thesisDesc: "Economic moat rating, upside catalysts, and key risks",
        summary: "Executive Teaser",
        summaryDesc: "All-in-one high-density institutional snapshot",
        snowflake: "Snowflake Radar",
        snowflakeDesc:
          "5-Pillar circular institutional quality & stress radar chart",
      },
      sections: {
        valuationHero: "Valuation & Price",
        valuationHeroDesc: "Current price, fair value, upside, and asymmetry",
        regimes: "Valuation Regimes",
        regimesDesc: "Bull, Base, and Panic floor scenario targets",
        earnings: "Earnings Scorecard",
        earningsDesc: "Revenue, operating income, clean EPS audit",
        segments: "Segment Breakdown",
        segmentsDesc: "Revenue segment dynamics and growth",
        moat: "Economic Moat",
        moatDesc: "Moat rating, trend, and competitive sources",
        catalysts: "Catalysts & Risks",
        catalystsDesc: "Growth catalysts and downside fragility risks",
        snowflake: "Snowflake Radar",
        snowflakeDesc: "30-point 5-pillar institutional quality radar",
      },
      presets: {
        label: "Quick Presets",
        custom: "Custom",
      },
      aspectRatios: {
        landscape: "Landscape 16:9 (X / LinkedIn)",
        square: "Square 1:1 (Instagram / Feed)",
        portrait: "Portrait 4:5 (Stories / Mobile)",
      },
      themes: {
        cyber: "Cyber Obsidian",
        navy: "Wall Street Midnight",
        emerald: "Emerald Alpha",
        crimson: "Crimson Stress Alert",
      },
      controls: {
        templateLabel: "Card Template",
        sectionsLabel: "Card Sections",
        formatLabel: "Card Ratio",
        themeLabel: "Color Theme",
        scenarioLinkLabel: "Interactive Scenario Link",
        includeStress: "Include Live Stress Adjustments",
        includeWatermark: "Show StressAlpha Branding",
        customNote: "Custom Analyst Takeaway (Optional)",
        customNotePlaceholder:
          "Add a punchy 1-2 sentence investment takeaway or catalyst highlight...",
        cardLanguage: "Card Language",
        liveStressParams: "Live stress parameters",
        previewScale: "Scale",
        clear: "Clear",
        defaultNote: (company: string, quarter: string) =>
          `${company} delivers strong ${quarter} beat with high operating margins and asymmetric risk/reward.`,
      },
      actions: {
        downloadPng: "Download PNG",
        copyImage: "Copy Image",
        copyText: "Copy Post Text",
        copyLink: "Copy Link",
        copied: "Copied",
        copiedToast:
          "Image copied to clipboard! Ready to paste into X, Slack, or LinkedIn.",
        textCopiedToast: "Social post text copied to clipboard!",
        linkCopiedToast: "Scenario link copied to clipboard!",
        downloadSuccessToast: "Card image downloaded successfully!",
        exportError: "Failed to export image. Please try again.",
        clipboardError:
          "Direct image copy not supported in this browser. Please use Download PNG.",
        generating: "Rendering...",
        copying: "Copying...",
        close: "Close",
      },
      labels: {
        earningsAuditTag: "Earnings Audit",
        tickerLabel: "TICKER",
        secAuditVerified: "SEC Audit Verified",
        currentPriceLabel: "CURRENT PRICE",
        weightedFairValueLabel: "WEIGHTED FAIR VALUE",
        riskRewardLabel: "RISK / REWARD",
        panicDefenseLabel: "PANIC DEFENSE",
        marketPricingLabel: "Market Pricing",
        bullRegimeLabel: "Bull Regime",
        baseCaseLabel: "Base Case",
        panicFloorLabel: "Panic Floor",
        stressedFwdEpsLabel: "Stressed Fwd EPS",
        stressedRevLabel: "Stressed Rev",
        netIncomeLabel: "Net Income",
        earningsBeatLabel: "EARNINGS BEAT",
        revenueLabel: "REVENUE",
        operatingIncomeLabel: "OPERATING INCOME",
        cleanOperatingEpsLabel: "CLEAN OPERATING EPS",
        consensusLabel: "Consensus",
        beatLabel: "Beat",
        incomeQualityFilterLabel: "Income-Quality Filter",
        marketCapLabel: "Market Cap",
        nextFyConsensusLabel: "Next FY Consensus",
        segmentsLabel: "Segments",
        ofTotalRevenueLabel: "of total revenue",
        valuationUpsideLabel: "Valuation Upside",
        weightedFairValueShortLabel: "Weighted Fair Value",
        snowflake30Label: "30-POINT SNOWFLAKE",
        wfvShortLabel: "WFV",
        upsideShortLabel: "Upside",
        secDisclosuresVerified: "Audited against SEC 10-Q filing disclosures",
        tagline: "Scenario Stress Valuation Engine",
        auditGrade: "RESEARCH AUDIT GRADE",
        asymmetryLabel: "Asymmetry",
        panicFloorShortLabel: "Panic Floor",
        valuationSpectrumLabel: "VALUATION SPECTRUM & REGIMES",
        financialHighlightsLabel: "FINANCIAL & MOAT HIGHLIGHTS",
        moatRatingLabel: "Economic Moat",
        pricedInMultipleLabel: "Priced-in Multiple",
        probLabel: "Prob",
      },
    },
  },
  zh: {
    header: {
      engineTag: "决策引擎",
      currentPrice: "现价",
      weightedFairValue: "加权公允价",
      cleanEps: "核心经营EPS",
      fwdEstimate: "远期一致预期",
      cockpit: "驾驶舱",
      memo: "备忘录",
      screener: "全景筛选",
      methodology: "计算原理",
      github: "GitHub",
      share: "分享",
      shareTooltip: "分享研报与导出社媒卡片 (E)",
      exportCard: "卡片",
      exportCardTooltip: "导出精美社媒卡片 (E)",
      snowflake: "雪花图",
      snowflakeTooltip: "30项全景雪花图 (W)",
      linkCopied: "情景分析链接已复制到剪贴板！",
      settings: "偏好与设置",
      language: "界面语言",
      shortcuts: "键盘快捷键",
    },
    selector: {
      selectReport: "选择财报研报...",
      availableReports: "可用研报列表",
      noReportsFound: "在 reports/ 目录下未找到任何研报",
      refreshTitle: "刷新研报目录",
      openScreener: "打开全景估值筛选",
    },
    cockpit: {
      title: "实时情景压力驾驶舱",
      reset: "重置全部",
      resetTooltip: "重置所有滑块至初始基准值",
      snowflakeButton: "雪花图",
      snowflakeTooltip: "30项全景雪花图审计 (W)",
      stressedForwardEps: "压力测试远期 EPS (年化)",
      cleanOperatingEps: "核心经营 EPS",
      stressedRev: "测算营收",
      grossProfit: "毛利润",
      operatingIncome: "营业利润",
      netIncome: "净利润",
      valuationRegimes: "动态情景估值目标",
      current: "现价",
      currentPrice: "当前股价",
      weightedFairValue: "加权公允价值",
      wfvShort: "加权估值",
      regimes: {
        bull: "🐂 牛市情景",
        base: "⚖️ 基准情景",
        bear: "🐻 熊市情景",
        panic: "🚨 恐慌底价",
        panicFloorLabel: "恐慌极值估值底",
      },
      asymmetry: {
        upsideToBull: "牛市上行空间",
        downsideToPanic: "恐慌下行最大回撤",
        pricedInMultiple: "市场隐含市盈率",
        asymmetrySkew: "风险收益非对称赔率",
      },
      upstreamTitle: "上游核心驱动因子冲击滑块",
      exposure: "敞口",
      elasticity: "弹性",
      accountingTitle: "会计利润率与杠杆控制",
      grossMarginPerturbation: "毛利率扰动 (基点)",
      fixedOpexShift: "固定运营支出变动",
      metadata: {
        baseRev: "基准营收",
        shares: "稀释总股本",
        tax: "税率",
      },
      guardrail: {
        title: "收益质量审计护栏",
        description: "经审计的 GAAP 调整项，隔离非经营性或过渡性账面损益：",
        operatingCleanEps: "核心经营清洁 EPS:",
        operating: "经营性",
        nonOperating: "非经营性",
        toggleShow: "损益明细: 已折叠",
        toggleHide: "损益明细: 已展开",
        itemsCount: (count: number) => `已调整 ${count} 项非经常性损益`,
      },
      presets: {
        title: "宏观情景预设",
        baseline: "0% 基准中性",
        baselineTooltip: "预设方案：将所有业务因子设为 0% 基准状态",
        mild: "-10% 轻度承压",
        mildTooltip: "预设方案：-10% 需求冲击，-100 bps 毛利，+2% 费用",
        severe: "-25% 极度恐慌",
        severeTooltip: "预设方案：-25% 极端冲击，-300 bps 毛利，+5% 费用",
      },
      sliderTabs: {
        volume: "业务量驱动",
        margins: "成本与利润率",
        all: "全部控制项",
      },
    },
    shortcuts: {
      title: "快捷键指南",
      tabSwitch: "快速切换标签页 (1–6)",
      resetModel: "重置压力模型 (R)",
      toggleMemo: "切换驾驶舱 / 备忘录 (M)",
      toggleLang: "切换中英文 (L)",
      exportCard: "导出社媒卡片 (E)",
      openSnowflake: "全景雪花图审计 (W)",
      toggleScreener: "切换全景筛选与对比 (S)",
      close: "关闭窗口 (Esc / ?)",
    },
    snowflake: {
      title: "全景雪花图评分",
      subtitle: "五维机构级基本面、护城河与压力估值确定性审计",
      badgeTitle: "30项全景雪花图",
      scoreCardTitle: "全景雪花评分",
      totalScore: "全景综合得分",
      outOf30: "满分 30 分",
      viewAudit: "查看 30 项全景审计明细",
      hideAudit: "收起明细",
      clickToViewAudit: "点击查看 30 项全景审计明细",
      modalTitle: "30 项全景雪花图审计明细",
      modalSubtitle:
        "基于估值、增长、盈利质量、护城河与抗风险韧性的全量确定性评估",
      filterAll: "全部 30 项",
      filterByPillar: "分项筛选",
      passedBadge: "项达标",
      exportCard: "导出社媒卡片",
      close: "关闭 (Esc)",
      footerNotice: "纯确定性基本面与压力估值审计 • 零推测模型",
      overallScoreSub: (
        score: number,
        max: number,
        pct: number,
        label: string
      ) => `综合得分: ${score}/${max} (${pct}%) • ${label}`,
      wfvLabel: "加权公允价值",
      upsideLabel: "预期空间",
    },
    priceMeter: {
      title: "估值区间标尺",
      current: "现价",
      panicFloor: "🚨 恐慌底价",
      base: "⚖️ 基准目标",
      bullRegime: "🐂 牛市目标",
    },
    tabs: {
      valuation: "估值与情景",
      estimates: "分析师共识",
      moat: "护城河与竞品",
      segments: "分部业务与财务",
      catalysts: "催化剂与风险",
      audit: "业绩与披露审计",
      report: "原始底稿与披露",
      scenarios: "估值与情景",
      sensitivity: "敏感性热力图",
      tone: "电话会情绪",
      filing: "10-Q 风险",
      reactions: "历史股价反应",
    },
    estimatesTab: {
      title: "华尔街分析师共识与目标价",
      subtitle: "卖方评级分布、52周目标价区间、最新评级调整与观点综合述评。",
      empty: "当前研报暂无分析师预期数据。",
      consensusTitle: "分析师共识",
      totalAnalysts: "覆盖分析师总数",
      ratingLabel: "综合评级",
      bullish: "看多 (Bullish)",
      neutral: "中性 (Neutral)",
      bearish: "看空 (Bearish)",
      priceTargetsTitle: "52周目标价区间",
      currentPrice: "当前股价",
      targetRange: "目标价区间",
      low: "最低",
      average: "均价",
      median: "中位数",
      high: "最高",
      avgUpside: "预期平均空间",
      tableTitle: "各券商目标价及评级明细",
      colFirm: "券商机构",
      colAnalyst: "分析师",
      colRating: "评级",
      colTarget: "52周目标价",
      colPriorTarget: "前次目标",
      colUpside: "预期空间",
      colDate: "调整日期",
      colAction: "调整动作",
      colNotes: "核心观点 / 研报焦点",
      synthesisTitle: "华尔街观点综合述评",
      sourcesTitle: "研报引用与数据来源",
      fromPrior: "前值",
    },
    auditTab: {
      title: "业绩发布与财报披露审计",
      subtitle: "管理层电话会语调、10-Q新增风险披露变更及历史业绩股价反应。",
      empty: "当前研报暂无财报审计底稿。",
      subTone: "电话会语调与问答",
      subFiling: "10-Q 风险增量",
      subReactions: "历史股价反应",
    },
    moatTab: {
      title: "经济护城河与核心竞品对标矩阵",
      subtitle:
        "晨星五维护城河定性评估、壁垒持久性预估与行业核心竞品财务经营指标横向对比。",
      empty: "当前研报暂无经济护城河与竞品对标数据。",
      ratingLabel: "护城河综合评级",
      trendLabel: "护城河演变趋势",
      sourcesTitle: "五大护城河源泉穿透",
      durability: "壁垒持久期",
      peersTitle: "同业竞品多维横向对标",
      dynamicsTitle: "战略竞争格局与行业结构演变",
      colTicker: "股票代码",
      colCompany: "公司名称",
      colMarketCap: "总市值",
      colRevenue: "营收 / 同比增速",
      colGrowth: "同比增速",
      colGrossMargin: "毛利率",
      colOperatingMargin: "营业利润率",
      colFwdPe: "远期市盈率",
      colShare: "市场份额",
      colPricingPower: "定价权",
      colAdvantage: "核心竞争优势",
      colVulnerability: "主要脆弱点",
    },
    catalystsTab: {
      title: "定性财报催化剂与发生概率锚定",
      subtitle:
        "从 SEC 披露及财报电话会中提取的关键驱动因子。拖动滑块可测试逻辑敏感性。",
      empty: "当前研报暂无催化剂审计数据。",
      countLabel: "项催化因子",
      growth: "增长催化",
      risk: "下行风险",
      nearTerm: "近期 (0-6月)",
      mediumTerm: "中期 (6-18月)",
      longTerm: "长期",
      evidenceTitle: "审计证据底稿与出处事实",
      probabilityWeight: "发生概率权重:",
      resetTooltip: "重置为原始权重",
    },
    scenariosTab: {
      title: (year: string) => `情景发生概率树 (${year})`,
      subtitle:
        "确定性估值计算矩阵。支持直接内联编辑概率、远期 EPS 或目标倍数，实时重算。",
      probMismatch: (pct: number) => `概率总和为 ${pct}% (需等于 100%)`,
      probValid: "100% 概率完全分配",
      wfv: "加权公允价值 (WFV)",
      vsCurrent: "较现价空间",
      consensusTarget: "华尔街一致预期目标价",
      implied: "预期空间",
      alphaConsensus: "超额预期收益 (Alpha)",
      bullishPremium: "看多溢价",
      discountedSafety: "折价安全边际",
      viewCards: "情景对比列",
      viewTable: "数据表格",
      targetPrice: "目标公允价",
      weight: "发生概率权重",
      fwdEps: "远期 EPS",
      exitPe: "目标退出倍数",
      assumptionsTitle: "核心驱动与业务假设",
      sensitivityTitle: "情景敏感性分析",
      sensitivitySubtitle: "关键参数变动对各情景目标价的弹性测算",
      colScenario: "情景名称",
      colProbability: "发生概率",
      colFwdEps: "远期 EPS",
      colExitPe: "目标倍数",
      colFairValue: "目标公允价",
      colUpside: "较现价空间",
      colAssumptions: "核心假设与驱动依据",
    },
    segmentsTab: {
      title: "分部业务运营数据与管理层业绩指引",
      subtitle:
        "经审计的各业务线单元经济效益、同比增速与管理层官方前瞻业绩指引区间。",
      breakdownTitle: "各分部营收贡献占比分解",
      totalRevenue: "分部总营收",
      colName: "分部名称",
      colRevenue: "季度营收",
      colGrowth: "同比增长率",
      colMargin: "营业利润率",
      guidanceTitle: "管理层官方前瞻业绩指引概要",
      operatingIncomeRange: "营业利润指引区间",
      revenueRange: "总营收指引区间",
    },
    toneTab: {
      title: "管理层语调与财报电话会定性审计",
      subtitle:
        "经审计的管理层语言信号、五维信心得分、华尔街分析师问答焦点与关键原声引用。",
      empty: "当前研报暂无财报电话会议情绪审计数据。",
      overallConfidence: "管理层综合信心得分",
      behavioralDimensions: "管理层行为五维雷达评估 (1-5 分制)",
      metrics: {
        specificity: "表述精确度 (Specificity)",
        forwardConfidence: "前瞻信心指数 (Forward Confidence)",
        capexJustification: "资本开支合理性 (CapEx Justification)",
        competitivePositioning: "竞争格局卡位 (Competitive Positioning)",
        riskAcknowledgment: "风险坦诚正视度 (Risk Acknowledgment)",
      },
      qaFocus: "分析师提问焦点与管理层回应态度",
      colTopic: "关切主题",
      colMentions: "提及频次",
      colResponse: "管理层应对",
      keyQuotes: "电话会议核心原声引用",
      sentimentLabels: {
        bullish: "积极偏多",
        bearish: "谨慎偏空",
        neutral: "中性客观",
      },
    },
    filingTab: {
      title: "SEC 10-Q 定期报告对比审计与风险披露",
      subtitle:
        "与往期法定监管申报文件的差异对比审计，识别新增法律表述与合规风险因素。",
      empty: "当前研报暂无 SEC 10-Q 监管申报审计底稿。",
      newRisksTitle: "新增或升级的风险因素披露",
      newTag: "⚡ 本报告期全新增加",
      expandedTag: "相较上季度表述显著扩充",
      findingsTitle: "关键章节提取与重大发现",
      newBadge: "NEW",
    },
    reactionsTab: {
      title: "历史财报披露后市场反应复盘与情景框架",
      subtitle:
        "历史财报披露后首个交易日的实际涨跌幅统计与条件化催化归因框架。",
      empty: "当前研报暂无财报历史股价反应数据。",
      colDate: "披露日期",
      colEvent: "事件 / 报告季度",
      colMove: "首日涨跌幅",
      colContext: "市场背景与核心催化归因",
    },
    sensitivityTab: {
      title: "估值敏感性与扰动分析矩阵",
      subtitle: "基本面单变量边际扰动对各情景公允价值的单因素敏感性冲击测算。",
      empty: "当前研报暂无估值敏感性矩阵数据。",
      sensitivitySuffix: "敏感性",
      deltaFairValue: "目标公允价变动 (Δ Fair Value)",
    },
    memo: {
      backToCockpit: "返回驾驶舱",
      enMemoBtn: "English Memo",
      zhMemoBtn: "🇨🇳 中文备忘录",
      printPdf: "打印 / 导出 PDF",
      committeeMemo: "StressAlpha 投资决策委员会备忘录 (MEMORANDUM)",
      decisionAudit: "投资决策与压力测试审计",
      reportDate: "报告日期",
      generatedVia: "由 StressAlpha 确定性压力计算引擎生成",
      currentStock: "当前基准股价",
      weightedFairValue: "概率加权公允价",
      sec1Title: "一、 执行决策综述 (Executive Synthesis)",
      sec2Title:
        "二、 动态估值区间与利润穿透 (Valuation Regimes & Flow-Through)",
      sec3Title: "三、 收益质量与核心经营利润审计 (Income Quality)",
      sec4Title: "四、 核心基本面催化剂与概率锚定 (Catalysts)",
      secMoatTitle: "五、 经济护城河与核心竞品对标 (Moat & Peers)",
      secEstimatesTitle:
        "五(附)、 华尔街分析师共识与目标价 (Analyst Estimates)",
      sec5Title: "六、 SEC 10-Q 监管与合规风险升级 (Filing Risks)",
      colRegime: "估值区间",
      colMultiple: "市盈率倍数",
      colStressedEps: "压力 EPS",
      colTargetPrice: "目标价格",
      colDelta: "较现价空间",
      colThesis: "核心情景逻辑",
      regimeBull: "🐂 牛市情景 (Bull)",
      regimeBase: "⚖️ 基准情景 (Base)",
      regimePanic: "🚨 恐慌底价 (Panic)",
      prob: "概率",
      secSnowflakeTitle: "30项全景雪花基本面与压力审计",
      snowflakeView30: "查看全部30项审计",
      analystsCount: (count: number) => `共 ${count} 位华尔街分析师覆盖`,
      bullish: "看多 / 买入",
      neutral: "中性 / 持有",
      bearish: "看空 / 卖出",
      targetRange: "52周目标价区间: ",
      colFirm: "券商机构",
      colAnalyst: "分析师",
      colRating: "评级",
      colPriceTarget: "目标价",
      colUpside: "空间",
      colDate: "发布日期",
      targetPriorFrom: "前值",
    },
    page: {
      loading: "正在加载 StressAlpha 研报数据...",
      noReportSelected: "未选择研报",
      noReportDesc:
        "请从顶部下拉菜单直接选择已生成的研报文件夹，或上传自定义分析目录。",
      uploadFolderBtn: "上传分析文件夹",
      reportTitleZh: "中文财报深度研报 (report_zh.md)",
      reportTitleEn: "Equity Markdown Report (report.md)",
      copyBtn: "复制",
      copiedZh: "中文研报已复制到剪贴板！",
      copiedEn: "Report markdown copied!",
      noReportFileZh: "暂无中文研报文件 (report_zh.md)。",
      noReportFileEn: "No report.md file available in this folder.",
      resetSlidersToast: "已重置所有滑块至基准默认值。",
      linkCopiedToast: "情景链接已复制到剪贴板！",
      customLoadedToast: "自定义分析研报加载成功！",
    },
    uploader: {
      title: "上传研报分析文件夹",
      description:
        "拖拽包含 facts.json、scenarios.json 以及可选基准配置文件的研报目录至此。",
      dropzoneTitle: "拖拽文件夹或 JSON 数据文件至此",
      dropzoneHint: "必须包含 facts.json 与 scenarios.json",
      chooseFolder: "选择文件夹",
      selectFiles: "选择文件",
      minFilesError: "至少需要包含: facts.json 与 scenarios.json",
      schemaError: (msg: string) => `数据校验失败: ${msg}`,
    },
    screener: {
      title: "覆盖公司全景筛选与估值横向对比",
      subtitle:
        "跨股票基本面数据横向比对、压力测试估值空间排序与护城河竞争壁垒全景",
      searchPlaceholder: "搜索股票代码或公司全称...",
      filterAll: "全部标的",
      filterUndervalued: "估值折价 (>0% 空间)",
      filterHighUpside: "高弹性标的 (>20%)",
      allMoats: "全部护城河",
      wideMoat: "宽护城河",
      narrowMoat: "窄护城河",
      colTicker: "代码",
      colCompany: "公司名称",
      colSnowflake: "雪花评分",
      colMoat: "经济护城河",
      colPrice: "当前股价",
      colAnalystTarget: "华尔街目标价",
      colBaseFairValue: "基准公允价",
      colWeightedFairValue: "加权公允价",
      colUpside: "估值空间",
      colOperatingMargin: "营业利润率",
      colRevenueGrowth: "营收同比增速",
      colValuationRange: "压力估值谱系 (悲观 / 基准 / 乐观)",
      colAction: "操作",
      openCockpit: "驾驶舱",
      openMemo: "研报备忘",
      statsCoverage: "覆盖标的池",
      statsAvgUpside: "平均加权估值空间",
      statsTopPick: "最高估值弹性",
      statsWideMoat: "宽护城河占比",
      noResults: "未找到符合当前筛选条件的公司。",
      resetFilters: "重置筛选条件",
      bearLabel: "悲观",
      baseLabel: "基准",
      bullLabel: "乐观",
      currentPriceLabel: "现价",
      sortPrompt: "排序依据",
      loading: "正在加载研报筛选池...",
    },
    socialCard: {
      modalTitle: "分享研报与导出社媒卡片",
      modalSubtitle:
        "一键复制带自定义参数的交互式推演链接，或生成用于社媒分享的高清机构级图表卡片。",
      templates: {
        valuation: "估值与压力测试",
        valuationDesc: "公允价值空间、四档估值谱系及业务承压因子",
        earnings: "财报业绩快报",
        earningsDesc: "营收增速、营业利润率、超预期幅度与业务分部",
        thesis: "投资逻辑与催化剂",
        thesisDesc: "经济护城河评级、核心成长催化与主要风险",
        summary: "高管全景速览",
        summaryDesc: "一站式全景速览与核心结论总结",
        snowflake: "全景雪花图",
        snowflakeDesc: "五维机构级质量、护城河与压力估值圆形雷达卡片",
      },
      sections: {
        valuationHero: "估值与价格",
        valuationHeroDesc: "现价、公允价值、估值空间与不对称性",
        regimes: "估值谱系情景",
        regimesDesc: "乐观、基准与恐慌底线目标价",
        earnings: "财报业绩审计",
        earningsDesc: "营收、营业利润、核心经调EPS审计",
        segments: "业务分部拆解",
        segmentsDesc: "分部营收动态与增速",
        moat: "经济护城河",
        moatDesc: "护城河评级、趋势与竞争壁垒来源",
        catalysts: "催化与风险",
        catalystsDesc: "成长催化因子与下行脆弱性风险",
        snowflake: "全景雪花图",
        snowflakeDesc: "30项五维机构级质量雷达审计",
      },
      presets: {
        label: "快捷预设",
        custom: "自定义",
      },
      aspectRatios: {
        landscape: "横版 16:9 (X / LinkedIn)",
        square: "正方形 1:1 (Instagram / 朋友圈)",
        portrait: "竖版 4:5 (小红书 / 移动端)",
      },
      themes: {
        cyber: "黑曜赛博 (经典)",
        navy: "华尔街午夜蓝",
        emerald: "翡翠超额 Alpha",
        crimson: "绯红极端压力",
      },
      controls: {
        templateLabel: "卡片模版",
        sectionsLabel: "卡片内容板块",
        formatLabel: "画幅尺寸",
        themeLabel: "视觉主题",
        scenarioLinkLabel: "交互式情景推演链接",
        includeStress: "包含当前微调的极端承压参数",
        includeWatermark: "显示 StressAlpha 机构水印与版权",
        customNote: "分析师核心观点 (可选备注)",
        customNotePlaceholder:
          "输入 1-2 句精炼的投资逻辑、风险提示或催化亮点...",
        cardLanguage: "卡片呈现语言",
        liveStressParams: "保存当前滑块参数",
        previewScale: "预览缩放",
        clear: "清空",
        defaultNote: (company: string, quarter: string) =>
          `${company} ${quarter} 业绩超预期，经调整核心营业利润率维持高位，估值具备不对称防护。`,
      },
      actions: {
        downloadPng: "下载高清图片",
        copyImage: "复制图片到剪贴板",
        copyText: "复制社媒文案",
        copyLink: "复制链接",
        copied: "已复制",
        copiedToast:
          "卡片图片已复制到剪贴板！可直接粘贴至微信、Slack 或 Twitter。",
        textCopiedToast: "社媒文案已复制到剪贴板！",
        linkCopiedToast: "情景分析链接已复制到剪贴板！",
        downloadSuccessToast: "高清卡片图片已成功下载！",
        exportError: "图片导出失败，请重试或尝试复制文本。",
        clipboardError:
          "当前浏览器不支持直接写入剪贴板图片，请使用下载 PNG 功能。",
        generating: "正在渲染...",
        copying: "正在复制...",
        close: "关闭",
      },
      labels: {
        earningsAuditTag: "财报审计",
        tickerLabel: "股票代码",
        secAuditVerified: "SEC 10-Q 审计验证",
        currentPriceLabel: "当前股价",
        weightedFairValueLabel: "概率加权公允价值",
        riskRewardLabel: "盈亏比与不对称性",
        panicDefenseLabel: "恐慌防御垫",
        marketPricingLabel: "市场定价",
        bullRegimeLabel: "牛市区间",
        baseCaseLabel: "基准情景",
        panicFloorLabel: "恐慌底价",
        stressedFwdEpsLabel: "压力远期EPS",
        stressedRevLabel: "压力营收",
        netIncomeLabel: "净利润",
        earningsBeatLabel: "业绩超预期",
        revenueLabel: "营业收入",
        operatingIncomeLabel: "营业利润",
        cleanOperatingEpsLabel: "核心经营EPS",
        consensusLabel: "一致预期",
        beatLabel: "超预期",
        incomeQualityFilterLabel: "收益质量过滤器",
        marketCapLabel: "总市值",
        nextFyConsensusLabel: "下一财年一致预期",
        segmentsLabel: "业务分部",
        ofTotalRevenueLabel: "占总营收比重",
        valuationUpsideLabel: "估值空间",
        weightedFairValueShortLabel: "加权公允价",
        snowflake30Label: "30项全景雪花",
        wfvShortLabel: "加权公允",
        upsideShortLabel: "空间",
        secDisclosuresVerified: "已通过 SEC 10-Q 披露数据交叉核验",
        tagline: "情景压力测试估值决策引擎",
        auditGrade: "机构研究审计级",
        asymmetryLabel: "不对称比率",
        panicFloorShortLabel: "恐慌底",
        valuationSpectrumLabel: "动态估值谱系与区间",
        financialHighlightsLabel: "核心财务与护城河指标",
        moatRatingLabel: "经济护城河",
        pricedInMultipleLabel: "已计入倍数",
        probLabel: "概率",
      },
    },
  },
};

export function getTranslations(locale: Locale = "en"): Translations {
  return translations[locale] || translations.en;
}
