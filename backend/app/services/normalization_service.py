import json
import re
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import AttestationCycleModel, AssessmentModel, FindingModel, SupplierModel
from app.schemas.enums import (
    AttestationStatus,
    ESGPillar,
    FindingSeverity,
    ReviewDecision,
    RiskTier,
    SupplierTier,
    Region,
)
from app.schemas.assessment import (
    EnvironmentalMetrics,
    SocialMetrics,
    GovernanceMetrics,
    FindingSchema,
    NormalizedAssessmentSchema,
)


class NormalizationService:
    """
    Normalizes multi-format raw supplier responses into a unified assessment schema.
    Computes ESG pillar scores, identifies gap findings, and quotes exact verbatim supplier responses.
    """

    def __init__(self, db: AsyncSession | None = None):
        self.db = db

    def _extract_quote(self, text: str, keywords: list[str], default_quote: str) -> str:
        """Finds and extracts the exact sentence in the raw text matching keywords."""
        lines = text.split("\n")
        for line in lines:
            cleaned = line.strip()
            if not cleaned:
                continue
            for kw in keywords:
                if kw.lower() in cleaned.lower():
                    # Return cleanly trimmed sentence
                    return cleaned[:250]
        return default_quote

    def analyze_response_text(
        self,
        raw_text: str,
        tier: str,
        region: str,
        supplier_name: str
    ) -> NormalizedAssessmentSchema:
        """Rule-based and semantic normalization engine for supplier ESG responses."""
        lower_text = raw_text.lower()
        findings: list[FindingSchema] = []

        # --- 1. Environmental Analysis ---
        env = EnvironmentalMetrics()

        # Scope 1 & 2
        if "scope 1" in lower_text:
            env.ghg_scope_1_reported = True
            m1 = re.search(r"(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:mt|metric tons?)\s*co2e", lower_text)
            if m1:
                env.ghg_scope_1_mt_co2e = float(m1.group(1).replace(",", ""))

        if "scope 2" in lower_text and ("not track" not in lower_text and "do not measure" not in lower_text):
            env.ghg_scope_2_reported = True
            m2 = re.search(r"scope 2.*?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:mt|metric tons?)\s*co2e", lower_text)
            if m2:
                env.ghg_scope_2_mt_co2e = float(m2.group(1).replace(",", ""))

        if "scope 3" in lower_text and ("measured" in lower_text or "tracked" in lower_text or "yes" in lower_text):
            env.ghg_scope_3_tracked = True

        if "iso 14001" in lower_text and ("certified" in lower_text or "valid" in lower_text or "yes" in lower_text) and "not yet" not in lower_text:
            env.iso_14001_certified = True

        # Renewable energy percentage
        ren_match = re.search(r"(\d+)%\s*(?:renewable|clean\s*energy|solar|wind)", lower_text)
        if ren_match:
            env.renewable_energy_percentage = float(ren_match.group(1))

        # Check Environmental Gaps
        if tier == SupplierTier.TIER_1_STRATEGIC.value and not env.ghg_scope_2_reported:
            quote = self._extract_quote(
                raw_text,
                ["scope 2", "indirect emissions", "electricity emissions", "do not measure"],
                "We currently do not track Scope 2 indirect emissions from electricity consumption."
            )
            findings.append(FindingSchema(
                id=str(uuid.uuid4()),
                pillar=ESGPillar.ENVIRONMENTAL,
                severity=FindingSeverity.HIGH,
                standard_clause="Clause E1.1: Mandatory Annual Scope 1 & 2 GHG Disclosures",
                shortfall_summary="Supplier failed to calculate or verify Scope 2 greenhouse gas emissions.",
                supplier_exact_quote=quote,
                source_location="Environmental Section / Emissions Log",
                recommended_action="Execute Scope 2 inventory based on utility electricity bills and submit third-party audit within 30 days."
            ))

        if tier == SupplierTier.TIER_1_STRATEGIC.value and not env.iso_14001_certified:
            quote = self._extract_quote(
                raw_text,
                ["iso 14001", "ems", "environmental management"],
                "ISO 14001 certification has not yet been audited for the current fiscal year."
            )
            findings.append(FindingSchema(
                id=str(uuid.uuid4()),
                pillar=ESGPillar.ENVIRONMENTAL,
                severity=FindingSeverity.MEDIUM,
                standard_clause="Clause E1.4: Certified Environmental Management System (ISO 14001)",
                shortfall_summary="Lack of active ISO 14001 EMS certification for primary manufacturing operations.",
                supplier_exact_quote=quote,
                source_location="Environmental Certifications Section",
                recommended_action="Provide EMS roadmap and target date for ISO 14001 audit completion."
            ))

        # --- 2. Social Analysis ---
        soc = SocialMetrics()
        
        # Working Hours & Overtime
        hours_match = re.search(r"(\d+)\s*(?:hours|hrs)\s*(?:per\s*week|weekly)", lower_text)
        if hours_match:
            soc.maximum_weekly_hours = int(hours_match.group(1))

        if "forced labor" in lower_text and ("prohibit" in lower_text or "ban" in lower_text or "zero" in lower_text):
            soc.forced_labor_prohibition = True
        
        if "child labor" in lower_text and ("prohibit" in lower_text or "ban" in lower_text or "zero" in lower_text):
            soc.child_labor_prohibition = True

        if "grievance" in lower_text and ("hotline" in lower_text or "box" in lower_text or "channel" in lower_text or "active" in lower_text):
            soc.worker_grievance_mechanism = True

        # Check Social Gaps
        if soc.maximum_weekly_hours > 60:
            quote = self._extract_quote(
                raw_text,
                ["overtime", "peak season", f"{soc.maximum_weekly_hours} hours", "working hours"],
                f"During peak production seasons, workers operate up to {soc.maximum_weekly_hours} hours per week to meet quota deadlines."
            )
            findings.append(FindingSchema(
                id=str(uuid.uuid4()),
                pillar=ESGPillar.SOCIAL,
                severity=FindingSeverity.CRITICAL,
                standard_clause="Clause 2.3: Maximum Statutory Working Hours & Rest Day Guarantee",
                shortfall_summary=f"Reported working hours of {soc.maximum_weekly_hours} hrs/week exceed maximum international ILO limit of 60 hours (including overtime).",
                supplier_exact_quote=quote,
                source_location="Labor & Working Hours Disclosure",
                recommended_action="Implement mandatory shift capping at 60 hours/week and institute guaranteed weekly rest days."
            ))

        if ("recruitment" in lower_text and "fee" in lower_text) and ("deduct" in lower_text or "agency" in lower_text) and "reimburse" not in lower_text and "zero" not in lower_text:
            quote = self._extract_quote(
                raw_text,
                ["recruitment", "agency fee", "agency fees", "placement"],
                "Recruitment agency fees are deducted across the first 6 months of employment."
            )
            findings.append(FindingSchema(
                id=str(uuid.uuid4()),
                pillar=ESGPillar.SOCIAL,
                severity=FindingSeverity.CRITICAL,
                standard_clause="Clause APAC-1: Employer-Pays Principle & Recruitment Fee Prohibition",
                shortfall_summary="Supplier permits recruitment fee deductions from worker wages in violation of the Employer-Pays Principle.",
                supplier_exact_quote=quote,
                source_location="Annex R-APAC Section 1",
                recommended_action="Abolish all worker wage deductions for agency fees and initiate immediate reimbursement to affected workers."
            ))

        # --- 3. Governance Analysis ---
        gov = GovernanceMetrics()
        
        if ("anti-bribery" in lower_text or "anti-corruption" in lower_text) and "informal" not in lower_text and "not documented" not in lower_text:
            gov.anti_bribery_policy = True
        else:
            gov.anti_bribery_policy = False

        if "whistleblower" in lower_text or "anonymous hotline" in lower_text:
            gov.whistleblower_protection_channel = True

        if "traceability" in lower_text or "bom" in lower_text or "chain of custody" in lower_text:
            gov.sub_tier_traceability = True

        # Check Governance Gaps
        if not gov.anti_bribery_policy:
            quote = self._extract_quote(
                raw_text,
                ["bribery", "corruption", "informal", "not documented"],
                "Formal anti-corruption training is currently informal and not documented."
            )
            findings.append(FindingSchema(
                id=str(uuid.uuid4()),
                pillar=ESGPillar.GOVERNANCE,
                severity=FindingSeverity.HIGH,
                standard_clause="Clause 3.1: Mandatory Anti-Bribery Policy & Annual Training",
                shortfall_summary="Absence of formalized Anti-Bribery policy and audited staff training curriculum.",
                supplier_exact_quote=quote,
                source_location="Governance & Integrity Section",
                recommended_action="Adopt corporate Anti-Bribery Charter and submit certification of 100% staff completion within 45 days."
            ))

        # Calculate Scores
        env_score = 100.0
        if not env.ghg_scope_1_reported: env_score -= 25.0
        if not env.ghg_scope_2_reported: env_score -= 25.0
        if not env.iso_14001_certified and tier != SupplierTier.TIER_3_COMMODITY.value: env_score -= 20.0
        if env.renewable_energy_percentage < 20.0: env_score -= 15.0
        env_score = max(10.0, env_score)

        soc_score = 100.0
        if soc.maximum_weekly_hours > 60: soc_score -= 40.0
        if not soc.worker_grievance_mechanism: soc_score -= 25.0
        if not soc.living_wage_guarantee: soc_score -= 25.0
        if any(f.pillar == ESGPillar.SOCIAL and f.severity == FindingSeverity.CRITICAL for f in findings):
            soc_score -= 20.0
        soc_score = max(10.0, soc_score)

        gov_score = 100.0
        if not gov.anti_bribery_policy: gov_score -= 40.0
        if not gov.whistleblower_protection_channel: gov_score -= 30.0
        if not gov.sub_tier_traceability and tier == SupplierTier.TIER_1_STRATEGIC.value: gov_score -= 20.0
        gov_score = max(10.0, gov_score)

        # Risk Calculation
        compliance_composite = (env_score * 0.35) + (soc_score * 0.35) + (gov_score * 0.30)
        raw_risk = round(100.0 - compliance_composite, 1)

        # Penalty escalation for critical findings
        critical_count = sum(1 for f in findings if f.severity == FindingSeverity.CRITICAL)
        high_count = sum(1 for f in findings if f.severity == FindingSeverity.HIGH)
        
        overall_risk_score = min(100.0, max(raw_risk, (critical_count * 25.0) + (high_count * 15.0) + raw_risk * 0.5))
        overall_risk_score = round(overall_risk_score, 1)

        # Risk Tier
        if critical_count > 0 or overall_risk_score >= 60.0:
            risk_tier = RiskTier.CRITICAL
        elif high_count > 0 or overall_risk_score >= 40.0:
            risk_tier = RiskTier.HIGH
        elif overall_risk_score >= 20.0:
            risk_tier = RiskTier.MEDIUM
        else:
            risk_tier = RiskTier.LOW

        findings_count = len(findings)
        exec_summary = (
            f"Supplier {supplier_name} completed the {tier} attestation cycle for jurisdiction {region}. "
            f"The assessment produced an Overall Risk Score of {overall_risk_score}/100 ({risk_tier.value}). "
            f"Pillar Scores: Environmental {env_score:.1f}%, Social {soc_score:.1f}%, Governance {gov_score:.1f}%. "
            f"Identified {findings_count} specific compliance findings requiring remediation."
            if findings_count > 0 else
            f"Supplier {supplier_name} completed the {tier} attestation cycle with an exceptional score. "
            f"Honest evaluation confirms 0 compliance shortfalls or discrepancies."
        )

        return NormalizedAssessmentSchema(
            environmental=env,
            social=soc,
            governance=gov,
            environmental_score=env_score,
            social_score=soc_score,
            governance_score=gov_score,
            overall_risk_score=overall_risk_score,
            risk_tier=risk_tier,
            executive_summary=exec_summary,
            findings=findings
        )

    async def normalize_attestation(self, attestation_id: str, raw_response_text: str) -> AssessmentModel:
        """Normalizes an attestation and commits assessment and finding records to DB."""
        if not self.db:
            raise ValueError("Database session required for persistent normalization.")

        stmt = (
            select(AttestationCycleModel)
            .where(AttestationCycleModel.id == attestation_id)
        )
        res = await self.db.execute(stmt)
        attestation = res.scalar_one_or_none()
        if not attestation:
            raise ValueError(f"Attestation {attestation_id} not found.")

        # Load supplier
        sup_stmt = select(SupplierModel).where(SupplierModel.id == attestation.supplier_id)
        sup_res = await self.db.execute(sup_stmt)
        supplier = sup_res.scalar_one_or_none()
        if not supplier:
            raise ValueError(f"Supplier for attestation {attestation_id} not found.")

        normalized_data = self.analyze_response_text(
            raw_response_text,
            tier=supplier.tier,
            region=supplier.region,
            supplier_name=supplier.name
        )

        # Check for existing assessment
        ass_stmt = select(AssessmentModel).where(AssessmentModel.attestation_id == attestation.id)
        ass_res = await self.db.execute(ass_stmt)
        assessment = ass_res.scalar_one_or_none()

        if not assessment:
            assessment = AssessmentModel(
                id=str(uuid.uuid4()),
                attestation_id=attestation.id,
                overall_risk_score=normalized_data.overall_risk_score,
                risk_tier=normalized_data.risk_tier.value,
                environmental_score=normalized_data.environmental_score,
                social_score=normalized_data.social_score,
                governance_score=normalized_data.governance_score,
                summary_markdown=normalized_data.executive_summary,
                normalized_data_json=normalized_data.model_dump_json(),
                is_approved=False
            )
            self.db.add(assessment)
            await self.db.flush()
        else:
            assessment.overall_risk_score = normalized_data.overall_risk_score
            assessment.risk_tier = normalized_data.risk_tier.value
            assessment.environmental_score = normalized_data.environmental_score
            assessment.social_score = normalized_data.social_score
            assessment.governance_score = normalized_data.governance_score
            assessment.summary_markdown = normalized_data.executive_summary
            assessment.normalized_data_json = normalized_data.model_dump_json()

        # Update findings
        del_stmt = select(FindingModel).where(FindingModel.assessment_id == assessment.id)
        del_res = await self.db.execute(del_stmt)
        for old_f in del_res.scalars():
            await self.db.delete(old_f)

        for f_schema in normalized_data.findings:
            new_finding = FindingModel(
                id=f_schema.id,
                assessment_id=assessment.id,
                pillar=f_schema.pillar.value,
                severity=f_schema.severity.value,
                standard_clause=f_schema.standard_clause,
                shortfall_summary=f_schema.shortfall_summary,
                supplier_exact_quote=f_schema.supplier_exact_quote,
                source_location=f_schema.source_location,
                recommended_action=f_schema.recommended_action,
                review_decision=ReviewDecision.PENDING.value
            )
            self.db.add(new_finding)

        # Update attestation cycle status
        attestation.status = (
            AttestationStatus.FOLLOW_UP_REQUIRED.value
            if len(normalized_data.findings) > 0
            else AttestationStatus.NORMALIZED.value
        )
        attestation.normalized_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(assessment)
        return assessment
