"use client";

import React, { useState, useRef } from "react";
import { Upload, FolderUp, X, AlertCircle } from "lucide-react";
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
import { getTranslations, type Locale } from "@/lib/i18n";

interface FileUploaderProps {
  onDataLoaded: (data: ReportData) => void;
  onClose?: () => void;
  locale?: Locale;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onDataLoaded,
  onClose,
  locale = "zh",
}) => {
  const t = getTranslations(locale).uploader;
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
      setError(t.minFilesError);
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
        ? EarningsSentimentSchema.safeParse(fileMap["earnings-sentiment.json"])
            .data
        : undefined;
      const filing = fileMap["filing-extracts.json"]
        ? FilingExtractsSchema.safeParse(fileMap["filing-extracts.json"]).data
        : undefined;

      let baseline = fileMap["stress-baseline.json"]
        ? FinancialModelBaselineSchema.safeParse(
            fileMap["stress-baseline.json"]
          ).data
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
      setError(t.schemaError((err as Error).message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {t.title}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-surface-2 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          {t.description}
        </p>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-fintech-red/30 bg-fintech-redGlow/10 p-3 text-xs text-fintech-red">
            <AlertCircle className="size-4 shrink-0" />
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
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? "scale-[1.01] border-accent bg-surface-2"
              : "border-border bg-surface-0/60 hover:border-accent/40"
          }`}
        >
          <FolderUp className="size-10 text-accent" />
          <div className="text-xs font-medium text-slate-300">
            {t.dropzoneTitle}
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            {t.dropzoneHint}
          </div>

          <div className="mt-2 flex items-center gap-2">
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
              className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-surface-3"
            >
              {t.chooseFolder}
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
              className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-surface-3"
            >
              {t.selectFiles}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
