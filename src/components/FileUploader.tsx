"use client";

import React, { useState, useRef } from "react";
import { Upload, FolderUp, FileJson, X, AlertCircle } from "lucide-react";
import type { ReportData } from "@/lib/schemas";
import {
  FactsSchema,
  ScenariosSchema,
  CatalystsSchema,
  ReactionsSchema,
  EarningsSentimentSchema,
  FilingExtractsSchema,
  FinancialModelBaselineSchema,
  ValuationSchema,
} from "@/lib/schemas";
import { computeValuation, deriveEffectiveBaseline } from "@/lib/valuation";

interface FileUploaderProps {
  onDataLoaded: (data: ReportData) => void;
  onClose?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onDataLoaded,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | File[]) => {
    setError(null);
    const fileMap: Record<string, any> = {};

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.endsWith(".json")) {
        try {
          const text = await file.text();
          fileMap[file.name] = JSON.parse(text);
        } catch (err) {
          setError(`Failed parsing ${file.name}: ${(err as Error).message}`);
          return;
        }
      }
    }

    if (!fileMap["facts.json"] || !fileMap["scenarios.json"]) {
      setError("Minimum required files: facts.json and scenarios.json");
      return;
    }

    try {
      const facts = FactsSchema.parse(fileMap["facts.json"]);
      const scenarios = ScenariosSchema.parse(fileMap["scenarios.json"]);

      const catalysts = fileMap["catalysts.json"]
        ? CatalystsSchema.safeParse(fileMap["catalysts.json"]).data
        : undefined;
      const reactions = fileMap["reactions.json"]
        ? ReactionsSchema.safeParse(fileMap["reactions.json"]).data
        : undefined;
      const sentiment = fileMap["earnings-sentiment.json"]
        ? EarningsSentimentSchema.safeParse(fileMap["earnings-sentiment.json"]).data
        : undefined;
      const filing = fileMap["filing-extracts.json"]
        ? FilingExtractsSchema.safeParse(fileMap["filing-extracts.json"]).data
        : undefined;

      let baseline = fileMap["stress-baseline.json"]
        ? FinancialModelBaselineSchema.safeParse(fileMap["stress-baseline.json"]).data
        : scenarios.baseline;

      if (!baseline) {
        baseline = deriveEffectiveBaseline(facts);
      }

      let valuation = fileMap["valuation.json"]
        ? ValuationSchema.safeParse(fileMap["valuation.json"]).data
        : undefined;

      if (!valuation) {
        valuation = computeValuation({ facts, scenarios, baseline });
      }

      const reportData: ReportData = {
        folderSlug: "custom-upload",
        folderName: `${facts.ticker}-${facts.quarter}`,
        facts,
        catalysts,
        scenarios,
        valuation,
        reactions,
        sentiment,
        filing,
        baseline,
      };

      onDataLoaded(reportData);
      onClose?.();
    } catch (err) {
      setError(`Schema validation failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-surface-1 rounded-2xl border border-border p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Upload Analysis Folder
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Drag and drop your analysis folder containing <code className="text-accent">facts.json</code>, <code className="text-accent">scenarios.json</code>, and optional baseline files.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-fintech-redGlow/10 border border-fintech-red/30 flex items-center gap-2 text-xs text-fintech-red">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              processFiles(e.dataTransfer.files);
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all ${
            isDragging
              ? "border-accent bg-surface-2 scale-[1.01]"
              : "border-border hover:border-accent/40 bg-surface-0/60"
          }`}
        >
          <FolderUp className="w-10 h-10 text-accent" />
          <div className="text-xs text-slate-300 font-medium">
            Drag & drop folder or JSON files here
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Requires facts.json + scenarios.json
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error webkitdirectory is standard in browsers
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-white transition-colors"
            >
              Choose Folder
            </button>

            <input
              ref={filesInputRef}
              type="file"
              multiple
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => filesInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-slate-300 transition-colors"
            >
              Select Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
