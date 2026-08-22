"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Building2,
  FileCheck2,
  AlertTriangle,
  FileSpreadsheet,
  Send,
  Upload,
  Eye,
  Mail,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { StatCard } from "./components/StatCard";
import {
  RiskDistributionDonut,
  TierRiskBarChart,
  PillarScoresCard,
} from "./components/Charts";
import { IssuanceModal } from "./components/IssuanceModal";
import { IngestionModal } from "./components/IngestionModal";
import { ReviewGateModal } from "./components/ReviewGateModal";
import { FollowUpLetterModal } from "./components/FollowUpLetterModal";
import { ProgrammeReportModal } from "./components/ProgrammeReportModal";
import {
  Supplier,
  AttestationCycle,
  Assessment,
  ProgrammeReport,
} from "./types";
import { api } from "./services/api";

export default function Home() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cycles, setCycles] = useState<AttestationCycle[]>([]);
  const [report, setReport] = useState<ProgrammeReport | null>(null);
  const [assessmentsMap, setAssessmentsMap] = useState<Record<string, Assessment>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  // Modal States
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<AttestationCycle | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const [isIssuanceOpen, setIsIssuanceOpen] = useState(false);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [supData, cycleData, reportData] = await Promise.all([
        api.getSuppliers(),
        api.getCycles(2026),
        api.getProgrammeReport(2026),
      ]);

      setSuppliers(supData);
      setCycles(cycleData);
      setReport(reportData);

      // Load assessments for cycles
      const assMap: Record<string, Assessment> = {};
      for (const c of cycleData) {
        const ass = await api.getAssessmentByAttestation(c.id);
        if (ass) {
          assMap[c.id] = ass;
        }
      }
      setAssessmentsMap(assMap);
    } catch (err: any) {
      console.error("Failed to load dashboard data", err);
      setError("FastAPI Backend is not connected at http://localhost:8001. Please run 'make backend' in your task2 terminal.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (selectedTier === "ALL") return true;
    return s.tier === selectedTier;
  });

  const getCycleForSupplier = (supplierId: string) => {
    return cycles.find((c) => c.supplier_id === supplierId);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navbar */}
      <Navbar onRefresh={loadAllData} loading={loading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Backend Offline Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Backend Connection Required</p>
                <p className="text-xs text-rose-300/80">{error}</p>
              </div>
            </div>
            <button
              onClick={loadAllData}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-white border border-rose-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Page Hero Banner */}
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
            onClick={() => setIsReportOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2.5 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Executive Programme Report
          </button>
        </div>

        {/* KPI Stats Row */}
        {report && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Suppliers Enrolled"
              value={report.total_suppliers_invited}
              subtitle="Tiers 1, 2 & 3"
              icon={Building2}
              trend="100% In-Scope"
              trendColor="indigo"
            />
            <StatCard
              title="Attestation Rate"
              value={`${report.attestation_rate_pct}%`}
              subtitle={`${report.responses_submitted}/${report.total_suppliers_invited} Responses Returned`}
              icon={FileCheck2}
              trend="Annual Cycle Progress"
              trendColor="emerald"
            />
            <StatCard
              title="High / Critical Risks"
              value={
                (report.risk_tier_breakdown.find((r) => r.category === "CRITICAL")?.count || 0) +
                (report.risk_tier_breakdown.find((r) => r.category === "HIGH")?.count || 0)
              }
              subtitle="Requires Follow-Up Remediation"
              icon={AlertTriangle}
              trend="Flagged Gaps"
              trendColor="rose"
            />
            <StatCard
              title="Avg Compliance Score"
              value={`${report.pillar_averages.overall_compliance_avg}%`}
              subtitle="E, S & G Composite"
              icon={ShieldCheck}
              trend="Audited Benchmarks"
              trendColor="amber"
            />
          </div>
        )}

        {/* Charts Row */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RiskDistributionDonut data={report.risk_tier_breakdown} />
            <TierRiskBarChart data={report.tier_distribution} />
            <PillarScoresCard scores={report.pillar_averages} />
          </div>
        )}

        {/* Supplier Attestation Management Directory */}
        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-white text-lg">Supplier Attestation Directory</h3>
              <p className="text-xs text-slate-400">
                Manage lifecycle status from issuance to review gate approval and remediation letters.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
              {["ALL", "TIER_1_STRATEGIC", "TIER_2_MANUFACTURING", "TIER_3_COMMODITY"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    selectedTier === t
                      ? "bg-emerald-500 text-slate-950 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "All Tiers" : t.replace("TIER_", "T").replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Tier & Region</th>
                  <th className="py-3 px-4">Cycle Status</th>
                  <th className="py-3 px-4">ESG Score</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSuppliers.map((supplier) => {
                  const cycle = getCycleForSupplier(supplier.id);
                  const assessment = cycle ? assessmentsMap[cycle.id] : null;
                  const findingsCount = assessment?.findings?.length || 0;

                  return (
                    <tr key={supplier.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name & Code */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white text-sm">{supplier.name}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {supplier.code} · {supplier.primary_contact_email}
                        </div>
                      </td>

                      {/* Tier & Region */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/5 border border-white/10 text-slate-300">
                            {supplier.tier.replace("TIER_", "T").replace("_", " ")}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {supplier.region} ({supplier.country})
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-semibold border ${
                            cycle?.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : cycle?.status === "FOLLOW_UP_REQUIRED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : cycle?.status === "UNDER_REVIEW" || cycle?.status === "NORMALIZED"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : cycle?.status === "ISSUED"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-slate-800 text-slate-400 border-white/10"
                          }`}
                        >
                          {cycle?.status || "NOT ISSUED"}
                        </span>
                      </td>

                      {/* ESG Score */}
                      <td className="py-4 px-4">
                        {assessment ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {assessment.overall_risk_score}
                              </span>
                              <span className="text-[10px] text-slate-400">/100 risk</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              E:{assessment.environmental_score.toFixed(0)} S:
                              {assessment.social_score.toFixed(0)} G:
                              {assessment.governance_score.toFixed(0)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>

                      {/* Findings */}
                      <td className="py-4 px-4">
                        {assessment ? (
                          findingsCount === 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 0 Gaps (Clean)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium font-mono">
                              <AlertTriangle className="w-3.5 h-3.5" /> {findingsCount} finding(s)
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>

                      {/* Workflow Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Issuance */}
                          {(!cycle || cycle.status === "DRAFT") && (
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setIsIssuanceOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              Issue Package
                            </button>
                          )}

                          {/* 2. Ingestion */}
                          {cycle && (
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setSelectedCycle(cycle);
                                setIsIngestionOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              {cycle.status === "ISSUED" ? "Upload Response" : "Re-Upload"}
                            </button>
                          )}

                          {/* 3. Review Gate */}
                          {assessment && (
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setSelectedAssessment(assessment);
                                setIsReviewOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Review Gate
                            </button>
                          )}

                          {/* 4. Follow-up Letter */}
                          {cycle && assessment && findingsCount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedSupplier(supplier);
                                setSelectedCycle(cycle);
                                setIsLetterOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              Deficiency Letter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      <IssuanceModal
        supplier={selectedSupplier}
        isOpen={isIssuanceOpen}
        onClose={() => setIsIssuanceOpen(false)}
        onSuccess={loadAllData}
      />

      <IngestionModal
        supplier={selectedSupplier}
        attestation={selectedCycle}
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onSuccess={loadAllData}
      />

      <ReviewGateModal
        supplier={selectedSupplier}
        assessment={selectedAssessment}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={loadAllData}
      />

      <FollowUpLetterModal
        supplier={selectedSupplier}
        attestation={selectedCycle}
        isOpen={isLetterOpen}
        onClose={() => setIsLetterOpen(false)}
      />

      <ProgrammeReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
