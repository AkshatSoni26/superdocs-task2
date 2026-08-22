import React from "react";
import {
  Send,
  Upload,
  Eye,
  Mail,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Supplier, AttestationCycle, Assessment } from "../types";

interface SupplierDirectoryTableProps {
  suppliers: Supplier[];
  cycles: AttestationCycle[];
  assessmentsMap: Record<string, Assessment>;
  selectedTier: string;
  onSelectTier: (tier: string) => void;
  onIssuePackage: (supplier: Supplier) => void;
  onUploadResponse: (supplier: Supplier, cycle: AttestationCycle) => void;
  onReviewGate: (supplier: Supplier, assessment: Assessment) => void;
  onDeficiencyLetter: (supplier: Supplier, cycle: AttestationCycle) => void;
}

const TIER_OPTIONS = [
  { key: "ALL", label: "All Tiers" },
  { key: "TIER_1_STRATEGIC", label: "T1 Strategic" },
  { key: "TIER_2_MANUFACTURING", label: "T2 Manufacturing" },
  { key: "TIER_3_COMMODITY", label: "T3 Commodity" },
];

export function SupplierDirectoryTable({
  suppliers,
  cycles,
  assessmentsMap,
  selectedTier,
  onSelectTier,
  onIssuePackage,
  onUploadResponse,
  onReviewGate,
  onDeficiencyLetter,
}: SupplierDirectoryTableProps) {
  const getCycleForSupplier = (supplierId: string) => {
    return cycles.find((c) => c.supplier_id === supplierId);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    if (selectedTier === "ALL") return true;
    return s.tier === selectedTier;
  });

  return (
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
          {TIER_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => onSelectTier(t.key)}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                selectedTier === t.key
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                          onClick={() => onIssuePackage(supplier)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          Issue Package
                        </button>
                      )}

                      {/* 2. Ingestion */}
                      {cycle && (
                        <button
                          onClick={() => onUploadResponse(supplier, cycle)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          {cycle.status === "ISSUED" ? "Upload Response" : "Re-Upload"}
                        </button>
                      )}

                      {/* 3. Review Gate */}
                      {assessment && (
                        <button
                          onClick={() => onReviewGate(supplier, assessment)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Review Gate
                        </button>
                      )}

                      {/* 4. Follow-up Letter */}
                      {cycle && assessment && findingsCount > 0 && (
                        <button
                          onClick={() => onDeficiencyLetter(supplier, cycle)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors flex items-center gap-1 cursor-pointer"
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
  );
}
