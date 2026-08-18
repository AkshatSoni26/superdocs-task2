from collections import Counter
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import SupplierModel, AttestationCycleModel, AssessmentModel, FindingModel
from app.schemas.enums import SupplierTier, Region, RiskTier
from app.schemas.report import (
    ProgrammeReportResponse,
    RiskDistributionItem,
    PillarAverageScores,
    TierRiskData,
    RegionalRiskData,
    TopFindingShortfall,
)
from app.services.superdocs_service import SuperDocsClientService


class AggregationService:
    """Service to aggregate supplier attestation data and compile executive programme reports with charts."""

    def __init__(self, db: AsyncSession, superdocs_client: SuperDocsClientService | None = None):
        self.db = db
        self.superdocs = superdocs_client or SuperDocsClientService()

    async def get_programme_metrics(self, cycle_year: int = 2026) -> ProgrammeReportResponse:
        # 1. Fetch all suppliers
        sup_stmt = select(SupplierModel)
        sup_res = await self.db.execute(sup_stmt)
        suppliers = list(sup_res.scalars().all())
        total_invited = len(suppliers)

        tier_stats: dict[str, dict[str, int]] = {
            t.value: {"total": 0, "low": 0, "med": 0, "high": 0, "crit": 0} for t in SupplierTier
        }
        reg_stats: dict[str, dict[str, int]] = {
            r.value: {"total": 0, "low": 0, "med": 0, "high": 0} for r in Region
        }

        # Initialize total counts from all registered suppliers
        for s in suppliers:
            if s.tier in tier_stats:
                tier_stats[s.tier]["total"] += 1
            if s.region in reg_stats:
                reg_stats[s.region]["total"] += 1

        # 2. Fetch all attestations for the year
        att_stmt = select(AttestationCycleModel).where(AttestationCycleModel.cycle_year == cycle_year)
        att_res = await self.db.execute(att_stmt)
        attestations = list(att_res.scalars().all())
        
        submitted_count = sum(
            1 for a in attestations
            if a.status in ["SUBMITTED", "NORMALIZED", "UNDER_REVIEW", "APPROVED", "FOLLOW_UP_REQUIRED", "CLOSED"]
        )
        attestation_rate = round((submitted_count / total_invited * 100.0) if total_invited > 0 else 0.0, 1)

        # 3. Fetch all assessments
        ass_stmt = (
            select(AssessmentModel, AttestationCycleModel, SupplierModel)
            .join(AttestationCycleModel, AssessmentModel.attestation_id == AttestationCycleModel.id)
            .join(SupplierModel, AttestationCycleModel.supplier_id == SupplierModel.id)
            .where(AttestationCycleModel.cycle_year == cycle_year)
        )
        ass_res = await self.db.execute(ass_stmt)
        assessment_rows = list(ass_res.all())

        risk_counts = {RiskTier.CRITICAL.value: 0, RiskTier.HIGH.value: 0, RiskTier.MEDIUM.value: 0, RiskTier.LOW.value: 0}
        env_scores: list[float] = []
        soc_scores: list[float] = []
        gov_scores: list[float] = []

        for ass, att, sup in assessment_rows:
            tier_val = sup.tier
            reg_val = sup.region
            r_tier = ass.risk_tier

            risk_counts[r_tier] = risk_counts.get(r_tier, 0) + 1
            env_scores.append(ass.environmental_score)
            soc_scores.append(ass.social_score)
            gov_scores.append(ass.governance_score)

            if tier_val in tier_stats:
                if r_tier == "LOW": tier_stats[tier_val]["low"] += 1
                elif r_tier == "MEDIUM": tier_stats[tier_val]["med"] += 1
                elif r_tier == "HIGH": tier_stats[tier_val]["high"] += 1
                elif r_tier == "CRITICAL": tier_stats[tier_val]["crit"] += 1

            if reg_val in reg_stats:
                if r_tier == "LOW": reg_stats[reg_val]["low"] += 1
                elif r_tier == "MEDIUM": reg_stats[reg_val]["med"] += 1
                else: reg_stats[reg_val]["high"] += 1

        total_assessed = len(assessment_rows)
        risk_breakdown = [
            RiskDistributionItem(
                category=cat,
                count=cnt,
                percentage=round((cnt / total_assessed * 100.0) if total_assessed > 0 else 0.0, 1)
            )
            for cat, cnt in risk_counts.items()
        ]

        pillar_averages = PillarAverageScores(
            environmental_avg=round(sum(env_scores) / len(env_scores), 1) if env_scores else 0.0,
            social_avg=round(sum(soc_scores) / len(soc_scores), 1) if soc_scores else 0.0,
            governance_avg=round(sum(gov_scores) / len(gov_scores), 1) if gov_scores else 0.0,
            overall_compliance_avg=round(
                (sum(env_scores) + sum(soc_scores) + sum(gov_scores)) / (len(env_scores) * 3), 1
            ) if env_scores else 0.0
        )

        tier_distribution = [
            TierRiskData(
                tier=SupplierTier(t),
                total_suppliers=tier_stats[t]["total"],
                low_risk=tier_stats[t]["low"],
                medium_risk=tier_stats[t]["med"],
                high_risk=tier_stats[t]["high"],
                critical_risk=tier_stats[t]["crit"]
            )
            for t in tier_stats
        ]

        regional_distribution = [
            RegionalRiskData(
                region=Region(r),
                total_suppliers=reg_stats[r]["total"],
                low_risk=reg_stats[r]["low"],
                medium_risk=reg_stats[r]["med"],
                high_risk=reg_stats[r]["high"]
            )
            for r in reg_stats
        ]

        # Top recurring shortfalls
        find_stmt = select(FindingModel)
        find_res = await self.db.execute(find_stmt)
        all_findings = list(find_res.scalars().all())

        finding_counts = Counter(f.standard_clause for f in all_findings)
        top_shortfalls = []
        for clause, count in finding_counts.most_common(5):
            match_f = next(f for f in all_findings if f.standard_clause == clause)
            top_shortfalls.append(TopFindingShortfall(
                standard_clause=clause,
                pillar=match_f.pillar,
                occurrence_count=count,
                severity=match_f.severity
            ))

        prog_risk = (
            "HIGH" if risk_counts.get("CRITICAL", 0) + risk_counts.get("HIGH", 0) > total_assessed * 0.4
            else "MEDIUM" if risk_counts.get("MEDIUM", 0) > total_assessed * 0.3
            else "CONTROLLED / LOW"
        )

        narrative = f"""# EXECUTIVE SUPPLIER ESG PROGRAMME AUDIT REPORT ({cycle_year})

## 1. Executive Summary
During the {cycle_year} Supplier Attestation Cycle, **{total_invited} suppliers** across 3 tiers and 3 global operating jurisdictions were invited to complete the mandatory ESG & Ethical Conduct Attestation.

- **Programme Completion Rate:** **{attestation_rate}%** ({submitted_count}/{total_invited} suppliers)
- **Programme Risk Rating:** **{prog_risk}**
- **Average ESG Compliance:** Environmental **{pillar_averages.environmental_avg}%**, Social **{pillar_averages.social_avg}%**, Governance **{pillar_averages.governance_avg}%**.

## 2. Key Systemic Risk Vectors
1. **Scope 2 & 3 Emissions Gaps:** Strategic Tier 1 suppliers in emerging manufacturing hubs show delays in external third-party energy verifications.
2. **Working Hours Peak-Season Overtime:** Manufacturing sites report seasonal peak compression requiring enhanced labor scheduling controls.
3. **Formal Anti-Bribery Curricula:** Indirect commodity suppliers require standardized training packs to satisfy supply chain due diligence mandates.
"""

        return ProgrammeReportResponse(
            cycle_year=cycle_year,
            total_suppliers_invited=total_invited,
            responses_submitted=submitted_count,
            attestation_rate_pct=attestation_rate,
            overall_programme_risk_level=prog_risk,
            pillar_averages=pillar_averages,
            risk_tier_breakdown=risk_breakdown,
            tier_distribution=tier_distribution,
            regional_distribution=regional_distribution,
            top_recurring_shortfalls=top_shortfalls,
            executive_narrative_markdown=narrative,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
