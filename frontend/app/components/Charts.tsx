"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { RiskDistributionItem, TierRiskData, PillarAverageScores } from "../types";

interface RiskDonutProps {
  data: RiskDistributionItem[];
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#10b981", // Emerald
  MEDIUM: "#f59e0b", // Amber
  HIGH: "#f97316", // Orange
  CRITICAL: "#ef4444", // Red
};

export const RiskDistributionDonut: React.FC<RiskDonutProps> = ({ data }) => {
  const chartData = data.filter((d) => d.count > 0);

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Programme Risk Profile</h4>
        <span className="text-xs text-slate-400 font-mono">2026 Cycle</span>
      </div>
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="count"
              nameKey="category"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={RISK_COLORS[entry.category] || "#64748b"}
                  stroke="rgba(0,0,0,0.5)"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
              }}
              formatter={(value: any, name: any) => [`${value} suppliers`, `Risk Tier: ${name}`]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-xs">
        {data.map((item) => (
          <div key={item.category} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: RISK_COLORS[item.category] || "#64748b" }}
            />
            <span className="text-slate-300 font-medium">
              {item.category}: {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TierRiskBarChartProps {
  data: TierRiskData[];
}

export const TierRiskBarChart: React.FC<TierRiskBarChartProps> = ({ data }) => {
  const formattedData = data.map((d) => ({
    name: d.tier.replace("TIER_", "T").replace("_", " "),
    "Low Risk": d.low_risk,
    "Medium Risk": d.medium_risk,
    "High Risk": d.high_risk,
    "Critical Risk": d.critical_risk,
  }));

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">Risk Distribution by Supplier Tier</h4>
        <span className="text-xs text-slate-400 font-mono">T1, T2 & T3 Breakdown</span>
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
            <Bar dataKey="Low Risk" stackId="a" fill="#10b981" />
            <Bar dataKey="Medium Risk" stackId="a" fill="#f59e0b" />
            <Bar dataKey="High Risk" stackId="a" fill="#f97316" />
            <Bar dataKey="Critical Risk" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface PillarScoresProps {
  scores: PillarAverageScores;
}

export const PillarScoresCard: React.FC<PillarScoresProps> = ({ scores }) => {
  const pillars = [
    {
      name: "Environmental (E)",
      score: scores.environmental_avg,
      desc: "GHG Scope 1-3, ISO 14001, Clean Energy",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
    },
    {
      name: "Social & Labor (S)",
      score: scores.social_avg,
      desc: "Fair Wage, Max Hours, Anti-Forced Labor",
      color: "bg-blue-500",
      textColor: "text-blue-400",
    },
    {
      name: "Governance (G)",
      score: scores.governance_avg,
      desc: "Anti-Bribery, Whistleblower, Sub-Tier Traceability",
      color: "bg-purple-500",
      textColor: "text-purple-400",
    },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-[320px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Average Pillar Compliance</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
            Overall: {scores.overall_compliance_avg}%
          </span>
        </div>

        <div className="space-y-4">
          {pillars.map((p) => (
            <div key={p.name} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-200">{p.name}</span>
                <span className={`font-mono font-semibold ${p.textColor}`}>{p.score}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${p.color} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(100, Math.max(0, p.score))}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <span>Scoring Model: CSRD & ILO Frameworks</span>
        <span className="font-mono text-emerald-400">Audited</span>
      </div>
    </div>
  );
};
