"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { BackendOfflineAlert } from "./components/BackendOfflineAlert";
import { HeroBanner } from "./components/HeroBanner";
import { KpiStatsSection } from "./components/KpiStatsSection";
import {
  RiskDistributionDonut,
  TierRiskBarChart,
  PillarScoresCard,
} from "./components/Charts";
import { SupplierDirectoryTable } from "./components/SupplierDirectoryTable";
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

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navbar */}
      <Navbar onRefresh={loadAllData} loading={loading} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Backend Offline Alert */}
        {error && <BackendOfflineAlert error={error} onRetry={loadAllData} />}

        {/* Page Hero Banner */}
        <HeroBanner onOpenReport={() => setIsReportOpen(true)} />

        {/* KPI Stats Row */}
        {report && <KpiStatsSection report={report} />}

        {/* Charts Row */}
        {report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RiskDistributionDonut data={report.risk_tier_breakdown} />
            <TierRiskBarChart data={report.tier_distribution} />
            <PillarScoresCard scores={report.pillar_averages} />
          </div>
        )}

        {/* Supplier Attestation Management Directory */}
        <SupplierDirectoryTable
          suppliers={suppliers}
          cycles={cycles}
          assessmentsMap={assessmentsMap}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          onIssuePackage={(supplier) => {
            setSelectedSupplier(supplier);
            setIsIssuanceOpen(true);
          }}
          onUploadResponse={(supplier, cycle) => {
            setSelectedSupplier(supplier);
            setSelectedCycle(cycle);
            setIsIngestionOpen(true);
          }}
          onReviewGate={(supplier, assessment) => {
            setSelectedSupplier(supplier);
            setSelectedAssessment(assessment);
            setIsReviewOpen(true);
          }}
          onDeficiencyLetter={(supplier, cycle) => {
            setSelectedSupplier(supplier);
            setSelectedCycle(cycle);
            setIsLetterOpen(true);
          }}
        />
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
