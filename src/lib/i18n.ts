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
    settingsPage: string;
    language: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    themeDarkShort: string;
    themeLightShort: string;
    themeCyber?: string;
    themeCyberShort?: string;
    toggleTheme: string;
    shortcuts: string;
    watchlist: string;
    addToWatchlist: string;
    removeFromWatchlist: string;
    bookmarked: string;
    bookmark: string;
    addedToWatchlistToast: (ticker: string) => string;
    removedFromWatchlistToast: (ticker: string) => string;
    signInRequiredToast: string;
    quarterHistory: string;
    latestBadge: string;
    historicalBadge: string;
    historicalBanner: (quarter: string, date?: string) => string;
    jumpToLatest: (quarter: string) => string;
    quartersAvailable: (count: number) => string;
    noEarlierQuarters: string;
    mobileMenu: string;
    closeMenu: string;
    navigation: string;
    modelNavTooltip: (ticker?: string) => string;
  };
  selector: {
    selectReport: string;
    availableReports: string;
    noReportsFound: string;
    refreshTitle: string;
    openScreener: string;
    watchlistSection: string;
    allReportsSection: string;
    starredTooltip: string;
    quartersCount: (count: number) => string;
    searchPlaceholder: string;
    collapseQuarters: string;
    expandQuarters: (count: number) => string;
    showingUniverseSummary: (shown: number, total: number) => string;
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
    currentPriceTooltip: string;
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
    mobileCockpitTab: string;
    mobileWorkspacesTab: string;
    exploreWorkspaces: string;
    adjustShocks: string;
    quickSummary: string;
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
    toggleFavorite: string;
    close: string;
    prevNextTab: string;
    returnToModel: string;
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
    currentPriceTooltip: string;
    panicFloor: string;
    base: string;
    bullRegime: string;
  };
  technicalLevels: {
    cardTitle: string;
    badgeTitle: string;
    supportTitle: string;
    resistanceTitle: string;
    confluenceTitle: string;
    confluenceBadge: string;
    confluenceDesc: (
      techLabel: string,
      techPrice: string,
      fundRegime: string,
      fundPrice: string,
      diffPct: string
    ) => string;
    levelNames: {
      sma50: string;
      sma200: string;
      high52: string;
      low52: string;
      pivot_p: string;
      pivot_s1: string;
      pivot_r1: string;
      pivot_s2: string;
      pivot_r2: string;
      pivot_s3: string;
      pivot_r3: string;
      gap_fill: string;
      gap_boundary: string;
      volume_poc: string;
      avwap_high: string;
      avwap_volume: string;
      swing_high: string;
      swing_low: string;
    };
    types: {
      support: string;
      resistance: string;
      pivot: string;
    };
    importance: {
      major: string;
      intermediate: string;
      minor: string;
    };
    noData: string;
    distance: string;
    tooltip: string;
    zone: string;
    zoneBadge: string;
    zoneDesc: (count: number) => string;
    corridors: {
      title: string;
      badge: string;
      viewCorridors: string;
      viewAllLevels: string;
      s1Title: string;
      s1Desc: (low: string, high: string) => string;
      s2Bedrock: string;
      s2BedrockDesc: (low: string, high: string) => string;
      s2Structural: string;
      s2StructuralDesc: (low: string, high: string) => string;
      s3Breakdown: string;
      s3BreakdownDesc: (low: string, high: string) => string;
      s3Macro: string;
      s3MacroDesc: (low: string, high: string) => string;
      r1Title: string;
      r1Desc: (low: string, high: string) => string;
      r2Gap: string;
      r2GapDesc: (low: string, high: string) => string;
      r2Structural: string;
      r2StructuralDesc: (low: string, high: string) => string;
      r3Sma: string;
      r3SmaDesc: (low: string, high: string) => string;
      r3High: string;
      r3HighDesc: (low: string, high: string) => string;
    };
    openFullAnalysis: string;
    compactSummary: string;
    spot: string;
    openChartTab: string;
  };
  tabs: {
    valuation: string;
    technicals: string;
    estimates: string;
    moat: string;
    segments: string;
    catalysts: string;
    news: string;
    audit: string;
    report: string;
    scenarios?: string;
    sensitivity?: string;
    tone?: string;
    filing?: string;
    reactions?: string;
    shortValuation: string;
    shortTechnicals: string;
    shortEstimates: string;
    shortMoat: string;
    shortSegments: string;
    shortCatalysts: string;
    shortAudit: string;
    shortNews: string;
    shortReport: string;
    nextTab: string;
    prevTab: string;
    allTabs: string;
    tabNumber: (current: number, total: number) => string;
  };
  technicalsTab: {
    title: string;
    subtitle: string;
    chartCardTitle: string;
    chartCardSubtitle: string;
    corridorsCardTitle: string;
    corridorsCardSubtitle: string;
    confluenceSectionTitle: string;
    confluenceEmpty: string;
    trendBullish: string;
    trendBearish: string;
    distanceTo52WHigh: string;
    distanceTo52WLow: string;
    volumePoc: string;
    tradingViewWatermark: string;
  };
  newsTab: {
    title: string;
    subtitle: string;
    empty: string;
    latestPulse: string;
    transmissionChannel: string;
    simulateButton: string;
    simulateTooltip: string;
    viewSource: string;
    wfvImpact: string;
    priceReaction: string;
    abnormalMove: string;
    allFilter: string;
    upstreamFilter: string;
    productFilter: string;
    analystFilter: string;
    secFilter: string;
    channels: {
      driverShock: string;
      catalystProb: string;
      qpceSkew: string;
      segmentGrowth: string;
      none: string;
    };
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
    filterAll: string;
    filterBuy: string;
    filterHold: string;
    filterSell: string;
    searchPlaceholder: string;
    emptySearch: string;
    currentPriceLabel: string;
    searchGoogle: (firm: string) => string;
    consensusMean: string;
    spreadRatio: string;
    sentimentMomentum: string;
    highConvictionBullish: string;
    moderateBull: string;
    divergentSentiment: string;
    consensusAnatomy: string;
    streetHigh: string;
    streetLow: string;
    targetSpread: string;
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
    wideMoat: string;
    narrowMoat: string;
    noMoat: string;
    trendWidening: string;
    trendNarrowing: string;
    trendStable: string;
    colProductComparison: string;
    colAdvantageVulnerability: string;
    viewYahoo: (ticker: string) => string;
    durabilityYearsSuffix: string;
    peersCountSuffix: string;
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
    variantPerceptionTitle: string;
    variantPerceptionSubtitle: string;
    dataCompletenessBadge: (
      score: number,
      populated: number,
      total: number
    ) => string;
    divergenceLabels: {
      in_line: string;
      moderate_alpha: string;
      high_conviction_alpha: string;
      extreme_divergence: string;
    };
    divergenceAttributionTitle: string;
    baseMultipleVsStreet: string;
    regimeStressImpact: string;
    modelStanceTitle: string;
    dataNotesTitle: string;
    closeModal: string;
    revisionsLedgerTitle: string;
    revisionsLedgerSubtitle: string;
    revisionsEmpty: string;
    colRevisionDate: string;
    colRevisionTrigger: string;
    colRevisionHeadline: string;
    colRevisionShift: string;
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
    confidentialBadge: string;
    docClassification: string;
    footerMethodologyTitle: string;
    footerMethodology: string;
    footerDisclaimerTitle: string;
    footerDisclaimer: string;
    docId: string;
    footerAuditStatus: string;
    printGeneratedOn: string;
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
    filterAllTooltip: string;
    filterUndervalued: string;
    filterUndervaluedTooltip: string;
    filterHighUpside: string;
    filterHighUpsideTooltip: string;
    allMoats: string;
    allMoatsTooltip: string;
    wideMoat: string;
    wideMoatTooltip: string;
    narrowMoat: string;
    narrowMoatTooltip: string;
    colTicker: string;
    colTickerTooltip: string;
    colCompany: string;
    colSnowflake: string;
    colSnowflakeTooltip: string;
    colMoat: string;
    colMoatTooltip: string;
    colPrice: string;
    colPriceTooltip: string;
    colAnalystTarget: string;
    colAnalystTargetTooltip: string;
    colConsensusSpread: string;
    colBaseFairValue: string;
    colBaseFairValueTooltip: string;
    colWeightedFairValue: string;
    colWeightedFairValueTooltip: string;
    colUpside: string;
    colOperatingMargin: string;
    colOperatingMarginTooltip: string;
    colRevenueGrowth: string;
    colRevenueGrowthTooltip: string;
    colValuationRange: string;
    colAction: string;
    viewCards: string;
    viewTable: string;
    openCockpit: string;
    openMemo: string;
    openCockpitTooltip: (ticker: string) => string;
    statsCoverage: string;
    statsAvgUpside: string;
    statsAvgUpsideSub: string;
    statsTopPick: string;
    statsWideMoat: string;
    statsWideMoatSub: (count: number, total: number) => string;
    noResults: string;
    resetFilters: string;
    resultsCount: (shown: number, total: number) => string;
    loadAll: (total: number) => string;
    filterWatchlist: string;
    colFavorite: string;
    watchlistEmptyTitle: string;
    watchlistEmptyDesc: string;
    viewAllReports: string;
    watchlistCount: (count: number) => string;
    bearLabel: string;
    baseLabel: string;
    bullLabel: string;
    currentPriceLabel: string;
    analystsLabel: string;
    rangeTooltip: string;
    rangeBearBullHint: string;
    sortPrompt: string;
    loading: string;
  };
  watchlistPage: {
    title: string;
    subtitle: string;
    statsTracked: string;
    statsAvgUpside: string;
    statsConvictionLeader: string;
    statsWideMoat: string;
    statsAvgSnowflake: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreScreenerBtn: string;
    quickAddSuggestions: string;
    viewCards: string;
    viewTable: string;
    regimeSpectrum: string;
    consensusDivergence: string;
    snowflakeBreakdown: string;
    operationalMomentum: string;
    quarterlyHistory: string;
    removeFromWatchlist: string;
    openCockpit: string;
    openMemo: string;
    colMoat: string;
    colPrice: string;
    colWfv: string;
    colBaseFv: string;
    colConsensus: string;
    colDivergence: string;
    colGrowthMargin: string;
    colSnowflake: string;
    colActions: string;
    divergenceTiers: {
      in_line: string;
      moderate_alpha: string;
      high_conviction_alpha: string;
      extreme_divergence: string;
    };
    pillarLabels: {
      valuation: string;
      future: string;
      earnings: string;
      moat: string;
      resilience: string;
    };
    noFilterMatches: string;
    resultsCount: (shown: number, total: number) => string;
    loadAll: (total: number) => string;
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
      upsideTag: string;
      downsideTag: string;
      activeStressTag: string;
      neutralStressTag: string;
      bullRegimeDesc: string;
      baseRegimeDesc: string;
      panicRegimeDesc: string;
      quarterlyResultsTitle: string;
      marginLabel: string;
      durabilityLabel: string;
      compositeScoreLabel: string;
      fivePillarsTitle: string;
      segmentsTitle: string;
      competitiveAdvantageTitle: string;
      catalystsTitle: string;
      growthCatalystLabel: string;
      downsideRiskLabel: string;
      probabilityAnchoredLabel: string;
      grossMarginLabel: string;
      operatingMarginLabel: string;
      consensusTargetLabel: string;
      competitiveDynamicsLabel: string;
      peerBenchmarkLabel: string;
      revenueGuidanceLabel: string;
      noDataAvailable: string;
      moatTrendLabel: string;
      priceSpectrumTrackLabel: string;
      spreadLabel: string;
      trailingPeLabel: string;
      forwardPeLabel: string;
      fairPeLabel: string;
      marginOfSafetyLabel: string;
      asymmetrySkewLabel: string;
      multipleSpreadLabel: string;
      stressOperatingFlowLabel: string;
      bullUpsideLabel: string;
      panicDownsideLabel: string;
      gaapReportedEpsLabel: string;
      adjustedSpreadLabel: string;
      guidanceCorridorLabel: string;
      cleanConversionTitle: string;
      radarChartSubtitle: string;
      operatingIncomeGrowthLabel: string;
      revenueVsEstimateLabel: string;
    };
  };
  auth: {
    signIn: string;
    signOut: string;
    signUp: string;
    createAccount: string;
    email: string;
    password: string;
    name: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    signInTitle: string;
    signUpTitle: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    loading: string;
    errorTitle: string;
    loginSuccess: string;
    signupSuccess: string;
    signoutSuccess: string;
    cloudSyncActive: string;
    cloudSyncTooltip: string;
    accountMenu: string;
    profile: string;
    guestUser: string;
    syncing: string;
    passwordHint: string;
    passwordTooShort: string;
    invalidCredentials: string;
    invalidEmail: string;
    userAlreadyExists: string;
    emailRequired: string;
    memberBadge: string;
  };
  settingsPage: {
    title: string;
    subtitle: string;
    backToModel: string;
    backToScreener: string;
    tabAccount: string;
    tabAppearance: string;
    tabValuation: string;
    tabPrivacy: string;
    tabSystem: string;
    account: {
      title: string;
      description: string;
      notSignedIn: string;
      notSignedInDesc: string;
      signInButton: string;
      nameLabel: string;
      emailLabel: string;
      showEmail: string;
      hideEmail: string;
      emailPrivacyNotice: string;
      statusLabel: string;
      statusConnected: string;
      userIdLabel: string;
      copyUserId: string;
      copiedUserId: string;
      verifiedBadge: string;
      unverifiedBadge: string;
      signOutButton: string;
    };
    appearance: {
      title: string;
      description: string;
      languageTitle: string;
      languageDesc: string;
      langEnTitle: string;
      langEnDesc: string;
      langZhTitle: string;
      langZhDesc: string;
      themeTitle: string;
      themeDesc: string;
      themeDarkTitle: string;
      themeDarkDesc: string;
      themeLightTitle: string;
      themeLightDesc: string;
    };
    valuation: {
      title: string;
      description: string;
      qpceTitle: string;
      qpceDesc: string;
      qpceFormula: string;
      guardrailTitle: string;
      guardrailDesc: string;
      feedsTitle: string;
      feedsDesc: string;
      feedsMassive: string;
      feedsFinnhub: string;
    };
    privacy: {
      title: string;
      description: string;
      privacyFirstTitle: string;
      privacyFirstDesc: string;
      dropdownPrivacyTitle: string;
      dropdownPrivacyDesc: string;
      statusActive: string;
      cloudSyncTitle: string;
      cloudSyncDesc: string;
      clearCacheTitle: string;
      clearCacheDesc: string;
      clearCacheButton: string;
      clearCacheSuccess: string;
    };
    system: {
      title: string;
      description: string;
      versionLabel: string;
      engineLabel: string;
      databaseLabel: string;
      methodologyLink: string;
      githubLink: string;
      shortcutsButton: string;
    };
  };
  methodologyPage: {
    backToModel: string;
    engineTag: string;
    badge: string;
    title: string;
    subtitle: string;
    nav: {
      demand: string;
      operatingLeverage: string;
      earningsQuality: string;
      scenarioTargets: string;
      baseVsWfv: string;
      moat: string;
      calibration: string;
      technicalCorridors: string;
    };
    section1: {
      title: string;
      desc: string;
      formulaLabel: string;
      formula: string;
      shockLabel: string;
      exposureLabel: string;
      elasticityLabel: string;
      exampleTitle: string;
      exampleExposure: string;
      exampleElasticity: string;
      exampleCut: string;
      exampleNetShock: string;
      exampleStressedRev: string;
    };
    section2: {
      title: string;
      desc: string;
      formulaLabel: string;
    };
    section3: {
      title: string;
      desc: string;
      caseStudyTitle: string;
      caseStudyText: string;
    };
    section4: {
      title: string;
      desc: string;
      bullTitle: string;
      bullDesc: string;
      baseTitle: string;
      baseDesc: string;
      panicTitle: string;
      panicDesc: string;
      asymmetryTitle: string;
      asymmetryDesc: string;
    };
    section5: {
      title: string;
      desc: string;
      baseTitle: string;
      baseBadge: string;
      baseDesc: string;
      wfvTitle: string;
      wfvBadge: string;
      wfvDesc: string;
      callout: string;
    };
    section6: {
      title: string;
      desc: string;
      p1Title: string;
      p1Desc: string;
      p2Title: string;
      p2Desc: string;
      p3Title: string;
      p3Desc: string;
      p4Title: string;
      p4Desc: string;
      p5Title: string;
      p5Desc: string;
    };
    section7: {
      title: string;
      desc: string;
      formulaLabel: string;
      p1Title: string;
      p1Desc: string;
      p2Title: string;
      p2Desc: string;
      p3Title: string;
      p3Desc: string;
      p4Title: string;
      p4Desc: string;
      caseStudyTitle: string;
      caseStudyText: string;
      interviewTitle: string;
      interviewWhyTitle: string;
      interviewWhyText: string;
      interviewRoadmapTitle: string;
      interviewRoadmapText: string;
    };
    section8: {
      title: string;
      desc: string;
      formulaLabel: string;
      pivotsTitle: string;
      pivotsDesc: string;
      volumePocTitle: string;
      volumePocDesc: string;
      confluenceTitle: string;
      confluenceDesc: string;
      tier1Title: string;
      tier1Desc: string;
      tier2Title: string;
      tier2Desc: string;
      tier3Title: string;
      tier3Desc: string;
    };
    cta: {
      title: string;
      desc: string;
      backBtn: string;
      githubBtn: string;
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
      cockpit: "Model",
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
      settingsPage: "Settings & Preferences",
      language: "Language",
      theme: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      themeDarkShort: "Dark",
      themeLightShort: "Light",
      themeCyber: "Dark",
      themeCyberShort: "Dark",
      toggleTheme: "Toggle Theme (Dark / Light)",
      shortcuts: "Keyboard Shortcuts",
      watchlist: "Watchlist",
      addToWatchlist: "Add to Watchlist (F)",
      removeFromWatchlist: "Remove from Watchlist (F)",
      bookmarked: "Watchlisted",
      bookmark: "Watchlist",
      addedToWatchlistToast: (ticker: string) => `Added ${ticker} to Watchlist`,
      removedFromWatchlistToast: (ticker: string) =>
        `Removed ${ticker} from Watchlist`,
      signInRequiredToast:
        "Sign in required to save stocks to database watchlist",
      quarterHistory: "Quarterly Reports",
      latestBadge: "Latest",
      historicalBadge: "Historical",
      historicalBanner: (quarter: string, date?: string) =>
        `Historical Analysis: Viewing ${quarter}${date ? ` (Filed: ${date})` : ""}. Model reflects point-in-time snapshot.`,
      jumpToLatest: (quarter: string) => `Jump to Latest (${quarter})`,
      quartersAvailable: (count: number) =>
        `${count} ${count === 1 ? "quarter" : "quarters"} available`,
      noEarlierQuarters: "No earlier quarterly reports in archive",
      mobileMenu: "Menu",
      closeMenu: "Close",
      navigation: "Navigation",
      modelNavTooltip: (ticker?: string) =>
        ticker ? `Return to ${ticker} Model (M)` : "Valuation Model (M)",
    },
    selector: {
      selectReport: "Select Stock...",
      availableReports: "Covered Stocks",
      noReportsFound: "No stocks found in coverage",
      refreshTitle: "Refresh coverage list",
      openScreener: "Open Stock Screener",
      watchlistSection: "Pinned Watchlist",
      allReportsSection: "All Covered Stocks",
      starredTooltip: "Toggle Watchlist",
      quartersCount: (count: number) =>
        `${count} ${count === 1 ? "Quarter" : "Quarters"}`,
      searchPlaceholder: "Search ticker, company or quarter...",
      collapseQuarters: "Collapse quarters",
      expandQuarters: (count: number) => `View all ${count} quarters`,
      showingUniverseSummary: (shown: number, total: number) =>
        `Showing ${shown} of ${total} companies · Type to search universe...`,
    },
    cockpit: {
      title: "Stress Test Model",
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
      valuationRegimes: "Scenario Target Prices",
      current: "Current",
      currentPrice: "Last Close",
      currentPriceTooltip:
        "Price as of last market close (EOD). Live intraday pricing is not streaming.",
      weightedFairValue: "Weighted Fair Value",
      wfvShort: "WFV",
      regimes: {
        bull: "🐂 Bull",
        base: "⚖️ Base",
        bear: "🐻 Bear",
        panic: "🚨 Panic",
        panicFloorLabel: "Panic Floor",
      },
      asymmetry: {
        upsideToBull: "Upside to Bull",
        downsideToPanic: "Downside to Panic",
        pricedInMultiple: "Priced-in Multiple",
        asymmetrySkew: "Risk / Reward Ratio",
      },
      upstreamTitle: "Demand & Volume Drivers",
      exposure: "Exposure",
      elasticity: "Elasticity",
      accountingTitle: "Cost & Margin Controls",
      grossMarginPerturbation: "Gross Margin Adjustment",
      fixedOpexShift: "Fixed OpEx Adjustment",
      metadata: {
        baseRev: "Base Rev",
        shares: "Shares",
        tax: "Tax",
      },
      guardrail: {
        title: "Earnings Quality Audit",
        description:
          "GAAP adjustments isolating non-operating or one-off items:",
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
      mobileCockpitTab: "Model",
      mobileWorkspacesTab: "Deep Dive",
      exploreWorkspaces: "Explore 7 Intelligence Workspaces",
      adjustShocks: "Adjust Stress Shocks",
      quickSummary: "Live Valuation Snapshot",
    },
    shortcuts: {
      title: "Keyboard Shortcuts",
      tabSwitch: "Switch Tabs (1–6)",
      resetModel: "Reset Model (R)",
      toggleMemo: "Toggle Model / Memo (M)",
      toggleLang: "Toggle Language (L)",
      exportCard: "Export Social Media Card (E)",
      openSnowflake: "Snowflake Analysis (W)",
      toggleScreener: "Toggle Stock Screener (S)",
      toggleFavorite: "Toggle Watchlist / Favorite (F)",
      close: "Close Dialog (Esc / ?)",
      prevNextTab: "Prev / Next Workspace ([ / ])",
      returnToModel: "Return to Model (M)",
    },
    snowflake: {
      title: "Snowflake Analysis",
      subtitle: "5-Pillar Company Quality & Valuation Audit",
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
      currentPriceTooltip: "Price as of last market close (EOD)",
      panicFloor: "🚨 Panic Floor",
      base: "⚖️ Base",
      bullRegime: "🐂 Bull Regime",
    },
    technicalLevels: {
      cardTitle: "Key Support & Resistance",
      badgeTitle: "S/R Matrix",
      supportTitle: "Key Support",
      resistanceTitle: "Key Resistance",
      confluenceTitle: "Valuation Confluence",
      confluenceBadge: "⚡ CONFLUENCE DETECTED",
      confluenceDesc: (
        techLabel: string,
        techPrice: string,
        fundRegime: string,
        fundPrice: string,
        diffPct: string
      ) =>
        `${techLabel} (${techPrice}) converges with ${fundRegime} (${fundPrice}) within ${diffPct}%`,
      levelNames: {
        sma50: "50-Day SMA",
        sma200: "200-Day SMA",
        high52: "52-Week High",
        low52: "52-Week Low",
        pivot_p: "Classical Pivot (P)",
        pivot_s1: "Pivot Support 1 (S1)",
        pivot_r1: "Pivot Resistance 1 (R1)",
        pivot_s2: "Pivot Support 2 (S2)",
        pivot_r2: "Pivot Resistance 2 (R2)",
        pivot_s3: "Pivot Support 3 (S3)",
        pivot_r3: "Pivot Resistance 3 (R3)",
        gap_fill: "Gap Fill Target (Prior Close)",
        gap_boundary: "Gap Day Boundary",
        volume_poc: "1-Year Volume POC",
        avwap_high: "Anchored VWAP (52W High)",
        avwap_volume: "Anchored VWAP (Max Volume)",
        swing_high: "Fractal Swing High",
        swing_low: "Fractal Swing Low",
      },
      types: {
        support: "Support",
        resistance: "Resistance",
        pivot: "Pivot",
      },
      importance: {
        major: "Major",
        intermediate: "Intermediate",
        minor: "Minor",
      },
      noData: "Technical levels data not yet synced for this ticker.",
      distance: "Distance",
      tooltip: "Pure deterministic technical levels & fundamental confluence",
      zone: "Zone",
      zoneBadge: "Zone Band",
      zoneDesc: (count: number) => `${count} clustered levels`,
      corridors: {
        title: "Institutional Price Corridors",
        badge: "3-Tier Hierarchy",
        viewCorridors: "3-Tier Corridors",
        viewAllLevels: "All Levels",
        s1Title: "Immediate Shelf",
        s1Desc: (low: string, high: string) =>
          `Intraday capitulation low (${low}) & Pivot S1 (${high})`,
        s2Bedrock: "Cycle Bedrock Floor",
        s2BedrockDesc: (low: string, high: string) =>
          `52-Week Low (${low}) & Structural S3 (${high})`,
        s2Structural: "Structural Pivot Floor",
        s2StructuralDesc: (low: string, high: string) =>
          `Multi-day swing shelf & secondary pivot support (${low} – ${high})`,
        s3Breakdown: "Downside Breakdown Extension",
        s3BreakdownDesc: (low: string, high: string) =>
          `Measured-move breakdown target if 52W low fails (${low} – ${high})`,
        s3Macro: "Macro Bedrock Floor",
        s3MacroDesc: (low: string, high: string) =>
          `Macro cycle liquidity floor & downside safety anchor (${low} – ${high})`,
        r1Title: "Immediate Ceiling",
        r1Desc: (low: string, high: string) =>
          `Post-drop intraday high (${high}) & Pivot R1 (${low})`,
        r2Gap: "Trapped Supply & Gap Top",
        r2GapDesc: (low: string, high: string) =>
          `Volume POC (${low}) up to pre-earnings close (${high})`,
        r2Structural: "Structural Volume Ceiling",
        r2StructuralDesc: (low: string, high: string) =>
          `High-volume node & secondary resistance band (${low} – ${high})`,
        r3Sma: "Major Trend Confluence",
        r3SmaDesc: (low: string, high: string) =>
          `50-Day (${low}) & 200-Day SMA (${high}) confluence (Death Cross Zone)`,
        r3High: "Cycle / 52W High Ceiling",
        r3HighDesc: (low: string, high: string) =>
          `52-Week cycle ceiling & multi-month resistance (${low} – ${high})`,
      },
      openFullAnalysis: "Full Chart & Analysis →",
      compactSummary: "S/R Telemetry",
      spot: "Spot",
      openChartTab: "Open Interactive Chart & 3-Tier Corridors (Tab 2) →",
    },
    tabs: {
      valuation: "Valuation & Scenarios",
      technicals: "Technicals & Chart",
      estimates: "Analyst Estimates",
      moat: "Moat & Peers",
      segments: "Segments & Financials",
      catalysts: "Catalysts & Risks",
      news: "News & Pulse",
      audit: "Earnings Audit",
      report: "Raw Filings & Notes",
      scenarios: "Valuation & Scenarios",
      sensitivity: "Sensitivity Heatmap",
      tone: "Management Tone",
      filing: "10-Q Risks",
      reactions: "Historical Reactions",
      shortValuation: "Valuation",
      shortTechnicals: "Technicals",
      shortEstimates: "Estimates",
      shortMoat: "Moat",
      shortSegments: "Segments",
      shortCatalysts: "Catalysts",
      shortAudit: "Audit",
      shortNews: "News",
      shortReport: "Notes",
      nextTab: "Next Workspace",
      prevTab: "Prev Workspace",
      allTabs: "All Workspaces",
      tabNumber: (current: number, total: number) =>
        `Workspace ${current} of ${total}`,
    },
    technicalsTab: {
      title: "Technical Analysis & Chart",
      subtitle:
        "Real-time candlestick price action, classical pivots, volume profile POC, and fundamental confluence.",
      chartCardTitle: "Live Interactive Chart",
      chartCardSubtitle:
        "Institutional TradingView charting with volume, moving averages, and technical indicators.",
      corridorsCardTitle: "Institutional Price Corridors & Confluence",
      corridorsCardSubtitle:
        "3-tier S/R hierarchy synthesized with quantitative valuation regimes.",
      confluenceSectionTitle: "Fundamental-Technical Confluence Signals",
      confluenceEmpty:
        "No direct regime confluence detected within ±2.5% tolerance band.",
      trendBullish: "Bullish Trend (Above 200 SMA)",
      trendBearish: "Bearish Trend (Below 200 SMA)",
      distanceTo52WHigh: "from 52W High",
      distanceTo52WLow: "from 52W Low",
      volumePoc: "1-Yr Volume POC",
      tradingViewWatermark: "Powered by TradingView",
    },
    newsTab: {
      title: "Real-Time News & Catalyst Intelligence",
      subtitle:
        "Filtered market events and fundamental transmission vectors. Simulate implied price and multiple shifts directly in the model.",
      empty:
        "No material market events recorded for this stock in the current window.",
      latestPulse: "Latest Market Pulse",
      transmissionChannel: "Transmission Channel",
      simulateButton: "Simulate in Model",
      simulateTooltip: "Load implied shocks directly into model sliders",
      viewSource: "View Source",
      wfvImpact: "Implied WFV Impact",
      priceReaction: "Price Move",
      abnormalMove: "Abnormal Return",
      allFilter: "All Events",
      upstreamFilter: "Upstream & Supply Chain",
      productFilter: "Product Releases",
      analystFilter: "Analyst Actions",
      secFilter: "SEC Filings",
      channels: {
        driverShock: "Upstream Driver Shock",
        catalystProb: "Catalyst Probability Shift",
        qpceSkew: "Wall Street Consensus Skew",
        segmentGrowth: "Segment TAM Revision",
        none: "Qualitative Context",
      },
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
      filterAll: "All",
      filterBuy: "Buy",
      filterHold: "Hold",
      filterSell: "Sell",
      searchPlaceholder: "Search firm or analyst...",
      emptySearch: "No matching analyst estimates found",
      currentPriceLabel: "Current",
      searchGoogle: (firm: string) => `Search ${firm} research on Google`,
      consensusMean: "Consensus Target Mean",
      spreadRatio: "Spread (High/Low)",
      sentimentMomentum: "Wall Street Sentiment Momentum",
      highConvictionBullish: "🔥 High Conviction Bullish",
      moderateBull: "Moderate Bull",
      divergentSentiment: "Divergent",
      consensusAnatomy: "Consensus Anatomy",
      streetHigh: "Street High",
      streetLow: "Street Low",
      targetSpread: "Target Spread",
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
      wideMoat: "Wide Moat",
      narrowMoat: "Narrow Moat",
      noMoat: "No Moat",
      trendWidening: "Widening",
      trendNarrowing: "Narrowing",
      trendStable: "Stable",
      colProductComparison: "Product Comparison",
      colAdvantageVulnerability: "Key Advantage / Vulnerability",
      viewYahoo: (ticker: string) => `View ${ticker} on Yahoo Finance`,
      durabilityYearsSuffix: "Years",
      peersCountSuffix: "Peers",
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
      variantPerceptionTitle: "Variant Perception & Consensus Audit",
      variantPerceptionSubtitle:
        "Detailed decomposition of why StressAlpha WFV diverges from Wall Street consensus price targets.",
      dataCompletenessBadge: (
        score: number,
        populated: number,
        total: number
      ) => `${score}% Audited (${populated}/${total} Modules)`,
      divergenceLabels: {
        in_line: "In-Line with Consensus",
        moderate_alpha: "Moderate Variant Perception",
        high_conviction_alpha: "High-Conviction Alpha Opportunity",
        extreme_divergence: "Extreme Consensus Divergence",
      },
      divergenceAttributionTitle: "Divergence Decomposition",
      baseMultipleVsStreet: "Base Multiple vs Street",
      regimeStressImpact: "Regime Stress Impact",
      modelStanceTitle: "Model Analytical Stance",
      dataNotesTitle: "Data Quality & Invariant Notes",
      closeModal: "Close",
      revisionsLedgerTitle: "Valuation Revision Ledger",
      revisionsLedgerSubtitle:
        "Immutable audit trail of event-driven valuation adjustments",
      revisionsEmpty:
        "No historical valuation revisions recorded yet. Revisions are logged upon fundamental shocks or quarterly filings.",
      colRevisionDate: "Revision Date",
      colRevisionTrigger: "Trigger",
      colRevisionHeadline: "Event & Rationale",
      colRevisionShift: "Valuation Shift",
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
      behavioralDimensions: "Executive Behavioral Dimensions (1-10 Scale)",
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
      title: "Historical Earnings Reactions",
      subtitle: "Post-earnings 1-day stock moves and earnings call context.",
      empty: "No historical earnings reactions data available for this report.",
      colDate: "Report Date",
      colEvent: "Event / Quarter",
      colMove: "Day 1 Move",
      colContext: "Context & Primary Driver",
    },
    sensitivityTab: {
      title: "Valuation Sensitivity Matrix",
      subtitle:
        "Target price impact from incremental changes in margin and demand.",
      empty: "No sensitivity matrix data available for this report.",
      sensitivitySuffix: "Sensitivity",
      deltaFairValue: "Δ Target Fair Value",
    },
    memo: {
      backToCockpit: "Back to Model",
      enMemoBtn: "English Memo",
      zhMemoBtn: "🇨🇳 中文备忘录",
      printPdf: "Print / Export PDF Memo",
      committeeMemo: "StressAlpha Investment Committee Memorandum",
      decisionAudit: "Decision Audit",
      reportDate: "Report Date",
      generatedVia: "Generated via Deterministic Stress Engine",
      currentStock: "Current Stock",
      weightedFairValue: "Weighted Fair Value",
      sec1Title: "1. Executive Summary & Synthesis",
      sec2Title: "2. Scenario Target Prices & Stress Valuation",
      sec3Title: "3. Earnings Quality & Core Adjustments",
      sec4Title: "4. Key Catalysts & Scenario Probabilities",
      secMoatTitle: "5. Economic Moat & Competitor Comparison",
      secEstimatesTitle: "5b. Wall Street Analyst Targets & Consensus",
      sec5Title: "6. Key Regulatory & Business Risks",
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
      confidentialBadge: "CONFIDENTIAL • INVESTMENT COMMITTEE USE ONLY",
      docClassification: "Institutional Fundamental Equity Stress Research",
      footerMethodologyTitle: "Deterministic Arithmetic Engine",
      footerMethodology:
        "100% Deterministic Financial Arithmetic — Pure TypeScript sensitivity flow-through, zero LLM mathematical hallucinations. Multi-factor volume shocks, operating leverage rigidity, and risk/reward asymmetry ratios are calculated strictly by StressAlpha Engine.",
      footerDisclaimerTitle: "Governance & Institutional Audit Trail",
      footerDisclaimer:
        "For institutional investment research and scenario stress testing purposes only. Not investment advice or solicitation. Sourced from SEC Form 10-K / 10-Q filings, transcripts, and audited market consensus data.",
      docId: "Document ID",
      footerAuditStatus:
        "Pillar Simplex Calibration: Convex Regularization [0.05, 0.85] | Data Integrity: 100%",
      printGeneratedOn: "Generated via StressAlpha Institutional Cockpit",
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
      title: "Stock Screener & Valuation",
      subtitle:
        "Compare fundamentals, valuation upside, and moat ratings across covered stocks",
      searchPlaceholder: "Search ticker or company name...",
      filterAll: "All",
      filterAllTooltip: "Show all covered stocks without valuation filter",
      filterUndervalued: "Undervalued",
      filterUndervaluedTooltip:
        "Filter for undervalued stocks with implied upside > 0%",
      filterHighUpside: ">20% Upside",
      filterHighUpsideTooltip:
        "Filter for high-conviction alpha opportunities with upside > 20%",
      allMoats: "All Moats",
      allMoatsTooltip: "Show all economic moat ratings",
      wideMoat: "Wide Moat",
      wideMoatTooltip:
        "Filter for Wide Economic Moat companies (durable competitive advantages)",
      narrowMoat: "Narrow",
      narrowMoatTooltip: "Filter for Narrow Economic Moat companies",
      colTicker: "Ticker",
      colTickerTooltip:
        "Company ticker symbol and legal entity name. Click to sort.",
      colCompany: "Company",
      colSnowflake: "Snowflake",
      colSnowflakeTooltip:
        "30-point Snowflake Fundamental Health Score (0-30) across Valuation, Growth, Quality, Moat, and Resilience. Click to sort.",
      colMoat: "Moat",
      colMoatTooltip:
        "Economic Moat rating (Wide, Narrow, None) and dynamic trend (↗ Widening, → Stable, ↘ Narrowing) indicating competitive trajectory. Click to sort.",
      colPrice: "Price",
      colPriceTooltip: "Latest traded market stock price. Click to sort.",
      colAnalystTarget: "Analyst Target",
      colAnalystTargetTooltip:
        "Wall Street sell-side consensus 12-month target price and implied upside. Click to sort.",
      colConsensusSpread: "Consensus Spread",
      colBaseFairValue: "Base Target",
      colBaseFairValueTooltip:
        "Base Case fair value under normalized guidance execution. Click to sort.",
      colWeightedFairValue: "Weighted FV",
      colWeightedFairValueTooltip:
        "Probability-weighted fair value (WFV) across Bull, Base, Bear, and Panic stress regimes. Click to sort.",
      colUpside: "Implied Upside",
      colOperatingMargin: "Op. Margin",
      colOperatingMarginTooltip:
        "Normalized operating profit margin (Operating Income / Revenue). Click to sort.",
      colRevenueGrowth: "Rev Growth",
      colRevenueGrowthTooltip:
        "Quarterly year-over-year revenue growth velocity. Click to sort.",
      colValuationRange: "Stress Range",
      colAction: "Action",
      viewCards: "Cards",
      viewTable: "Table",
      openCockpit: "Model",
      openMemo: "Memo",
      openCockpitTooltip: (ticker: string) => `Open ${ticker} Model`,
      statsCoverage: "Tracked Stocks",
      statsAvgUpside: "Avg. Weighted Upside",
      statsAvgUpsideSub: "Probability-weighted upside",
      statsTopPick: "Highest Upside",
      statsWideMoat: "Wide Moat Share",
      statsWideMoatSub: (count: number, total: number) =>
        `${count} of ${total} wide moats`,
      noResults: "No companies match your filters.",
      resetFilters: "Reset Filters",
      resultsCount: (shown: number, total: number) =>
        `Showing ${shown} of ${total} tickers`,
      loadAll: (total: number) => `Load all (${total})`,
      filterWatchlist: "Watchlist",
      colFavorite: "Watch",
      watchlistEmptyTitle: "Your Watchlist is Empty",
      watchlistEmptyDesc:
        "Star companies in the table or press [F] in the model to curate your focus universe.",
      viewAllReports: "View All Reports",
      watchlistCount: (count: number) => `Watchlist (${count})`,
      bearLabel: "Bear",
      baseLabel: "Base",
      bullLabel: "Bull",
      currentPriceLabel: "Current",
      analystsLabel: "analysts",
      rangeTooltip: "Stress Range (Bear ↔ Base ↔ Bull)",
      rangeBearBullHint: "(bear ↔ bull)",
      sortPrompt: "Sort By",
      loading: "Loading stock reports...",
    },
    watchlistPage: {
      title: "Equity Watchlist",
      subtitle:
        "Real-time tracking of valuation spreads, 5-pillar snowflake health, and sell-side consensus divergence for your core equity coverage.",
      statsTracked: "Tracked Equities",
      statsAvgUpside: "Avg Fair Value Upside",
      statsConvictionLeader: "Conviction Leader",
      statsWideMoat: "Wide Moat Share",
      statsAvgSnowflake: "Avg Snowflake Health",
      searchPlaceholder: "Filter watchlist by ticker, company, or tier...",
      emptyTitle: "No Equities in Your Watchlist",
      emptyDesc:
        "Star companies in the Screener or report selector to monitor their real-time valuation spreads, 4-regime stress test boundaries, and Wall Street divergence.",
      exploreScreenerBtn: "Explore Screener Universe",
      quickAddSuggestions: "Popular Equities to Track",
      viewCards: "Deep Dive Cards",
      viewTable: "Matrix Table",
      regimeSpectrum: "4-Regime Valuation Bounds",
      consensusDivergence: "Sell-Side Variant Perception",
      snowflakeBreakdown: "30-Point Snowflake Health",
      operationalMomentum: "Growth & Margin Velocity",
      quarterlyHistory: "Historical Quarters",
      removeFromWatchlist: "Remove from Watchlist",
      openCockpit: "Stress Model",
      openMemo: "Research Memo",
      colMoat: "Moat",
      colPrice: "Current Price",
      colWfv: "Weighted Fair Value",
      colBaseFv: "Base Fair Value",
      colConsensus: "Consensus Target",
      colDivergence: "Consensus Spread",
      colGrowthMargin: "Growth & Margin",
      colSnowflake: "Snowflake Health",
      colActions: "Actions",
      divergenceTiers: {
        in_line: "In Line",
        moderate_alpha: "Moderate Alpha",
        high_conviction_alpha: "High Conviction Alpha",
        extreme_divergence: "Extreme Divergence",
      },
      pillarLabels: {
        valuation: "Valuation & Safety",
        future: "Growth & Catalysts",
        earnings: "Earnings Quality",
        moat: "Economic Moat",
        resilience: "Downside Floor",
      },
      noFilterMatches: "No tracked equities match your filters.",
      resultsCount: (shown: number, total: number) =>
        `Showing ${shown} of ${total} tickers`,
      loadAll: (total: number) => `Load all (${total})`,
    },
    socialCard: {
      modalTitle: "Share Analysis & Export Cards",
      modalSubtitle:
        "Copy interactive scenario link or generate high-resolution visual cards for Twitter/X, LinkedIn, and Instagram.",
      templates: {
        valuation: "Valuation & Stress",
        valuationDesc:
          "Fair value upside, price target scenarios, and key stress drivers",
        earnings: "Earnings Scorecard",
        earningsDesc:
          "Revenue growth, operating margins, EPS beat/miss, and segments",
        thesis: "Thesis & Catalysts",
        thesisDesc: "Economic moat rating, upside catalysts, and key risks",
        summary: "Executive Summary",
        summaryDesc: "All-in-one core fundamental and valuation snapshot",
        snowflake: "Snowflake Radar",
        snowflakeDesc: "5-Pillar company quality and valuation radar chart",
      },
      sections: {
        valuationHero: "Valuation & Price",
        valuationHeroDesc: "Current price, fair value, upside, and asymmetry",
        regimes: "Scenario Targets",
        regimesDesc: "Bull, Base, and Panic floor price targets",
        earnings: "Earnings Scorecard",
        earningsDesc: "Revenue, operating income, clean EPS audit",
        segments: "Segment Breakdown",
        segmentsDesc: "Revenue segment dynamics and growth",
        moat: "Economic Moat",
        moatDesc: "Moat rating, trend, and competitive sources",
        catalysts: "Catalysts & Risks",
        catalystsDesc: "Growth catalysts and downside fragility risks",
        snowflake: "Snowflake Radar",
        snowflakeDesc: "30-point 5-pillar fundamental quality radar",
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
        upsideTag: "UPSIDE",
        downsideTag: "DOWNSIDE",
        activeStressTag: "Live Stressed Scenario Applied",
        neutralStressTag: "Baseline Macro Neutral Model (0% Shocks)",
        bullRegimeDesc: "Multiple Expansion & High Growth",
        baseRegimeDesc: "Guidance Midpoint Execution",
        panicRegimeDesc: "Liquidity Defense Floor",
        quarterlyResultsTitle: "QUARTERLY OPERATIONAL RESULTS",
        marginLabel: "Margin",
        durabilityLabel: "durability",
        compositeScoreLabel: "Composite Score",
        fivePillarsTitle: "5-PILLAR FUNDAMENTAL AUDIT",
        segmentsTitle: "SEGMENT REVENUE DYNAMICS",
        competitiveAdvantageTitle: "COMPETITIVE ADVANTAGE & MOAT",
        catalystsTitle: "KEY CATALYSTS & FRAGILITY RISKS",
        growthCatalystLabel: "GROWTH CATALYST",
        downsideRiskLabel: "DOWNSIDE RISK",
        probabilityAnchoredLabel: "Probability Anchored",
        grossMarginLabel: "Gross Margin",
        operatingMarginLabel: "Operating Margin",
        consensusTargetLabel: "Consensus Target",
        competitiveDynamicsLabel: "Strategic Competitive Thesis",
        peerBenchmarkLabel: "Peer Benchmark",
        revenueGuidanceLabel: "Guidance Range",
        noDataAvailable: "No data available",
        moatTrendLabel: "Moat Trend",
        priceSpectrumTrackLabel: "STRESS-ADJUSTED PRICE SPECTRUM",
        spreadLabel: "Spread",
        trailingPeLabel: "TTM P/E",
        forwardPeLabel: "Fwd P/E",
        fairPeLabel: "Fair P/E",
        marginOfSafetyLabel: "Margin of Safety",
        asymmetrySkewLabel: "Risk/Reward Asymmetry Skew",
        multipleSpreadLabel: "Multiple Expansion",
        stressOperatingFlowLabel: "Stressed Operating Baselines",
        bullUpsideLabel: "Bull Upside",
        panicDownsideLabel: "Panic Floor",
        gaapReportedEpsLabel: "GAAP Reported",
        adjustedSpreadLabel: "Quality Filter Adj",
        guidanceCorridorLabel: "Next Quarter Guidance",
        cleanConversionTitle: "CLEAN OPERATING EPS & GAAP RECONCILIATION",
        radarChartSubtitle: "Fundamental Radar",
        operatingIncomeGrowthLabel: "Op Income Growth",
        revenueVsEstimateLabel: "vs Consensus",
      },
    },
    auth: {
      signIn: "Sign In",
      signOut: "Sign Out",
      signUp: "Create Account",
      createAccount: "Sign Up",
      email: "Email",
      password: "Password",
      name: "Full Name",
      namePlaceholder: "e.g. Alex Smith",
      emailPlaceholder: "alex@example.com",
      passwordPlaceholder: "••••••••",
      signInTitle: "Sign In",
      signUpTitle: "Create Account",
      signInSubtitle:
        "Sign in to synchronize your stock watchlists and custom valuation parameters across devices.",
      signUpSubtitle:
        "Create an account to save your watchlists and custom valuation scenarios.",
      alreadyHaveAccount: "Already have an account? Sign in",
      dontHaveAccount: "Don't have an account? Sign up",
      loading: "Processing...",
      errorTitle: "Authentication Error",
      loginSuccess: "Signed in successfully",
      signupSuccess: "Account created successfully",
      signoutSuccess: "Signed out",
      cloudSyncActive: "Cloud Sync Active",
      cloudSyncTooltip: "Watchlist synchronized with Neon PostgreSQL",
      accountMenu: "Account Settings",
      profile: "Profile",
      guestUser: "Guest",
      syncing: "Syncing...",
      passwordHint: "(min. 6 characters)",
      passwordTooShort: "Password must be at least 6 characters.",
      invalidCredentials: "Invalid email or password.",
      invalidEmail: "Please enter a valid email address.",
      userAlreadyExists: "An account with this email already exists.",
      emailRequired: "Email address is required.",
      memberBadge: "Member",
    },
    settingsPage: {
      title: "Settings & Preferences",
      subtitle:
        "Manage account security, workspace display defaults, valuation parameters, and privacy controls.",
      backToModel: "Back to Valuation Model",
      backToScreener: "Back to Universe Screener",
      tabAccount: "Account & Profile",
      tabAppearance: "Appearance & Language",
      tabValuation: "Valuation Engine",
      tabPrivacy: "Privacy & Storage",
      tabSystem: "System & Info",
      account: {
        title: "Account & Security",
        description:
          "Manage your institutional profile, cloud database session, and authentication credentials.",
        notSignedIn: "Guest Workspace",
        notSignedInDesc:
          "You are browsing in guest mode. Sign in to synchronize your stock watchlists and custom stress scenarios across devices via Neon PostgreSQL.",
        signInButton: "Sign In or Register",
        nameLabel: "Display Name",
        emailLabel: "Email Address",
        showEmail: "Show email",
        hideEmail: "Hide email",
        emailPrivacyNotice:
          "Your email address is automatically concealed from header dropdowns and menus to protect your privacy during screen shares, presentations, and recordings.",
        statusLabel: "Cloud Sync Status",
        statusConnected: "Connected to Neon PostgreSQL",
        userIdLabel: "User Identifier",
        copyUserId: "Copy ID",
        copiedUserId: "Copied!",
        verifiedBadge: "Verified",
        unverifiedBadge: "Unverified",
        signOutButton: "Sign Out",
      },
      appearance: {
        title: "Appearance & Localization",
        description:
          "Customize visual color scheme, typography contrast, and language dictionary preferences.",
        languageTitle: "Interface Language",
        languageDesc:
          "Select your preferred language. All metrics, SEC audits, and analytical commentary adapt in real time.",
        langEnTitle: "English (US)",
        langEnDesc:
          "Institutional financial terminology, SEC 10-Q/10-K audit logs, and Wall St consensus spreads.",
        langZhTitle: "简体中文 (ZH)",
        langZhDesc:
          "全景中文财报审计、30项雪花图雷达、情景压力测试与护城河竞争格局深度分析。",
        themeTitle: "Theme",
        themeDesc:
          "Dual-theme engine with zero FOUC, optimized for prolonged buy-side research sessions.",
        themeDarkTitle: "Bloomberg Terminal Dark",
        themeDarkDesc:
          "Deep #07090e base, neon cyan accents, dark glassmorphism panels, and high-density financial typography.",
        themeLightTitle: "FactSet / WSJ Day Light",
        themeLightDesc:
          "Crisp #f8fafc daylight surfaces, high-contrast #0f172a typography, and calibrated WCAG AA financial indicators.",
      },
      valuation: {
        title: "Valuation & Stress Defaults",
        description:
          "Underlying mathematical models, probability calibration regimes, and accounting guardrails.",
        qpceTitle: "Deterministic Scenario Calibration Matrix",
        qpceDesc:
          "Scenario probabilities are calibrated using Softmax Multi-Regime Weighting with Tail Risk Heuristics across Bull, Base, Bear, and Panic Floor.",
        qpceFormula:
          "Simplex Invariant: Σ P_i = 1.000, P_i ∈ [0.05, 0.85] with 20% market-implied dampening regularization anchor.",
        guardrailTitle: "Income Quality & Operating EPS Guardrail",
        guardrailDesc:
          "Enforces non-GAAP operating purity by isolating core epsOperating from ASU 2016-01 mark-to-market fluctuations and non-operating windfalls.",
        feedsTitle: "Audited SEC & Financial Data Feeds",
        feedsDesc:
          "Deterministic quantitative data ingestion pipeline with zero LLM math hallucinations.",
        feedsMassive:
          "Massive.com — Point-in-time financial statements, segment breakdowns, and historical ratios.",
        feedsFinnhub:
          "Finnhub.io — Audio earnings transcripts, SEC EDGAR filing links, and sell-side price targets.",
      },
      privacy: {
        title: "Privacy & Storage Management",
        description:
          "Institutional data privacy controls, navigation bar concealment, and local cache controls.",
        privacyFirstTitle: "Zero-Tracking Architecture",
        privacyFirstDesc:
          "StressAlpha does not sell user data, run third-party advertising pixels, or compromise financial research confidentiality.",
        dropdownPrivacyTitle: "Menu Email Concealment",
        dropdownPrivacyDesc:
          "Account email addresses are omitted from header menus, mobile drawers, and quick controls by default to prevent shoulder-surfing and presentation leaks.",
        statusActive: "Active (Concealed)",
        cloudSyncTitle: "PostgreSQL Cloud Persistence",
        cloudSyncDesc:
          "Watchlists and user records are stored with row-level association in Neon serverless PostgreSQL.",
        clearCacheTitle: "Reset Local Preferences & Cache",
        clearCacheDesc:
          "Clear cached report slugs, temporary scenario sliders, and local storage keys without signing out.",
        clearCacheButton: "Clear Local Cache",
        clearCacheSuccess: "Local cache successfully reset.",
      },
      system: {
        title: "System & Architecture",
        description:
          "Platform versioning, deterministic engines, and institutional documentation links.",
        versionLabel: "Platform Version",
        engineLabel: "Deterministic Engines",
        databaseLabel: "Database Engine",
        methodologyLink: "Interactive Methodology Guide",
        githubLink: "Open Source GitHub Repository",
        shortcutsButton: "View Keyboard Shortcuts",
      },
    },
    methodologyPage: {
      backToModel: "Back to Model",
      engineTag: "METHODOLOGY",
      badge: "Mathematical Engine & Valuation Logic",
      title: "Deterministic Valuation & Stress Simulation Methodology",
      subtitle:
        "Unlike black-box AI financial chatbots, StressAlpha confines LLMs exclusively to structured artifact extraction and risk disclosure audits. All P&L flow-through calculations, operating leverage, EPS normalization, and scenario valuation trees are executed by a client-side deterministic arithmetic engine in sub-milliseconds.",
      nav: {
        demand: "1. Demand & Volume Drivers",
        operatingLeverage: "2. Operating Leverage",
        earningsQuality: "3. Earnings Quality & EPS",
        scenarioTargets: "4. Scenario Targets & Risk/Reward",
        baseVsWfv: "5. Base FV vs. WFV",
        moat: "6. Economic Moat",
        calibration: "7. Scenario Calibration Matrix",
        technicalCorridors: "8. Technical Corridors & Confluence",
      },
      section1: {
        title: "1. Upstream Demand Shock Flow-Through",
        desc: "Hyper-growth tech enterprises are tethered to upstream capital spending or enterprise budget trends. StressAlpha pairs each upstream macroeconomic driver (e.g. Big-4 Hyperscaler CapEx, CoWoS packaging yield, enterprise IT budgets) with an Exposure share and an Elasticity coefficient.",
        formulaLabel: "FORMULA",
        formula:
          "Stressed_Revenue = Base_Revenue × [ 1 + ∑ (Shock_i × Exposure_i × Elasticity_i) ]",
        shockLabel: "Adjustment (%)",
        exposureLabel: "Revenue exposure [0, 1]",
        elasticityLabel: "Sensitivity multiplier",
        exampleTitle: "Example: NVIDIA (NVDA Q2 2027)",
        exampleExposure:
          "NVDA Data Center revenue represents 85% of sales (0.85 exposure) with an elasticity of 1.15. If cloud hyperscalers cut AI CapEx by -15%:",
        exampleElasticity: "1.15",
        exampleCut: "-15%",
        exampleNetShock: "Net Shock = -15% × 0.85 × 1.15 = -14.66%.",
        exampleStressedRev:
          "Stressed Revenue = $30.04B × (1 - 14.66%) = $25.63B.",
      },
      section2: {
        title: "2. Operating Leverage & Cost Structure",
        desc: "When top-line sales decline, fixed overhead (R&D amortization, data center leases, base compensation) does not scale down linearly. This triggers an amplified collapse in operating profit (operating leverage). StressAlpha decomposes costs into variable COGS and rigid fixed OpEx, enabling independent margin stress tests. Crucially for institutional investment committees, StressAlpha extends beyond P&L accounting to quantify Free Cash Flow (FCF) conversion, CapEx intensity, and working capital drag across all stress regimes.",
        formulaLabel: "FORMULAS",
      },
      section3: {
        title: "3. Earnings Quality Audit & Clean Operating EPS",
        desc: "Headline GAAP diluted earnings are frequently distorted by non-operating mark-to-market revaluations, litigation settlements, or paper investment marks. Valuing a company on contaminated headline EPS produces severe mispricings.",
        caseStudyTitle:
          "Case Study: Amazon (AMZN Q2 2026) ASU 2016-01 Distortion",
        caseStudyText:
          "Amazon reported headline GAAP diluted EPS of $5.49, seemingly crushing consensus. However, forensic analysis reveals a $53.4B unrealized paper mark on its Anthropic investment under ASU 2016-01. StressAlpha's guardrail automatically isolates and strips this one-time non-operating distortion, revealing Amazon's true sustainable operating EPS was $1.26.",
      },
      section4: {
        title: "4. Scenario Target Prices & Risk/Reward Ratio",
        desc: "Disciplined equity investing is not about predicting a single target point; it is about quantifying risk/reward asymmetry across multiple market regimes:",
        bullTitle: "Bull Regime",
        bullDesc: "Accelerating growth with multiple expansion.",
        baseTitle: "Base Regime",
        baseDesc:
          "Execution on baseline guidance at normalized historical P/E.",
        panicTitle: "Panic Floor",
        panicDesc: "Macro recession and multiple compression to cycle trough.",
        asymmetryTitle: "Risk / Reward Ratio",
        asymmetryDesc:
          "Measures the ratio of upside gain potential in the Bull regime versus drawdown exposure to the Panic Floor. A skew above 2.0x indicates an attractive margin of safety.",
      },
      section5: {
        title: "5. Base Fair Value vs. Weighted Fair Value (WFV)",
        desc: "These are the two anchor valuation figures featured in the Stock Screener and Valuation Model:",
        baseTitle: "Base Fair Value",
        baseBadge: "Single-Point Baseline",
        baseDesc:
          "The implied share price under the single most likely baseline scenario (management guidance execution).",
        wfvTitle: "Weighted Fair Value (WFV)",
        wfvBadge: "Expected Payoff Simplex",
        wfvDesc:
          "The probability-weighted expected payoff integrating Bull, Base, and Bear scenario distributions.",
        callout:
          "💡 When an enterprise possesses positive skew (e.g. NVIDIA's open-ended AI compute tailwind), the Weighted Fair Value exceeds Base Fair Value because the massive Bull upside pulls the probability distribution up.",
      },
      section6: {
        title: "6. 5-Pillar Economic Moat Framework",
        desc: "Financial figures only record backward-looking quarterly performance. Economic moats determine how long a firm can defend excess returns (ROIC > WACC). StressAlpha evaluates moats across five structural pillars:",
        p1Title: "1. Intangible Assets",
        p1Desc: "Patents, proprietary tech, brands.",
        p2Title: "2. Switching Costs",
        p2Desc: "Developer lock-in, deep integrations.",
        p3Title: "3. Cost Advantage",
        p3Desc: "Purchasing scale, superior unit economics.",
        p4Title: "4. Network Effects",
        p4Desc: "Two-sided developer & hardware flywheels.",
        p5Title: "5. Efficient Scale",
        p5Desc: "Capital intensity deterring new entrants.",
      },
      section7: {
        title: "7. Deterministic Scenario Calibration Matrix",
        desc: "Traditional financial models often rely on naive, symmetrical priors (e.g., 25% Bull / 50% Base / 25% Panic). When a company suffers severe auditor resignations, DOJ probes, or razor-thin margins, uncalibrated models produce dangerously distorted 'False Alpha'. StressAlpha rejects academic window dressing in favor of a pure deterministic TypeScript Softmax Multi-Regime Weighting with Tail Risk Heuristics: scenario priors are mapped into Log-Odds space, modified across 4 institutional pillars with deterministic shifts, and resolved via temperature-controlled Softmax with simplex contraction.",
        formulaLabel: "LOG-ODDS & SOFTMAX PROBABILITY SIMPLEX",
        p1Title: "Pillar 1: Forensic & Governance Tail Veto",
        p1Desc:
          "Severe governance flags or forensic accounting probes impose asymmetric log-odds shifts (Δz_panic = +1.35, Δz_bull = -1.60) and enforce an institutional fiduciary veto (Panic floor ≥ 45%, Bull cap ≤ 8%, margin buffers disabled). Governance failures are existential downside tail events that no operational margin cushion can offset.",
        p2Title: "Pillar 2: Archetype-Aware Resilience & Capital Runway",
        p2Desc:
          "Categorizes equities into 3 valuation archetypes: 1) Compounder: Operating margins >30% rewarded, <15% penalized unless protected by Wide Moat (Costco Exemption); 2) Operating Scaler: Growth ≥25% and gross margin ≥60% rewarded for operating leverage acceleration; 3) Venture Hypergrowth: High growth (≥50%) scale-ups with negative operating income (e.g. ONDS). Gated by a ≥35% gross margin floor to grant the Unit Economics Exemption; audited for Net Liquid Cash Runway: runways <9 months incur an acute +1.25 Panic logit penalty to reflect emergency secondary equity dilution.",
        p3Title: "Pillar 3: Sell-Side Consensus Skew & Dispersion",
        p3Desc:
          "Ingests consensus rating skew and target price dispersion ((High - Low) / Mean). Overwhelming buy conviction (≥80%) boosts Bull logits, while extreme target dispersion (>0.80) widens tail regime weights to capture market disagreement and consensus overcrowding.",
        p4Title: "Pillar 4: Market-Implied Risk Anchor & Regularization",
        p4Desc:
          "Reverse-engineers the disaster probability priced in by the current market. The parameter w_mkt = 0.20 functions as an empirical dampening regularization weight rather than an unproven prior distribution: it anchors 20% to real-time market pricing to prevent dogmatic detachment from reality while preserving 80% model weight for independent fundamental alpha.",
        caseStudyTitle:
          "Case Study: Super Micro Computer (SMCI Q4 2026) Governance Calibration",
        caseStudyText:
          "SMCI traded at $41.54. Uncalibrated priors assigned 25% Bull ($104) / 50% Base ($59.40) / 25% Panic ($19.00), producing an uncalibrated WFV of $60.45 (+45.5% False Alpha) despite active forensic accounting investigations. The Scenario Calibration Matrix detected severe governance risk and thin 13.5% gross margins, triggering the Lexicographic Veto to calibrate probabilities to: Panic 75.0% / Base 17.0% / Bull 8.0%. This adjusted Weighted Fair Value to $31.91 (-23.2% real downside risk), accurately identifying asymmetric capital impairment danger.",
        interviewTitle:
          "Methodology Note & Interview Guidance: Heuristic Framing vs. Empirical Backtesting",
        interviewWhyTitle:
          "Why use heuristic logit shifts over unproven academic priors?",
        interviewWhyText:
          "In buy-side investment committee and quant research interviews, claiming an unsubstantiated “Bayesian posterior” without empirical distributions invites immediate skepticism. StressAlpha is intellectually honest: the baseline logit shifts (Δz) represent transparent institutional heuristic bounds modeling structural downside asymmetries (governance tail vetoes, acute dilution overhang).",
        interviewRoadmapTitle: "Empirical Calibration Roadmap:",
        interviewRoadmapText:
          "In systematic institutional production, these log-odds coefficients can be empirically tuned via multi-quarter historical earnings outturns, minimizing Brier scores (B = 1/N ∑ (p_i - o_i)²) and multinomial log-loss across coverage constituents to achieve data-driven parameter convergence.",
      },
      section8: {
        title: "8. Deterministic Price Corridors & Regime Confluence",
        desc: "Bridges fundamental stress-test valuations with market microstructure. Synthesizes classical floor pivots, unfilled gap edges, 1-year volume profile Point of Control (POC), and Anchored VWAPs into a 3-tier price corridor hierarchy, auditing for direct convergence against fundamental valuation regimes.",
        formulaLabel: "Mathematical Formulations & Convergence Criteria",
        pivotsTitle: "Classical Pivot Extensions",
        pivotsDesc:
          "Computes standard floor trader pivots P = (H + L + C) / 3, S1 = 2P - H, R1 = 2P - L, S2 = P - (H - L), R2 = P + (H - L), alongside measured-move extensions S3 = L - 2(H - P) and R3 = H + 2(P - L).",
        volumePocTitle: "1-Year Volume Profile POC & Anchored VWAPs",
        volumePocDesc:
          "Discretizes 252-day price action into 40 equal-range volume buckets to isolate high-volume institutional nodes (POC) and computes Anchored VWAPs from cycle peaks and peak volume bars.",
        confluenceTitle: "Fundamental-Technical Confluence Criteria",
        confluenceDesc:
          "Flags high-conviction inflection zones where technical corridors converge with fundamental valuation regimes (Panic Floor, Bear, Base, Bull) within a ±2.5% band (|Price_tech - Price_regime| / Price_regime <= 0.025).",
        tier1Title: "Tier 1: Immediate Pivot Corridor (S1 / R1)",
        tier1Desc:
          "Day-trader inventory boundaries and initial algorithmic rejection/support bands.",
        tier2Title: "Tier 2: Structural Congestion Corridor (S2 / R2)",
        tier2Desc:
          "Multi-week horizontal shelves, unfilled gap tops, and volume profile POC nodes.",
        tier3Title: "Tier 3: Macro Bedrock & Cycle Ceiling (S3 / R3)",
        tier3Desc:
          "52-week cycle boundaries, 200-day SMAs, and measured-move breakdown extensions.",
      },
      cta: {
        title: "Explore the Open-Source Codebase & AI Skills",
        desc: "StressAlpha is fully open-source with Next.js 16, deterministic arithmetic modules, in-memory test suites, and automated earnings analysis CLI scripts.",
        backBtn: "Open Model",
        githubBtn: "View on GitHub",
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
      cockpit: "模型",
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
      settingsPage: "偏好与系统设置",
      language: "界面语言",
      theme: "主题",
      themeDark: "深色模式",
      themeLight: "浅色模式",
      themeDarkShort: "深色",
      themeLightShort: "浅色",
      themeCyber: "深色模式",
      themeCyberShort: "深色",
      toggleTheme: "切换主题 (深色 / 浅色)",
      shortcuts: "键盘快捷键",
      watchlist: "自选关注",
      addToWatchlist: "加入自选 (F)",
      removeFromWatchlist: "移出自选 (F)",
      bookmarked: "已自选",
      bookmark: "自选",
      addedToWatchlistToast: (ticker: string) => `已将 ${ticker} 加入自选关注`,
      removedFromWatchlistToast: (ticker: string) =>
        `已将 ${ticker} 移出自选关注`,
      signInRequiredToast: "请先登录以将自选股保存至云端数据库",
      quarterHistory: "季度研报历史",
      latestBadge: "最新",
      historicalBadge: "历史",
      historicalBanner: (quarter: string, date?: string) =>
        `历史财报分析：正在查看 ${quarter}${date ? `（归档日期：${date}）` : ""}，估值模型反映当时的历史假设。`,
      jumpToLatest: (quarter: string) => `跳转至最新 (${quarter})`,
      quartersAvailable: (count: number) => `${count} 个季度研报可用`,
      noEarlierQuarters: "归档中暂无更早历史研报",
      mobileMenu: "菜单",
      closeMenu: "关闭",
      navigation: "导航",
      modelNavTooltip: (ticker?: string) =>
        ticker ? `返回 ${ticker} 估值模型 (M)` : "估值模型 (M)",
    },
    selector: {
      selectReport: "选择标的股票...",
      availableReports: "覆盖股票标的",
      noReportsFound: "未找到任何覆盖股票",
      refreshTitle: "刷新标的列表",
      openScreener: "打开股票筛选",
      watchlistSection: "已关注自选标的",
      allReportsSection: "全部覆盖标的",
      starredTooltip: "切换自选状态",
      quartersCount: (count: number) => `${count} 个季度`,
      searchPlaceholder: "搜索代码、公司或季度...",
      collapseQuarters: "收起历史季度",
      expandQuarters: (count: number) => `展开全部 ${count} 个季度`,
      showingUniverseSummary: (shown: number, total: number) =>
        `显示全部 ${total} 家公司中的前 ${shown} 家 · 输入关键词搜索股票池...`,
    },
    cockpit: {
      title: "情景压力测试模型",
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
      valuationRegimes: "情景目标价",
      current: "现价",
      currentPrice: "收盘价",
      currentPriceTooltip: "最新收盘价（按日更新），非盘中实时行情。",
      weightedFairValue: "加权公允价值",
      wfvShort: "加权估值",
      regimes: {
        bull: "🐂 牛市情景",
        base: "⚖️ 基准情景",
        bear: "🐻 熊市情景",
        panic: "🚨 恐慌底价",
        panicFloorLabel: "恐慌托底价",
      },
      asymmetry: {
        upsideToBull: "牛市上行空间",
        downsideToPanic: "恐慌下行最大回撤",
        pricedInMultiple: "市场隐含市盈率",
        asymmetrySkew: "盈亏收益比 (Risk/Reward)",
      },
      upstreamTitle: "需求与业务量驱动",
      exposure: "敞口",
      elasticity: "弹性",
      accountingTitle: "成本与利润率控制",
      grossMarginPerturbation: "毛利率微调 (基点)",
      fixedOpexShift: "固定营运支出微调",
      metadata: {
        baseRev: "基准营收",
        shares: "稀释总股本",
        tax: "税率",
      },
      guardrail: {
        title: "盈利质量审计",
        description: "经审计的 GAAP 调整项，隔离非经营性或一次性账面损益：",
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
      mobileCockpitTab: "测算模型",
      mobileWorkspacesTab: "深度研报",
      exploreWorkspaces: "进入 7 大深度研报工作台",
      adjustShocks: "调节压力冲击参数",
      quickSummary: "实时估值概览",
    },
    shortcuts: {
      title: "快捷键指南",
      tabSwitch: "快速切换标签页 (1–6)",
      resetModel: "重置压力模型 (R)",
      toggleMemo: "切换模型 / 备忘录 (M)",
      toggleLang: "切换中英文 (L)",
      exportCard: "导出社媒卡片 (E)",
      openSnowflake: "全景雪花图审计 (W)",
      toggleScreener: "打开/关闭股票筛选 (S)",
      toggleFavorite: "加入/移出自选标的 (F)",
      close: "关闭窗口 (Esc / ?)",
      prevNextTab: "上一个 / 下一个工作台 ([ / ])",
      returnToModel: "返回估值模型 (M)",
    },
    snowflake: {
      title: "全景雪花图评分",
      subtitle: "五维基本面质量、护城河与估值安全边际审计",
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
      currentPriceTooltip: "最新交易日收盘价",
      panicFloor: "🚨 恐慌底价",
      base: "⚖️ 基准目标",
      bullRegime: "🐂 牛市目标",
    },
    technicalLevels: {
      cardTitle: "关键支撑与阻力",
      badgeTitle: "支撑/阻力矩阵",
      supportTitle: "关键支撑位 (Support)",
      resistanceTitle: "关键阻力位 (Resistance)",
      confluenceTitle: "估值与技术共振",
      confluenceBadge: "⚡ 发现技术共振",
      confluenceDesc: (
        techLabel: string,
        techPrice: string,
        fundRegime: string,
        fundPrice: string,
        diffPct: string
      ) =>
        `${techLabel} (${techPrice}) 与 ${fundRegime} (${fundPrice}) 在 ${diffPct}% 范围内形成共振`,
      levelNames: {
        sma50: "50日均线 (50 SMA)",
        sma200: "200日均线 (200 SMA)",
        high52: "52周高点 (52W H)",
        low52: "52周低点 (52W L)",
        pivot_p: "经典枢轴点 (P)",
        pivot_s1: "第一支撑位 (S1)",
        pivot_r1: "第一阻力位 (R1)",
        pivot_s2: "第二支撑位 (S2)",
        pivot_r2: "第二阻力位 (R2)",
        pivot_s3: "第三支撑位 (S3)",
        pivot_r3: "第三阻力位 (R3)",
        gap_fill: "缺口回补目标 (昨收)",
        gap_boundary: "跳空日边界位",
        volume_poc: "一年成交量重心 (POC)",
        avwap_high: "锚定均价 (52周高点 AVWAP)",
        avwap_volume: "锚定均价 (最大量能 AVWAP)",
        swing_high: "分形波段高点",
        swing_low: "分形波段低点",
      },
      types: {
        support: "支撑",
        resistance: "阻力",
        pivot: "枢轴",
      },
      importance: {
        major: "强关键",
        intermediate: "中级",
        minor: "次级",
      },
      noData: "该标的尚未同步关键技术支撑与阻力位数据。",
      distance: "距离现价",
      tooltip: "纯确定性技术位与基本面估值共振审计",
      zone: "密集区",
      zoneBadge: "共振带",
      zoneDesc: (count: number) => `${count}重技术位重合`,
      corridors: {
        title: "机构级价格走廊",
        badge: "3阶走廊体系",
        viewCorridors: "3阶核心走廊",
        viewAllLevels: "全部技术位",
        s1Title: "即时支撑平台",
        s1Desc: (low: string, high: string) =>
          `日内探底低点 (${low}) 与第一支撑位 (${high}) 企稳买盘`,
        s2Bedrock: "周期底部基石",
        s2BedrockDesc: (low: string, high: string) =>
          `52周低点 (${low}) 与第三结构支撑 (${high}) 关键防线`,
        s2Structural: "中线结构支撑",
        s2StructuralDesc: (low: string, high: string) =>
          `波段筹码平台与次级支撑共振带 (${low} – ${high})`,
        s3Breakdown: "破位测算下限",
        s3BreakdownDesc: (low: string, high: string) =>
          `52周低点失守后的等距下行测算位 (${low} – ${high})`,
        s3Macro: "宏观底线支撑",
        s3MacroDesc: (low: string, high: string) =>
          `宏观流动性安全底线与估值支撑带 (${low} – ${high})`,
        r1Title: "即时反弹压制",
        r1Desc: (low: string, high: string) =>
          `跳空日反弹高点 (${high}) 与第一阻力位 (${low}) 抛压`,
        r2Gap: "筹码套牢峰与缺口上沿",
        r2GapDesc: (low: string, high: string) =>
          `成交量重心峰 (${low}) 至跳空前收盘价 (${high}) 密集套牢盘`,
        r2Structural: "结构性筹码压力带",
        r2StructuralDesc: (low: string, high: string) =>
          `高成交量换手区与次级阻力带 (${low} – ${high})`,
        r3Sma: "主线均线死叉压力区",
        r3SmaDesc: (low: string, high: string) =>
          `50日 (${low}) 与200日均线 (${high}) 共振压制带 (死叉区)`,
        r3High: "52周高点周期压制",
        r3HighDesc: (low: string, high: string) =>
          `一年高点与牛市极限压制位 (${low} – ${high})`,
      },
      openFullAnalysis: "图表与走廊 →",
      compactSummary: "支撑阻力简析",
      spot: "现价",
      openChartTab: "打开交互K线图与三层走廊 (工作台 2) →",
    },
    tabs: {
      valuation: "估值与情景",
      technicals: "技术分析与图表",
      estimates: "分析师共识",
      moat: "护城河与竞品",
      segments: "分部业务与财务",
      catalysts: "催化剂与风险",
      news: "即时动态与脉搏",
      audit: "业绩与披露审计",
      report: "原始底稿与披露",
      scenarios: "估值与情景",
      sensitivity: "敏感性热力图",
      tone: "电话会情绪",
      filing: "10-Q 风险",
      reactions: "历史股价反应",
      shortValuation: "估值",
      shortTechnicals: "图表",
      shortEstimates: "共识",
      shortMoat: "护城河",
      shortSegments: "分部",
      shortCatalysts: "催化",
      shortAudit: "审计",
      shortNews: "动态",
      shortReport: "底稿",
      nextTab: "下一工作台",
      prevTab: "上一工作台",
      allTabs: "全部工作台",
      tabNumber: (current: number, total: number) =>
        `工作台 ${current} / ${total}`,
    },
    technicalsTab: {
      title: "技术分析与交互图表",
      subtitle: "实时K线形态、经典枢轴点位、筹码分布POC与基本面估值共振审计。",
      chartCardTitle: "实时交互K线图",
      chartCardSubtitle:
        "机构级 TradingView 图表，集成成交量、均线与技术指标。",
      corridorsCardTitle: "机构三层价格走廊与共振矩阵",
      corridorsCardSubtitle: "三层支撑阻力层级与压力测试基本面估值锚定。",
      confluenceSectionTitle: "基本面与技术面共振信号",
      confluenceEmpty: "当前未在 ±2.5% 容差带内检测到直接共振信号。",
      trendBullish: "多头排列 (现价 > 200日均线)",
      trendBearish: "空头排列 (现价 < 200日均线)",
      distanceTo52WHigh: "距52周最高",
      distanceTo52WLow: "距52周最低",
      volumePoc: "1年筹码峰POC",
      tradingViewWatermark: "技术图表由 TradingView 提供支持",
    },
    newsTab: {
      title: "即时动态与催化剂脉搏",
      subtitle:
        "过滤后的重要市场事件与基本面传导向量。可一键将隐含冲击推演带入模型测算。",
      empty: "当前监控周期内该标的无重大市场异动或财报传导事件。",
      latestPulse: "最新市场脉搏",
      transmissionChannel: "传导机制",
      simulateButton: "带入模型推演",
      simulateTooltip: "将该事件隐含的参数冲击直接加载至模型滑块",
      viewSource: "查看信息源",
      wfvImpact: "隐含公允价值影响",
      priceReaction: "股价变动",
      abnormalMove: "超额异动",
      allFilter: "全部事件",
      upstreamFilter: "供应链与上下游",
      productFilter: "产品与技术发布",
      analystFilter: "投行评级与目标价",
      secFilter: "SEC 官方披露",
      channels: {
        driverShock: "上下游驱动冲击",
        catalystProb: "催化剂概率重构",
        qpceSkew: "华尔街预期偏度",
        segmentGrowth: "业务线增速修正",
        none: "定性参考信息",
      },
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
      filterAll: "全部",
      filterBuy: "看多",
      filterHold: "中性",
      filterSell: "看空",
      searchPlaceholder: "搜索券商或分析师...",
      emptySearch: "未找到匹配的分析师评级记录",
      currentPriceLabel: "现价",
      searchGoogle: (firm: string) => `在 Google 搜索 ${firm} 研报`,
      consensusMean: "共识目标中枢",
      spreadRatio: "偏度比 (High/Low)",
      sentimentMomentum: "华尔街卖方共识情绪",
      highConvictionBullish: "🔥 极度看多 (High Conviction)",
      moderateBull: "偏多共识 (Moderate Bull)",
      divergentSentiment: "观点分歧 (Divergent)",
      consensusAnatomy: "共识核心特征",
      streetHigh: "最高目标券商",
      streetLow: "最低目标券商",
      targetSpread: "目标价跨度 (High - Low)",
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
      wideMoat: "宽护城河 (Wide Moat)",
      narrowMoat: "窄护城河 (Narrow Moat)",
      noMoat: "无护城河 (No Moat)",
      trendWidening: "持续扩宽 (Widening)",
      trendNarrowing: "正在收窄 (Narrowing)",
      trendStable: "保持稳固 (Stable)",
      colProductComparison: "产品管线对比",
      colAdvantageVulnerability: "核心优势/脆弱点",
      viewYahoo: (ticker: string) => `在 Yahoo Finance 查看 ${ticker}`,
      durabilityYearsSuffix: "年壁垒期",
      peersCountSuffix: "家核心竞品",
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
      variantPerceptionTitle: "预期差与共识审计 (Variant Perception)",
      variantPerceptionSubtitle:
        "定量解构 StressAlpha 加权估值与华尔街卖方一致预期的偏离归因与安全边际来源。",
      dataCompletenessBadge: (
        score: number,
        populated: number,
        total: number
      ) => `${score}% 完备 (${populated}/${total} 核心模块已审计)`,
      divergenceLabels: {
        in_line: "与一致预期吻合",
        moderate_alpha: "适度预期差",
        high_conviction_alpha: "高确信度 Alpha 机会",
        extreme_divergence: "显著预期差警示",
      },
      divergenceAttributionTitle: "偏差构成定量解构",
      baseMultipleVsStreet: "基准估值倍数偏离",
      regimeStressImpact: "动态压力缓冲折价",
      modelStanceTitle: "模型分析研判",
      dataNotesTitle: "数据质量与审计提示",
      closeModal: "关闭",
      revisionsLedgerTitle: "公允估值推演历史与修订账本",
      revisionsLedgerSubtitle: "不可篡改的事件驱动加权公允估值修订审计轨迹",
      revisionsEmpty:
        "暂无历史公允估值修订记录。当发生重大基本面冲击或季度财报发布时将自动记录修订。",
      colRevisionDate: "修订日期",
      colRevisionTrigger: "触发类型",
      colRevisionHeadline: "事件与推演依据",
      colRevisionShift: "估值变动",
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
      behavioralDimensions: "管理层行为五维雷达评估 (1-10 分制)",
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
      title: "历次财报后股价反应与市场归因",
      subtitle: "历次财报披露后首日股价涨跌幅与市场归因分析。",
      empty: "当前研报暂无财报历史股价反应数据。",
      colDate: "披露日期",
      colEvent: "事件 / 报告季度",
      colMove: "首日涨跌幅",
      colContext: "市场背景与核心催化归因",
    },
    sensitivityTab: {
      title: "估值敏感度矩阵",
      subtitle: "测算毛利率微调与需求冲击对情景目标估值的综合影响。",
      empty: "当前研报暂无估值敏感性矩阵数据。",
      sensitivitySuffix: "敏感性",
      deltaFairValue: "目标公允价变动 (Δ Fair Value)",
    },
    memo: {
      backToCockpit: "返回模型",
      enMemoBtn: "English Memo",
      zhMemoBtn: "🇨🇳 中文备忘录",
      printPdf: "打印 / 导出 PDF",
      committeeMemo: "StressAlpha 投资决策委员会备忘录 (MEMORANDUM)",
      decisionAudit: "投资决策与压力测试审计",
      reportDate: "报告日期",
      generatedVia: "由 StressAlpha 确定性压力计算引擎生成",
      currentStock: "当前基准股价",
      weightedFairValue: "概率加权公允价",
      sec1Title: "一、 执行摘要与决策分析 (Executive Summary)",
      sec2Title: "二、 情景目标价与压力测试估值 (Scenario Targets)",
      sec3Title: "三、 盈利质量与会计调整审计 (Earnings Quality)",
      sec4Title: "四、 核心催化剂与情景概率 (Catalysts & Scenarios)",
      secMoatTitle: "五、 经济护城河与竞品对标 (Moat & Competitors)",
      secEstimatesTitle: "五(下)、 华尔街分析师目标价与共识 (Analyst Targets)",
      sec5Title: "六、 SEC 风险提示与重大变化 (SEC Risks)",
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
      confidentialBadge: "机密文档 • 仅限投资决策委员会内部使用",
      docClassification: "机构级基本面量化压力测试研报",
      footerMethodologyTitle: "确定性算术引擎",
      footerMethodology:
        "100% 确定性金融算术内核 — 纯 TypeScript 传导计算，严格杜绝大模型数学幻觉。多因子需求冲击、固定营运支出刚性与盈亏非对称比率均由 StressAlpha 引擎确定性求解。",
      footerDisclaimerTitle: "合规治理与审计跟踪",
      footerDisclaimer:
        "本研报仅供机构投资研究与极端情景压力测试参考，不构成任何投资建议或证券推介。数据提取自 SEC 10-K / 10-Q 官方呈报文件、财报电话会纪要与经审计的一致预期。",
      docId: "文档编号",
      footerAuditStatus:
        "概率单纯形校准: 凸收缩正则化 [0.05, 0.85] | 数据完整性: 100%",
      printGeneratedOn: "由 StressAlpha 机构研报驾驶舱生成",
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
      title: "股票筛选与估值比对",
      subtitle: "横向对比覆盖股票的基本面指标、估值空间与护城河竞争壁垒",
      searchPlaceholder: "搜索股票代码或公司全称...",
      filterAll: "全部",
      filterAllTooltip: "显示所有覆盖标的（不限估值空间）",
      filterUndervalued: "估值折价",
      filterUndervaluedTooltip: "筛选加权估值空间大于 0% 的折价标的",
      filterHighUpside: ">20% 空间",
      filterHighUpsideTooltip: "筛选加权估值空间大于 20% 的高弹性机会",
      allMoats: "全部护城河",
      allMoatsTooltip: "显示所有护城河评级标的",
      wideMoat: "宽护城河",
      wideMoatTooltip: "筛选具备宽护城河（长期持久定价权）的优质标的",
      narrowMoat: "窄护城河",
      narrowMoatTooltip: "筛选具备窄护城河的标的",
      colTicker: "代码",
      colTickerTooltip: "公司股票代码与全称。点击进行排序。",
      colCompany: "公司",
      colSnowflake: "雪花评分",
      colSnowflakeTooltip:
        "雪花图 30 项基本面健康审计总分（0-30分），涵盖估值、成长、盈利质量、护城河与抗风险韧性。点击排序。",
      colMoat: "护城河",
      colMoatTooltip:
        "经济护城河评级（宽、窄、无）与动态演变趋势（↗ 持续扩宽、→ 保持稳定、↘ 逐渐收窄）。点击排序。",
      colPrice: "现价",
      colPriceTooltip: "股票最新市场交易价格。点击排序。",
      colAnalystTarget: "分析师目标价",
      colAnalystTargetTooltip:
        "华尔街卖方 12 个月一致预期目标价及较现价空间。点击排序。",
      colConsensusSpread: "一致预期偏离",
      colBaseFairValue: "基准估值",
      colBaseFairValueTooltip:
        "基准情景公允价值（管理层业绩指引中枢执行假设）。点击排序。",
      colWeightedFairValue: "加权估值 (WFV)",
      colWeightedFairValueTooltip:
        "加权公允价值（WFV），综合牛市、基准、熊市与恐慌四重压力测试情景概率推导。点击排序。",
      colUpside: "估值空间",
      colOperatingMargin: "营业利润率",
      colOperatingMarginTooltip:
        "标准化营业利润率（营业利润 / 总营收），衡量主营业务核心盈利能力。点击排序。",
      colRevenueGrowth: "营收增速",
      colRevenueGrowthTooltip: "最新季度营业收入同比增长率 (YoY)。点击排序。",
      colValuationRange: "压力估值区间",
      colAction: "操作",
      viewCards: "卡片",
      viewTable: "表格",
      openCockpit: "模型",
      openMemo: "研报备忘",
      openCockpitTooltip: (ticker: string) => `查看 ${ticker} 测算模型`,
      statsCoverage: "已覆盖标的",
      statsAvgUpside: "平均加权估值空间",
      statsAvgUpsideSub: "基于多情景概率加权",
      statsTopPick: "最高估值弹性",
      statsWideMoat: "宽护城河占比",
      statsWideMoatSub: (count: number, total: number) =>
        `${total} 家中含 ${count} 家宽护城河`,
      noResults: "未找到符合当前筛选条件的公司。",
      resetFilters: "重置筛选条件",
      resultsCount: (shown: number, total: number) =>
        `显示 ${shown} / 共 ${total} 家标的`,
      loadAll: (total: number) => `加载全部 (${total})`,
      filterWatchlist: "自选关注",
      colFavorite: "关注",
      watchlistEmptyTitle: "自选列表暂无标的",
      watchlistEmptyDesc:
        "在全景表格中点击星标或在测算模型中按 [F] 键，即可添加重点跟踪标的。",
      viewAllReports: "查看全部标的",
      watchlistCount: (count: number) => `自选关注 (${count})`,
      bearLabel: "悲观",
      baseLabel: "基准",
      bullLabel: "乐观",
      currentPriceLabel: "现价",
      analystsLabel: "位分析师",
      rangeTooltip: "压力估值区间 (悲观 ↔ 基准 ↔ 乐观)",
      rangeBearBullHint: "(悲观 ↔ 乐观)",
      sortPrompt: "排序依据",
      loading: "正在加载股票研报数据...",
    },
    watchlistPage: {
      title: "重点自选关注",
      subtitle:
        "实时追踪核心自选标的的压力估值折溢价、30项全景雪花图健康度与华尔街卖方预期差。",
      statsTracked: "已关注标的",
      statsAvgUpside: "平均公允价值上行",
      statsConvictionLeader: "最高置信标的",
      statsWideMoat: "护城河占比",
      statsAvgSnowflake: "平均雪花健康度",
      searchPlaceholder: "在自选列表中搜索代码、公司或预期差评级...",
      emptyTitle: "自选列表暂无标的",
      emptyDesc:
        "在全景选股器或分析报告中点击星标，即可在此集中追踪标的的4层情景估值边界、雪花审计图与卖方预期差。",
      exploreScreenerBtn: "浏览全景选股器",
      quickAddSuggestions: "热门关注标的推荐",
      viewCards: "全景深度卡片",
      viewTable: "全景矩阵表格",
      regimeSpectrum: "4层压力估值区间",
      consensusDivergence: "卖方预期差与置信等级",
      snowflakeBreakdown: "30项雪花图细项审计",
      operationalMomentum: "营收与利润率动能",
      quarterlyHistory: "覆盖财季历史",
      removeFromWatchlist: "移出自选",
      openCockpit: "进入压力测试模型",
      openMemo: "投资研报",
      colMoat: "护城河",
      colPrice: "现价",
      colWfv: "加权公允价值",
      colBaseFv: "基准情景价值",
      colConsensus: "华尔街目标价",
      colDivergence: "预期差溢价",
      colGrowthMargin: "成长与利润率",
      colSnowflake: "雪花图评分",
      colActions: "操作",
      divergenceTiers: {
        in_line: "与共识一致",
        moderate_alpha: "温和阿尔法",
        high_conviction_alpha: "高置信阿尔法",
        extreme_divergence: "极大预期差",
      },
      pillarLabels: {
        valuation: "估值与安全边际",
        future: "未来成长与催化剂",
        earnings: "盈利质量与利润率",
        moat: "护城河与对标",
        resilience: "下行安全底与抗风险",
      },
      noFilterMatches: "未找到符合当前筛选条件的自选标的。",
      resultsCount: (shown: number, total: number) =>
        `显示 ${shown} / 共 ${total} 家标的`,
      loadAll: (total: number) => `加载全部 (${total})`,
    },
    socialCard: {
      modalTitle: "分享研报与导出社媒卡片",
      modalSubtitle:
        "一键复制带自定义参数的交互式推演链接，或生成用于社媒分享的高清图表卡片。",
      templates: {
        valuation: "估值与压力测试",
        valuationDesc: "公允价值空间、情景目标价及业务承压因子",
        earnings: "财报业绩快报",
        earningsDesc: "营收增速、营业利润率、超预期幅度与业务分部",
        thesis: "投资逻辑与催化剂",
        thesisDesc: "经济护城河评级、核心成长催化与主要风险",
        summary: "高管全景速览",
        summaryDesc: "一站式核心基本面与估值全景速览",
        snowflake: "全景雪花图",
        snowflakeDesc: "五维基本面质量、护城河与估值雷达卡片",
      },
      sections: {
        valuationHero: "估值与价格",
        valuationHeroDesc: "现价、公允价值、估值空间与不对称性",
        regimes: "情景目标价",
        regimesDesc: "牛市、基准与恐慌底线目标价",
        earnings: "财报业绩审计",
        earningsDesc: "营收、营业利润、核心经调EPS审计",
        segments: "业务分部拆解",
        segmentsDesc: "分部营收动态与增速",
        moat: "经济护城河",
        moatDesc: "护城河评级、趋势与竞争壁垒来源",
        catalysts: "催化与风险",
        catalystsDesc: "成长催化因子与下行脆弱性风险",
        snowflake: "全景雪花图",
        snowflakeDesc: "30项五维基本面质量雷达审计",
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
        themeLabel: "配色主题",
        scenarioLinkLabel: "交互式情景推演链接",
        includeStress: "包含当前微调的极端承压参数",
        includeWatermark: "显示 StressAlpha 水印与版权",
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
        auditGrade: "深度研究审计级",
        asymmetryLabel: "不对称比率",
        panicFloorShortLabel: "恐慌底",
        valuationSpectrumLabel: "动态估值谱系与区间",
        financialHighlightsLabel: "核心财务与护城河指标",
        moatRatingLabel: "经济护城河",
        pricedInMultipleLabel: "已计入倍数",
        probLabel: "概率",
        upsideTag: "空间",
        downsideTag: "折价",
        activeStressTag: "已启用当前自定义极端承压参数",
        neutralStressTag: "基准无损中性宏观假设 (0% 冲击)",
        bullRegimeDesc: "多重估值扩张与高增速",
        baseRegimeDesc: "官方指引中值常态兑现",
        panicRegimeDesc: "极端恐慌去杠杆防御底线",
        quarterlyResultsTitle: "季度核心业绩概览",
        marginLabel: "利润率",
        durabilityLabel: "壁垒",
        compositeScoreLabel: "综合得分",
        fivePillarsTitle: "五维核心支柱审计得分",
        segmentsTitle: "核心业务分部营收全景",
        competitiveAdvantageTitle: "竞争优势与护城河壁垒",
        catalystsTitle: "核心催化剂与脆弱性风险",
        growthCatalystLabel: "成长催化",
        downsideRiskLabel: "下行风险",
        probabilityAnchoredLabel: "发生概率加权",
        grossMarginLabel: "毛利率",
        operatingMarginLabel: "营业利润率",
        consensusTargetLabel: "一致目标价",
        competitiveDynamicsLabel: "核心竞争壁垒论据",
        peerBenchmarkLabel: "同业对标",
        revenueGuidanceLabel: "官方指引区间",
        noDataAvailable: "暂无数据",
        moatTrendLabel: "护城河趋势",
        priceSpectrumTrackLabel: "情景压力测试估值谱系轨",
        spreadLabel: "极差跨度",
        trailingPeLabel: "滚动市盈率",
        forwardPeLabel: "远期市盈率",
        fairPeLabel: "公允市盈率",
        marginOfSafetyLabel: "安全边际",
        asymmetrySkewLabel: "风险收益不对称偏度",
        multipleSpreadLabel: "估值倍数扩张",
        stressOperatingFlowLabel: "压力测算核心经营基准",
        bullUpsideLabel: "乐观空间",
        panicDownsideLabel: "恐慌底线",
        gaapReportedEpsLabel: "GAAP 报告每股收益",
        adjustedSpreadLabel: "收益质量过滤调节",
        guidanceCorridorLabel: "下季度官方指引区间",
        cleanConversionTitle: "核心营业每股收益与 GAAP 调节",
        radarChartSubtitle: "五维量化雷达",
        operatingIncomeGrowthLabel: "营业利润增速",
        revenueVsEstimateLabel: "对比一致预期",
      },
    },
    auth: {
      signIn: "登录",
      signOut: "退出登录",
      signUp: "创建账户",
      createAccount: "注册",
      email: "电子邮箱",
      password: "密码",
      name: "姓名",
      namePlaceholder: "例如：张伟",
      emailPlaceholder: "alex@example.com",
      passwordPlaceholder: "••••••••",
      signInTitle: "登录账户",
      signUpTitle: "创建账户",
      signInSubtitle: "登录以将自选股清单与压力测试模型参数同步至云端数据库。",
      signUpSubtitle:
        "加入 StressAlpha，跨设备持久化保存您的重点关注标的与情景预设。",
      alreadyHaveAccount: "已有账户？立即登录",
      dontHaveAccount: "还没有账户？立即注册",
      loading: "处理中...",
      errorTitle: "身份认证失败",
      loginSuccess: "登录成功",
      signupSuccess: "账户注册成功",
      signoutSuccess: "已退出登录",
      cloudSyncActive: "云端已同步",
      cloudSyncTooltip: "自选股已实时同步至 Neon PostgreSQL 数据库",
      accountMenu: "账户设置",
      profile: "个人资料",
      guestUser: "访客",
      syncing: "同步中...",
      passwordHint: "(至少 6 个字符)",
      passwordTooShort: "密码长度至少需要 6 个字符。",
      invalidCredentials: "电子邮箱或密码错误。",
      invalidEmail: "请输入有效的电子邮箱地址。",
      userAlreadyExists: "该电子邮箱已被注册。",
      emailRequired: "电子邮箱不能为空。",
      memberBadge: "会员分析师",
    },
    settingsPage: {
      title: "偏好与系统设置",
      subtitle: "管理账户安全、工作区显示参数、估值模型预设与隐私保护选项。",
      backToModel: "返回估值模型",
      backToScreener: "返回全景选股器",
      tabAccount: "账户与个人资料",
      tabAppearance: "外观与语言",
      tabValuation: "估值决策引擎",
      tabPrivacy: "隐私与存储管理",
      tabSystem: "系统与架构信息",
      account: {
        title: "账户与安全",
        description: "管理您的机构分析师资料、云端数据库会话与身份凭证。",
        notSignedIn: "访客工作区",
        notSignedInDesc:
          "您当前处于访客模式。登录后可将自选股清单与自定义压力测试模型参数同步至 Neon PostgreSQL 云端数据库。",
        signInButton: "登录或注册",
        nameLabel: "显示姓名",
        emailLabel: "电子邮箱",
        showEmail: "显示邮箱",
        hideEmail: "隐藏邮箱",
        emailPrivacyNotice:
          "您的邮箱地址已在所有顶部导航和下拉菜单中隐蔽，防止在屏幕共享、线上演示或录屏时意外泄露隐私。",
        statusLabel: "云端同步状态",
        statusConnected: "已连接至 Neon PostgreSQL",
        userIdLabel: "用户唯一标识",
        copyUserId: "复制 ID",
        copiedUserId: "已复制！",
        verifiedBadge: "已验证",
        unverifiedBadge: "未验证",
        signOutButton: "退出登录",
      },
      appearance: {
        title: "外观与本地化",
        description: "自定义界面视觉配色、字体对比度与语言词典偏好。",
        languageTitle: "界面语言",
        languageDesc:
          "选择首选语言。所有指标、SEC 审计底稿和情景评述将实时动态适配。",
        langEnTitle: "English (US)",
        langEnDesc:
          "机构级英文金融术语、SEC 10-Q/10-K 审计日志及华尔街卖方预期剪刀差。",
        langZhTitle: "简体中文 (ZH)",
        langZhDesc:
          "全景中文财报审计、30项雪花图雷达、情景压力测试与护城河竞争格局深度分析。",
        themeTitle: "主题",
        themeDesc:
          "零闪烁（Zero FOUC）双主题引擎，针对买方长时间研究特别调优。",
        themeDarkTitle: "彭博终端深色模式",
        themeDarkDesc:
          "基于 #07090e 纯粹深色底色，高辨识度青色高亮，暗色毛玻璃与紧凑金融排版。",
        themeLightTitle: "FactSet / 华尔街日报浅色模式",
        themeLightDesc:
          "清爽 #f8fafc 日间白底卡片，高对比度 #0f172a 字体与 WCAG AA 金融色彩规范。",
      },
      valuation: {
        title: "估值模型与压力预设",
        description: "底层金融数学模型、情景概率校准引擎与会计防欺诈护栏。",
        qpceTitle: "确定性情景概率校准矩阵",
        qpceDesc:
          "情景发生概率基于 Softmax 多状态加权与尾部风险启发式矩阵进行确定性校准，覆盖四大估值区间：乐观成长、基准指引、悲观承压与极限流动性恐慌底。",
        qpceFormula:
          "单纯形不变性：Σ P_i = 1.000，P_i ∈ [0.05, 0.85]，融入 20% 市场隐含风险阻尼正则化锚点。",
        guardrailTitle: "收益质量与核心经营 EPS 护栏",
        guardrailDesc:
          "严格剔除 ASU 2016-01 公允价值变动与一次性非经常损益，以规范化核心经营 EPS 作为估值基准，防止基础虚高。",
        feedsTitle: "可审计 SEC 与金融数据源",
        feedsDesc:
          "纯确定性 TypeScript 数据提取引擎，完全杜绝 LLM 数学计算幻觉。",
        feedsMassive:
          "Massive.com — 点对点权威财务报表、业务细分营收与历史财务比率。",
        feedsFinnhub:
          "Finnhub.io — 业绩说明会音频转录、SEC EDGAR 原始披露链接与卖方目标价预期。",
      },
      privacy: {
        title: "隐私与数据管理",
        description: "机构级隐私防护、导航栏隐蔽策略与本地缓存管理。",
        privacyFirstTitle: "零追踪架构",
        privacyFirstDesc:
          "StressAlpha 不出售任何用户数据，不加载任何第三方追踪或广告代码，严格保护买方投资研究的私密性。",
        dropdownPrivacyTitle: "菜单邮箱隐私隐蔽",
        dropdownPrivacyDesc:
          "默认从桌面端导航栏下拉列表与移动端抽屉中隐藏邮箱地址，仅保留分析师称谓，杜绝窥屏与录屏泄密。",
        statusActive: "已开启 (完全隐蔽)",
        cloudSyncTitle: "PostgreSQL 云端持久化",
        cloudSyncDesc:
          "自选股与用户记录在 Neon Serverless PostgreSQL 中实现行级关联持久化。",
        clearCacheTitle: "重置本地偏好与临时缓存",
        clearCacheDesc:
          "清理本地缓存的最近研报记录、临时情景滑块状态，不会退出登录。",
        clearCacheButton: "清理本地缓存",
        clearCacheSuccess: "本地缓存已成功重置。",
      },
      system: {
        title: "系统与架构信息",
        description: "平台版本编号、确定性计算引擎及开源代码仓库信息。",
        versionLabel: "平台版本",
        engineLabel: "确定性计算引擎",
        databaseLabel: "数据库引擎",
        methodologyLink: "模型算法原理交互指南",
        githubLink: "GitHub 开源代码仓库",
        shortcutsButton: "查看键盘快捷键",
      },
    },
    methodologyPage: {
      backToModel: "返回模型",
      engineTag: "模型算法原理",
      badge: "数理内核与决策逻辑",
      title: "StressAlpha 财务与压力估值模型计算原理",
      subtitle:
        "不同于传统大模型的黑盒幻觉推测，StressAlpha 将 LLM 严密限制在上游财报事实抽取与情景锚定阶段，所有 P&L 传导、经营杠杆、核心经营 EPS 与加权估值均由客户端纯确定性算术引擎毫秒级实时计算。",
      nav: {
        demand: "1. 需求驱动与业务量冲击",
        operatingLeverage: "2. 经营杠杆与固定成本",
        earningsQuality: "3. 盈利质量与核心EPS",
        scenarioTargets: "4. 情景目标价与盈亏比",
        baseVsWfv: "5. 基准公允价 vs 加权公允价",
        moat: "6. 五维经济护城河评级",
        calibration: "7. 确定性情景校准矩阵",
        technicalCorridors: "8. 技术走廊与估值共振",
      },
      section1: {
        title: "1. 上游需求扰动传导模型",
        desc: "大型科技巨头（如英伟达、亚马逊）的营收极度依赖上游资本开支或终端市场预算。模型为每一个上游宏观驱动因子（如云厂商AI资本开支、CoWoS先进封装良率、企业IT预算）配置了业务暴露比例（Exposure）与传导弹性系数（Elasticity）。",
        formulaLabel: "数学公式",
        formula:
          "Stressed_Revenue = Base_Revenue × [ 1 + ∑ (Shock_i × Exposure_i × Elasticity_i) ]",
        shockLabel: "滑块调整幅度 (%)",
        exposureLabel: "业务营收占比 [0, 1]",
        elasticityLabel: "传导弹性系数",
        exampleTitle: "以 NVIDIA (NVDA Q2 2027) 为例",
        exampleExposure:
          "NVDA 数据中心营收暴露度为 85% (0.85)，对四大云厂商 AI 资本开支的弹性为 1.15。若云厂商削减 AI 资本开支 -15%：",
        exampleElasticity: "1.15",
        exampleCut: "-15%",
        exampleNetShock: "传导冲击 = -15% × 0.85 × 1.15 = -14.66%。",
        exampleStressedRev:
          "经测试年度营收 = $30.04B × (1 - 14.66%) = $25.63B。",
      },
      section2: {
        title: "2. 经营杠杆与固定/变动成本分拆",
        desc: "当营收下滑时，固定开支（研发折旧、数据中心租金、固定薪酬）并不会同比例减少，这导致利润率呈现非线性的剧烈下挫（经营杠杆效应）。StressAlpha 将营业费用（OpEx）拆分为变动成本与刚性固定成本，并允许在毛利率基点（Bps）和固定支出变动（%）上施加压力。除损益表外，投资委员会高度关注自由现金流（FCF）转化率、资本开支密集度与运营资金拖累，模型同步推导 NOPAT、折旧摊销与 CapEx 压力对真实每股现金流及自由现金流收益率的传导。",
        formulaLabel: "数学公式",
      },
      section3: {
        title: "3. 盈利质量防线与核心经营 EPS 净化",
        desc: "GAAP 会计准则下的财报净利润经常包含巨额的非经常性纸面公允价值重估收益或投资浮盈。如果直接采用 GAAP EPS 进行估值倍数测算，将严重扭曲真实价值。",
        caseStudyTitle: "经典案例：亚马逊 (AMZN Q2 2026) 投资公允价值失真",
        caseStudyText:
          "亚马逊 Q2 2026 财报 GAAP 稀释每股收益达到 $5.49，大幅超出市场预期。然而审计发现，其中包含对 Anthropic 股权投资按 ASU 2016-01 准则确认的 $53.4B 非经营性未实现纸面浮盈。StressAlpha 的收益质量引擎自动扣除该一次性收益，还原出亚马逊真实的持续经营核心 EPS 仅为 $1.26，为投资者规避了虚高估值陷阱。",
      },
      section4: {
        title: "4. 情景目标价谱系与盈亏收益比",
        desc: "投资决策不是预测一个孤立的价格点，而是评估不同市场情境下的盈亏不对称性。系统将经受压力测试后的预期 EPS 映射到三个市场周期估值倍数中：",
        bullTitle: "乐观周期 (Bull Regime)",
        bullDesc: "企业业绩加速增长，估值倍数大幅扩张 (P/E Expansion)。",
        baseTitle: "基准周期 (Base Regime)",
        baseDesc: "管理层正常兑现前瞻指引，市场维持历史平均估值倍数。",
        panicTitle: "恐慌底线 (Panic Floor)",
        panicDesc: "宏观衰退与需求冰封，估值压缩至历史周期极值底部。",
        asymmetryTitle: "盈亏收益比 (Risk/Reward Ratio)",
        asymmetryDesc:
          "衡量向上乐观空间与向下极端恐慌回撤的倍数关系。比率大于 2.0x 意味着潜在收益显著高于下行风险，具备极高配置安全边际。",
      },
      section5: {
        title: "5. 基准公允价 vs 加权公允价 (WFV)",
        desc: "这是股票筛选器（Screener）与估值模型中最核心的两个指标：",
        baseTitle: "基准公允价 (Base Fair Value)",
        baseBadge: "单点基准",
        baseDesc:
          "若公司如期兑现官方前瞻业绩指引，且市场估值倍数维持中枢水平时的合理股价。",
        wfvTitle: "加权公允价 (Weighted Fair Value)",
        wfvBadge: "期望概率全景",
        wfvDesc:
          "综合考虑乐观浪潮与悲观下行的全状态概率加权期望值 (Expected Payoff)。",
        callout:
          "💡 当公司面临极大的正向期权收益（如英伟达受 AI 算力指数级爆发驱动）时，加权公允价会因乐观端的大幅拉动而高于基准公允价；反之，若公司面临严重债务违约或行业被颠覆风险，加权公允价将低于基准公允价。",
      },
      section6: {
        title: "6. 五维经济护城河评级体系",
        desc: "纯财务数据只能反映过去一个季度的结果，唯有经济护城河才能决定高超额利润（ROIC > WACC）的持久性。StressAlpha 遵循晨星（Morningstar）与巴菲特护城河标准，从五个维度量化评估竞争壁垒与其演进趋势：",
        p1Title: "1. 无形资产",
        p1Desc: "专利微架构、品牌定价权、独家许可",
        p2Title: "2. 转换成本",
        p2Desc: "CUDA生态绑定、企业核心业务深度嵌合",
        p3Title: "3. 成本优势",
        p3Desc: "台积电先进制程采购规模、独占良率",
        p4Title: "4. 网络效应",
        p4Desc: "开发者-云厂商双向增强飞轮",
        p5Title: "5. 有效规模",
        p5Desc: "百亿研发开支筑起自然垄断护城河",
      },
      section7: {
        title:
          "7. 确定性情景概率校准矩阵 (Deterministic Scenario Calibration Matrix)",
        desc: "传统定性估值模型通常给乐观（Bull）、基准（Base）和悲观（Panic）情景赋予机械对称的先验权重（如 25% / 50% / 25%）。当公司面临严重审计师辞职、司法部调查或薄弱毛利率时，未校准的模型会给出脱离现实的“虚假阿尔法（False Alpha）”。StressAlpha 摒弃空洞的学术包装，采用纯确定性 TypeScript 编写的 Softmax 多状态加权与尾部风险启发式矩阵：将先验转换至对数几率空间（Log-Odds），基于四大制度性支柱施加确定性非线性偏置，并通过凸收缩确保概率落在 [0.05, 0.85] 概率单纯形闭环区间。",
        formulaLabel: "对数几率变换与 Softmax 闭合",
        p1Title: "支柱一：司法审计与治理否决权",
        p1Desc:
          "当 facts.json 标记 governanceRisk: 'severe'、审计师辞职或司法调查时，模型施加非对称对数偏置（Δz_panic = +1.35, Δz_bull = -1.60），并触发硬性受托否决（Panic 概率 ≥ 45%，Bull 概率 ≤ 8%，强制屏蔽毛利防御缓冲）。治理失信属于存在性下行风险，无法被任何经营毛利抵消。",
        p2Title: "支柱二：商业范式校准与现金跑道护栏（复合/扩张/创投三分类）",
        p2Desc:
          "将标的划分为三类范式：1) 现金复合型 (Compounder)：营业利润率 >30% 奖赏，<15% 施加去杠杆惩罚（好市多高周转宽护城河豁免）；2) 经营杠杆型 (Operating Scaler)：增速 ≥25% 且毛利 ≥60% 奖赏经营杠杆释放速度；3) 创投极速扩张型 (Venture Hypergrowth)：如 ONDS 增速 ≥50% 且营业亏损。若毛利率 ≥35% 判定单位经济模型成立，豁免营业亏损惩罚；同时审计净流动现金跑道：若跑道 <9 个月，施加 +1.25 恐慌对数惩罚，真实反映股权增发与破发折价稀释风险。",
        p3Title: "支柱三：华尔街卖方预期偏度与离散度",
        p3Desc:
          "自动采集分析师买入/中性/卖方评级分布与 52 周目标价离散度 ((High - Low)/Mean)。若超 80% 分析师给出买入评级，向乐观端微调；若预期离散度 >0.80，则提升极端情景权重，反映市场认知巨大分歧与交易拥挤度。",
        p4Title: "支柱四：内生市场风险锚与阻尼正则化",
        p4Desc:
          "根据当前市场成交价反推市场隐含的恐慌折价概率。参数 w_mkt = 0.20 并非假设的先验分布，而是实用的阻尼正则化权重：将模型向市场实际定价锚定 20%，避免脱离现实的主观教条主义，同时保留 80% 权重用于发现独立的非共识阿尔法。",
        caseStudyTitle: "实测案例：超微电脑 (SMCI Q4 2026) 治理危机压力校准",
        caseStudyText:
          "SMCI 现价 $41.54。原始模型在未校准时分配 25% Bull ($104) / 50% Base ($59.40) / 25% Panic ($19.00)，计算出加权公允价高达 $60.45 (+45.5% 虚假虚高空间)。情景校准矩阵检测到审计师辞职与调查，自动触发治理否决权与薄利（13.5% GM）惩罚，将概率校准为：Panic 75.0% / Base 17.0% / Bull 8.0%，测得实际加权公允价为 $31.91 (-23.2% 真实下行风险)，成功保护投资决策免遭踩雷。",
        interviewTitle:
          "方法论释疑与买方投研面试指引：启发式设计与经验回测演进",
        interviewWhyTitle: "为什么采用对数几率启发式偏置而非机械拟合？",
        interviewWhyText:
          "在买方基本面研究与量化面试中，最忌讳在无共轭先验的场景下伪称“严谨贝叶斯后验”。StressAlpha 坦诚说明：当前的 Δz 调整量是基于买方风控经验提炼的确定性启发式界限（如审计师辞职属于制度性否决，稀释跑道不足 9 个月面临股权破发）。",
        interviewRoadmapTitle: "未来实证校准路径：",
        interviewRoadmapText:
          "在更大规模的系统化部署中，各支柱的偏置系数可通过历史财报后真实收益率进行多季度回测，通过最小化布莱尔分数（Brier Score: B = 1/N ∑ (p_i - o_i)²）与多项对数损失（Multinomial Log-Loss）实现实证最优化校准。",
      },
      section8: {
        title: "8. 确定性价格走廊与估值共振审计",
        desc: "将压力测试估值锚位与机构市场微观结构无缝桥接。纯代码确定性融合经典场内交易员枢轴点、跳空缺口、一年筹码分布峰（Volume POC）与锚定均价（Anchored VWAP），构建三层机构价格走廊，并对基本面情景目标进行容差共振审计。",
        formulaLabel: "数学推导公式与共振容差判定",
        pivotsTitle: "经典枢轴点位延展 (Floor Trader Pivots)",
        pivotsDesc:
          "计算经典交易员枢轴点 P = (H + L + C) / 3，第一层 S1 = 2P - H, R1 = 2P - L，第二层 S2 = P - (H - L), R2 = P + (H - L)，以及第三层等距测算扩展 S3 = L - 2(H - P), R3 = H + 2(P - L)。",
        volumePocTitle: "1年筹码分布峰 (Volume POC) 与锚定 VWAP",
        volumePocDesc:
          "将 252 个交易日价格动作离散化至 40 个等距价格区间，累加成交量以精准定位机构筹码换手核心平台（Point of Control），并从 52 周最高点与历史天量 K 线锚定 VWAP 均价。",
        confluenceTitle: "基本面与技术面共振判定标准",
        confluenceDesc:
          "当技术走廊点位与基本面情景估值（恐慌底价、悲观目标、基准估值、牛市目标）在 ±2.5% 容差带内重合时 (|Price_tech - Price_regime| / Price_regime <= 0.025)，触发高确定性机构共振信号。",
        tier1Title: "第一层：即时枢轴走廊 (S1 / R1)",
        tier1Desc:
          "日内交易与算法高频库存边界，衡量初次受阻或企稳的即时反应位。",
        tier2Title: "第二层：结构性筹码走廊 (S2 / R2)",
        tier2Desc:
          "数周横盘平台、跳空日前收盘缺口上沿与筹码换手峰密集套牢/支撑区。",
        tier3Title: "第三层：宏观底线与周期压制 (S3 / R3)",
        tier3Desc: "52周高低点、200日均线多空分水岭与破位等距下行测算极限。",
      },
      cta: {
        title: "探索开源代码与 AI Skill 流水线",
        desc: "StressAlpha 包含完整的 Next.js 16 仪表盘、确定性估值引擎、In-Memory 测试套件以及自动化 AI 技能脚本。",
        backBtn: "返回测算模型",
        githubBtn: "访问 GitHub 仓库",
      },
    },
  },
};

export function getTranslations(locale: Locale = "en"): Translations {
  return translations[locale] || translations.en;
}
