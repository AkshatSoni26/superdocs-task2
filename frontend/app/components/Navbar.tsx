"use client";

import React from "react";
import { ShieldCheck, FileText, Sparkles, RefreshCw } from "lucide-react";

interface NavbarProps {
  onRefresh: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, loading }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 glass-panel backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                SuperDocs <span className="text-emerald-400 font-normal">ESG Attestation Engine</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Task 2 Build
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Supplier Code-of-Conduct & Annual ESG Audit Intelligence
            </p>
          </div>
        </div>

        {/* Right: Status Badges & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SuperDocs API: Active (4-Step Engine)
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
