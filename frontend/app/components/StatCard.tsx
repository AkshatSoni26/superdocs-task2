"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendColor?: "emerald" | "amber" | "rose" | "indigo";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendColor = "emerald",
}) => {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  };

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden glass-card-hover group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[trendColor]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-slate-400">
          <span className={`font-medium ${colorMap[trendColor].split(" ")[0]}`}>{trend}</span>
        </div>
      )}
    </div>
  );
};
