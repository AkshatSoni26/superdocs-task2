import React from "react";
import { Sparkles, FileSpreadsheet } from "lucide-react";

interface HeroBannerProps {
  onOpenReport: () => void;
}

export function HeroBanner({ onOpenReport }: HeroBannerProps) {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          Annual Attestation Cycle Active · 2026
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Supplier Code-of-Conduct & ESG Compliance
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Issue localized tier-specific questionnaires, normalize multi-format supplier responses, verify via human review gates, and automatically draft deficiency notices quoting supplier evidence.
        </p>
      </div>

      <button
        onClick={onOpenReport}
        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 shrink-0 cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Executive Programme Report
      </button>
    </div>
  );
}
