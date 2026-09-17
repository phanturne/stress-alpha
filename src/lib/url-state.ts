import type { StressTestParams } from "./valuation";
import type { Locale } from "./i18n";

export interface ScenarioUrlState {
  report?: string;
  tab?: string;
  mode?: "cockpit" | "memo";
  lang?: Locale;
  stressParams?: StressTestParams;
}

/**
 * Parses URL search params or hash string into structured scenario state.
 * Supports both `?report=...&tab=...&gm=-200` and `#tab=...&gm=-200`.
 */
export function parseScenarioUrlState(
  queryStringOrHash: string
): ScenarioUrlState {
  const clean = queryStringOrHash.replace(/^[?#]/, "");
  if (!clean) return {};

  const params = new URLSearchParams(clean);
  const state: ScenarioUrlState = {};

  const report = params.get("report");
  if (report) state.report = report;

  const tab = params.get("tab");
  if (tab) state.tab = tab;

  const mode = params.get("mode");
  if (mode === "cockpit" || mode === "memo") {
    state.mode = mode;
  }

  const lang = params.get("lang");
  if (lang === "en" || lang === "zh") {
    state.lang = lang;
  }

  const stressParams: StressTestParams = {
    driverShocks: {},
    grossMarginBpsDelta: 0,
    fixedOpexShiftPct: 0,
  };
  let hasStressParams = false;

  const gm = params.get("gm");
  if (gm !== null && !isNaN(Number(gm))) {
    stressParams.grossMarginBpsDelta = Number(gm);
    hasStressParams = true;
  }

  const opex = params.get("opex");
  if (opex !== null && !isNaN(Number(opex))) {
    stressParams.fixedOpexShiftPct = Number(opex);
    hasStressParams = true;
  }

  for (const [key, value] of params.entries()) {
    if (key.startsWith("d_")) {
      const driverId = decodeURIComponent(key.slice(2));
      const valNum = Number(value);
      if (!isNaN(valNum)) {
        stressParams.driverShocks = stressParams.driverShocks ?? {};
        stressParams.driverShocks[driverId] = valNum;
        hasStressParams = true;
      }
    }
  }

  if (hasStressParams) {
    state.stressParams = stressParams;
  }

  return state;
}

/**
 * Serializes scenario state into a canonical URL search string (e.g. `?report=NVDA-Q2-2027&tab=scenarios&gm=-200`).
 */
export function serializeScenarioUrlState(state: ScenarioUrlState): string {
  const params = new URLSearchParams();

  if (state.report) params.set("report", state.report);
  if (state.tab && state.tab !== "valuation") params.set("tab", state.tab);
  if (state.mode && state.mode !== "cockpit") params.set("mode", state.mode);
  if (state.lang) params.set("lang", state.lang);

  if (state.stressParams) {
    if (state.stressParams.grossMarginBpsDelta) {
      params.set("gm", String(state.stressParams.grossMarginBpsDelta));
    }
    if (state.stressParams.fixedOpexShiftPct) {
      params.set("opex", String(state.stressParams.fixedOpexShiftPct));
    }
    if (state.stressParams.driverShocks) {
      // Sort driver IDs for deterministic URL generation
      const sortedKeys = Object.keys(state.stressParams.driverShocks).sort();
      for (const driverId of sortedKeys) {
        const shock = state.stressParams.driverShocks[driverId];
        if (shock !== 0) {
          params.set(`d_${driverId}`, String(shock));
        }
      }
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
