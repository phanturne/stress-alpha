"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { ReportData, Scenario } from "@/lib/schemas";
import {
  computeStressedValuation,
  computeValuation,
  type StressTestParams,
  type StressedValuationResult,
  type ValuationSchemaType,
} from "@/lib/valuation";

export interface UseStressModelOptions {
  reportData: ReportData | null;
  setReportData: (data: ReportData | null) => void;
  onShowToast?: (msg: string) => void;
  resetSlidersToastMsg?: string;
  onNavigateToCockpit?: () => void;
}

export interface UseStressModelReturn {
  stressParams: StressTestParams;
  setStressParams: React.Dispatch<React.SetStateAction<StressTestParams>>;
  initStressParamsFromReport: (
    data: ReportData,
    overrides?: StressTestParams
  ) => void;
  setPendingStressOverrides: (overrides: StressTestParams) => void;
  handleDriverShockChange: (driverId: string, shockPct: number) => void;
  handleGrossMarginDeltaChange: (bps: number) => void;
  handleFixedOpexShiftChange: (shiftPct: number) => void;
  handleResetDefaults: () => void;
  handleSimulateShock: (driverId: string, shockPct: number) => void;
  handleSimulateGrossMarginDelta: (bps: number) => void;
  handleSimulateCatalystProb: (catalystId: string, prob: number) => void;
  handleCatalystProbabilityChange: (idx: number, prob: number) => void;
  handleScenarioChange: (idx: number, patch: Partial<Scenario>) => void;
  handleNavigateToModel: () => void;
  stressResult: StressedValuationResult | null;
  dynamicValuation: ValuationSchemaType | undefined;
}

export function useStressModel({
  reportData,
  setReportData,
  onShowToast,
  resetSlidersToastMsg,
  onNavigateToCockpit,
}: UseStressModelOptions): UseStressModelReturn {
  const [stressParams, setStressParams] = useState<StressTestParams>({
    driverShocks: {},
    grossMarginBpsDelta: 0,
    fixedOpexShiftPct: 0,
  });

  const pendingOverridesRef = useRef<StressTestParams | null>(null);

  const setPendingStressOverrides = useCallback(
    (overrides: StressTestParams) => {
      pendingOverridesRef.current = overrides;
      setStressParams((prev) => ({
        ...prev,
        ...overrides,
        driverShocks: {
          ...(prev.driverShocks || {}),
          ...(overrides.driverShocks || {}),
        },
      }));
    },
    []
  );

  const initStressParamsFromReport = useCallback(
    (data: ReportData, overrides?: StressTestParams) => {
      const effectiveOverrides = overrides || pendingOverridesRef.current;
      const initialShocks: Record<string, number> = {};
      if (data.baseline?.upstreamDrivers) {
        for (const d of data.baseline.upstreamDrivers) {
          initialShocks[d.id] =
            effectiveOverrides?.driverShocks?.[d.id] ?? d.defaultShockPct ?? 0;
        }
      }
      setStressParams({
        driverShocks: initialShocks,
        grossMarginBpsDelta: effectiveOverrides?.grossMarginBpsDelta ?? 0,
        fixedOpexShiftPct: effectiveOverrides?.fixedOpexShiftPct ?? 0,
      });
      pendingOverridesRef.current = null;
    },
    []
  );

  const handleDriverShockChange = useCallback(
    (driverId: string, shockPct: number) => {
      setStressParams((prev) => ({
        ...prev,
        driverShocks: {
          ...(prev.driverShocks ?? {}),
          [driverId]: shockPct,
        },
      }));
    },
    []
  );

  const handleGrossMarginDeltaChange = useCallback((bps: number) => {
    setStressParams((prev) => ({
      ...prev,
      grossMarginBpsDelta: bps,
    }));
  }, []);

  const handleFixedOpexShiftChange = useCallback((shiftPct: number) => {
    setStressParams((prev) => ({
      ...prev,
      fixedOpexShiftPct: shiftPct,
    }));
  }, []);

  const handleResetDefaults = useCallback(() => {
    if (!reportData?.baseline) return;
    const defaultShocks: Record<string, number> = {};
    for (const d of reportData.baseline.upstreamDrivers) {
      defaultShocks[d.id] = d.defaultShockPct ?? 0;
    }
    setStressParams({
      driverShocks: defaultShocks,
      grossMarginBpsDelta: 0,
      fixedOpexShiftPct: 0,
    });
    if (onShowToast && resetSlidersToastMsg) {
      onShowToast(resetSlidersToastMsg);
    }
  }, [reportData, onShowToast, resetSlidersToastMsg]);

  const handleCatalystProbabilityChange = useCallback(
    (idx: number, prob: number) => {
      if (!reportData?.catalysts) return;
      const updated = [...reportData.catalysts.catalysts];
      updated[idx] = { ...updated[idx], probability: prob };

      let updatedZh = reportData.catalystsZh;
      if (updatedZh?.catalysts?.[idx]) {
        const zhList = [...updatedZh.catalysts];
        zhList[idx] = { ...zhList[idx], probability: prob };
        updatedZh = { ...updatedZh, catalysts: zhList };
      }

      setReportData({
        ...reportData,
        catalysts: {
          ...reportData.catalysts,
          catalysts: updated,
        },
        catalystsZh: updatedZh,
      });
    },
    [reportData, setReportData]
  );

  const handleSimulateShock = useCallback(
    (driverId: string, shockPct: number) => {
      const drivers = reportData?.baseline?.upstreamDrivers || [];
      let targetDriver = drivers.find((d) => d.id === driverId);
      if (!targetDriver && drivers.length > 0) {
        const queryNorm = driverId.toLowerCase().replace(/[-_]/g, " ");
        targetDriver = drivers.find((d) => {
          const idNorm = d.id.toLowerCase().replace(/[-_]/g, " ");
          const nameNorm = (d.name || "").toLowerCase();
          return (
            idNorm.includes(queryNorm) ||
            queryNorm.includes(idNorm) ||
            nameNorm.includes(queryNorm) ||
            queryNorm
              .split(" ")
              .some(
                (w) =>
                  w.length > 3 && (idNorm.includes(w) || nameNorm.includes(w))
              )
          );
        });
        if (!targetDriver) {
          targetDriver = drivers[0];
        }
      }

      const effectiveDriverId = targetDriver ? targetDriver.id : driverId;
      const driverName = targetDriver?.name || effectiveDriverId;

      setStressParams((prev) => ({
        ...prev,
        driverShocks: {
          ...prev.driverShocks,
          [effectiveDriverId]: shockPct,
        },
      }));
      if (onShowToast) {
        onShowToast(
          `⚡ Simulated shock on ${driverName}: ${shockPct > 0 ? "+" : ""}${shockPct}%`
        );
      }
    },
    [reportData?.baseline?.upstreamDrivers, onShowToast]
  );

  const handleSimulateGrossMarginDelta = useCallback(
    (bps: number) => {
      setStressParams((prev) => ({
        ...prev,
        grossMarginBpsDelta: bps,
      }));
      if (onShowToast) {
        onShowToast(
          `⚡ Simulated gross margin delta: ${bps > 0 ? "+" : ""}${bps} bps`
        );
      }
    },
    [onShowToast]
  );

  const handleSimulateCatalystProb = useCallback(
    (catalystId: string, prob: number) => {
      if (!reportData?.catalysts || !reportData.catalysts.catalysts.length)
        return;
      const catalysts = reportData.catalysts.catalysts;
      let idx = catalysts.findIndex((c) => c.id === catalystId);
      if (idx === -1) {
        const query = catalystId.toLowerCase().replace(/[-_]/g, " ");
        idx = catalysts.findIndex(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query)
        );
        if (idx === -1) idx = 0;
      }
      handleCatalystProbabilityChange(idx, prob);
      if (onShowToast) {
        onShowToast(
          `✨ Simulated catalyst probability on "${catalysts[idx].title}": ${(prob * 100).toFixed(0)}%`
        );
      }
    },
    [reportData, handleCatalystProbabilityChange, onShowToast]
  );

  const handleScenarioChange = useCallback(
    (idx: number, patch: Partial<Scenario>) => {
      if (!reportData) return;
      const updatedScenarios = [...reportData.scenarios.scenarios];
      updatedScenarios[idx] = {
        ...updatedScenarios[idx],
        ...patch,
        ...(patch.probability !== undefined && {
          rawProbability: patch.probability,
          calibratedProbability: patch.probability,
        }),
      };

      const newScenarios = {
        ...reportData.scenarios,
        scenarios: updatedScenarios,
      };

      let newScenariosZh = reportData.scenariosZh;
      if (newScenariosZh?.scenarios?.[idx]) {
        const updatedZh = [...newScenariosZh.scenarios];
        updatedZh[idx] = {
          ...updatedZh[idx],
          ...(patch.probability !== undefined && {
            probability: patch.probability,
            rawProbability: patch.probability,
            calibratedProbability: patch.probability,
          }),
          ...(patch.forwardEps !== undefined && {
            forwardEps: patch.forwardEps,
          }),
          ...(patch.multiple !== undefined && { multiple: patch.multiple }),
        };
        newScenariosZh = { ...newScenariosZh, scenarios: updatedZh };
      }

      const updatedValuation = computeValuation({
        facts: reportData.facts,
        scenarios: newScenarios,
        baseline: reportData.baseline,
        moat: reportData.moat,
        estimates: reportData.estimates,
        stressParams,
        disableAutoCalibration: true,
        calibrationAudit: reportData.valuation?.calibrationAudit,
      });

      setReportData({
        ...reportData,
        scenarios: newScenarios,
        scenariosZh: newScenariosZh,
        valuation: updatedValuation,
      });
    },
    [reportData, setReportData, stressParams]
  );

  const handleNavigateToModel = useCallback(() => {
    if (onNavigateToCockpit) {
      onNavigateToCockpit();
    }
    if (typeof window !== "undefined") {
      const cockpitEl = document.getElementById("model-cockpit-pane");
      if (cockpitEl) {
        cockpitEl.scrollIntoView({ behavior: "smooth", block: "start" });
        cockpitEl.classList.add(
          "ring-2",
          "ring-accent",
          "ring-offset-2",
          "ring-offset-surface-0",
          "transition-all",
          "duration-500"
        );
        setTimeout(() => {
          cockpitEl.classList.remove(
            "ring-2",
            "ring-accent",
            "ring-offset-2",
            "ring-offset-surface-0"
          );
        }, 1800);
      }
    }
  }, [onNavigateToCockpit]);

  const stressResult = useMemo(() => {
    if (!reportData?.baseline || !reportData.facts) return null;
    return computeStressedValuation(
      reportData.baseline,
      reportData.facts.currentPrice,
      stressParams
    );
  }, [reportData, stressParams]);

  const dynamicValuation = useMemo(() => {
    if (!reportData?.facts || !reportData.scenarios) {
      return reportData?.valuation;
    }
    return computeValuation({
      facts: reportData.facts,
      scenarios: reportData.scenarios,
      baseline: reportData.baseline,
      moat: reportData.moat,
      estimates: reportData.estimates,
      stressParams,
      disableAutoCalibration: true,
      calibrationAudit: reportData.valuation?.calibrationAudit,
    });
  }, [reportData, stressParams]);

  return {
    stressParams,
    setStressParams,
    initStressParamsFromReport,
    setPendingStressOverrides,
    handleDriverShockChange,
    handleGrossMarginDeltaChange,
    handleFixedOpexShiftChange,
    handleResetDefaults,
    handleSimulateShock,
    handleSimulateGrossMarginDelta,
    handleSimulateCatalystProb,
    handleCatalystProbabilityChange,
    handleScenarioChange,
    handleNavigateToModel,
    stressResult,
    dynamicValuation,
  };
}
