"use client";

import React from "react";
import { Mic, MessageSquare, Quote, Gauge } from "lucide-react";
import type { EarningsSentiment } from "@/lib/schemas";

interface ToneTabProps {
  sentimentData?: EarningsSentiment;
}

export const ToneTab: React.FC<ToneTabProps> = ({ sentimentData }) => {
  if (!sentimentData || !sentimentData.managementTone) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 bg-surface-1 rounded-xl border border-border">
        No earnings call sentiment data available for this report.
      </div>
    );
  }

  const { managementTone, analystConcerns, keyQuotes } = sentimentData;

  const metrics = [
    { label: "Specificity", val: managementTone.specificity },
    { label: "Forward Confidence", val: managementTone.forwardConfidence },
    { label: "CapEx Justification", val: managementTone.capexJustification },
    { label: "Competitive Positioning", val: managementTone.competitivePositioning },
    { label: "Risk Acknowledgment", val: managementTone.riskAcknowledgment },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Management Tone & Earnings Call Sentiment Audit
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Audited qualitative signals, executive confidence metrics, analyst concern frequencies, and high-impact quotes.
        </p>
      </div>

      {/* Confidence Header & Radar Score */}
      <div className="p-4 rounded-xl bg-surface-1 border border-border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accentGlow/20 text-accent border border-accent/30">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">
              Overall Executive Confidence
            </div>
            <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
              {managementTone.overallConfidence}{" "}
              <span className="text-sm font-normal text-slate-400">/ 10</span>
            </div>
          </div>
        </div>

        {managementTone.evidenceNotes && (
          <p className="text-xs text-slate-300 max-w-xl bg-surface-0 p-3 rounded-lg border border-border/70 leading-relaxed">
            {managementTone.evidenceNotes}
          </p>
        )}
      </div>

      {/* 5-Dimension Scorecard */}
      <div className="p-4 rounded-xl bg-surface-1 border border-border flex flex-col gap-3 shadow-lg">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Executive Behavioral Dimensions (1-5 Scale)
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300 w-44 shrink-0">
                {m.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${(m.val / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-accent w-10 text-right">
                {m.val}/5
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Analyst Concern Topics Table */}
      {analystConcerns?.topTopics && analystConcerns.topTopics.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 shadow-lg">
          <div className="p-3 bg-surface-0 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Analyst Q&A Focus & Executive Responses
            </h4>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-0/40 border-b border-border text-slate-400 font-mono uppercase text-[10px]">
                <th className="p-3">Topic</th>
                <th className="p-3 text-right">Mentions</th>
                <th className="p-3">Executive Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {analystConcerns.topTopics.map((top) => (
                <tr key={top.topic} className="hover:bg-surface-2/40 transition-colors">
                  <td className="p-3 font-bold text-white text-sm">
                    {top.topic}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-accent">
                    {top.frequency}x
                  </td>
                  <td className="p-3 text-slate-300 text-xs leading-relaxed">
                    {top.managementResponse}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Key Quotes Cards */}
      {keyQuotes && keyQuotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Key Executive Quotes
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyQuotes.map((q, idx) => {
              const sentiment = q.sentiment.toLowerCase();
              const borderClass =
                sentiment === "bullish"
                  ? "border-fintech-green/40 bg-fintech-greenGlow/5"
                  : sentiment === "bearish"
                  ? "border-fintech-red/40 bg-fintech-redGlow/5"
                  : "border-border bg-surface-1";

              const badgeClass =
                sentiment === "bullish"
                  ? "text-fintech-green bg-fintech-greenGlow/20"
                  : sentiment === "bearish"
                  ? "text-fintech-red bg-fintech-redGlow/20"
                  : "text-slate-300 bg-surface-2";

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-md ${borderClass}`}
                >
                  <p className="text-xs italic text-slate-200 leading-relaxed">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
                    <span className="font-semibold text-white">
                      — {q.speaker}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                      {q.sentiment}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
