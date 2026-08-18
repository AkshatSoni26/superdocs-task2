# SuperDocs Build: Supplier Code-of-Conduct & ESG Questionnaire Cycle

> *Built for the SuperDocs Full-Stack AI Engineer Task (Assigned Build S2: Responsible-Sourcing & Supplier Attestation)*

An automated, audit-ready compliance intelligence platform built on the **SuperDocs API & MCP surface**. The system manages the complete annual supplier ESG attestation lifecycle: issuing localized tier-specific questionnaires and codes of conduct, normalizing multi-format responses into a standardized schema, enforcing human-in-the-loop review gates, automatically drafting evidence-quoted deficiency notices, and reconciling aggregate risk profile charts.

---

## 📸 Key Capabilities & Architecture

```mermaid
flowchart TD
    subgraph UI ["Next.js App Router (React 19 + Tailwind CSS + Recharts)"]
        Dashboard["📊 Executive Dashboard & Risk Profile Charts"]
        Issuer["📝 Tier & Region Questionnaire Wizard"]
        IngestHub["📥 Multi-Format Response Hub (.pdf, .docx, .txt)"]
        ReviewGate["🔍 Human Review Gate & SuperDocs Diff Viewer"]
        LetterGen["✉️ Deficiency Letter Generator (Verbatim Quotes)"]
        ReportGen["📑 Executive Programme Report & Export"]
    end

    subgraph Backend ["FastAPI Backend (Python 3.12 + strict Pydantic + SQLAlchemy)"]
        API["FastAPI Endpoints (/api/v1)"]
        
        subgraph Services ["OOP Service Layer"]
            SD_Client["SuperDocsClientService\n(Upload, Chat, Approve, Export, 2-Step JSON Parse)"]
            Issuance["IssuanceService\n(Tier 1-3 & EU/US/APAC Addenda)"]
            Ingestion["IngestionService\n(PDF/DOCX/Text Stream Parsing)"]
            Norm["NormalizationService\n(ESG Scoring & Verbatim Quote Extraction)"]
            FollowUp["FollowUpService\n(Remediation Letters with Evidence Quotes)"]
            Aggregation["AggregationService\n(Risk Distribution & Mathematical Reconciliation)"]
        end
        
        DB[("Database (Suppliers, Attestations, Findings, Letters)")]
    end

    subgraph SuperDocs ["SuperDocs Surface"]
        SD_Engine["SuperDocs Platform (REST API / MCP Tools)"]
    end

    UI <--> API
    API --> Services
    Services <--> DB
    SD_Client <--> SD_Engine
```

---

## 🌟 What Strong Looks Like (Rubric Achievements)

1. **Multi-Format Normalization into One Shape**:
   - Ingests supplier returns across PDF, Word (`.docx`), plain text, and JSON.
   - Normalizes all submissions into a strictly typed `NormalizedAssessmentSchema` with Environmental, Social, and Governance sub-scores (0–100) and risk tiering.
2. **Surgical Evidence Quotes in Follow-Up Letters**:
   - Every flagged shortfall finding automatically extracts and quotes the **supplier's exact verbatim submitted statement** (e.g. *"We currently do not track Scope 2 indirect emissions from electricity consumption"*).
3. **Mathematical Reconciliation in Aggregate Reports**:
   - Executive dashboard charts (Risk Profile Donut, Stacked Tier Bar Chart, Pillar Compliance Averages) mathematically reconcile with individual supplier assessment records.
4. **Honest Zero-Finding Reports**:
   - Compliant suppliers (e.g. `Nordic CleanTech Solutions AB`) receive an honest report of **0 findings**, proving the system never hallucinates defects.
5. **SuperDocs 4-Step Contract & Two-Step JSON String Parsing**:
   - Strictly implements `Upload` $\rightarrow$ `Chat/Edit` $\rightarrow$ `Approve` $\rightarrow$ `Export`.
   - Correctly unpacks the double JSON string-encoded proposed changes payload from SuperDocs to avoid undefined diff cards.

---

## 🚀 Quickstart (Running in Minutes)

### Prerequisites
- **Python 3.11+** with `uv`
- **Node.js 20+** with `bun`

### 1. Run Backend (FastAPI + uv)
```bash
cd backend
uv sync
uv run uvicorn app.main:app --port 8001 --reload
```
*The backend boots on `http://localhost:8001` and automatically pre-seeds 5 realistic suppliers and initial attestation cycles.*

### 2. Run Frontend (Next.js + bun)
```bash
cd frontend
bun install
bun run dev
```
*The frontend dashboard opens at `http://localhost:3031`.*

---

## 🧪 Running Automated Tests (Zero Live Key Required)

All tests run locally in milliseconds with in-memory SQLite and mock SuperDocs fallback:

```bash
cd backend
uv run pytest -v
```

### Test Coverage Highlights:
- `test_superdocs_service.py`: Verifies 4-step contract, mock mode, and **2-step JSON string parsing**.
- `test_issuance_service.py`: Verifies dynamic injection of Tier 1–3 questionnaires and EU/US/APAC regulatory annexes.
- `test_normalization_and_quotes.py`: Verifies verbatim citation extraction from supplier text and honest 0-finding clean reports.
- `test_follow_up_letters.py`: Verifies generation of evidence-quoted deficiency notices.
- `test_aggregation_and_reconciliation.py`: Proves mathematical reconciliation between aggregate chart counts and individual supplier records.
- `test_api_endpoints.py`: Integration testing of all FastAPI v1 endpoints.

---

## 📐 Domain Structure & Localized Templates

| Tier | Mandatory Questionnaire Scope | Applicable Regulatory Annexes |
| :--- | :--- | :--- |
| **Tier 1 (Strategic)** | Scope 1–3 GHG accounting, ISO 14001, Sub-tier BOM Provenance | **EU CSRD/CSDDD/REACH** (Europe) |
| **Tier 2 (Manufacturing)** | kWh Energy, Solder/Chemical Waste, 48+12h Workweek, Grievance Boxes | **APAC Labor & Migrant Rights** (Asia-Pacific) |
| **Tier 3 (Commodities)** | Statutory EPA Permits, Clean Transport Fleet, Anti-Bribery Pledge | **US UFLPA & Conflict Minerals** (North America) |

---

## ⚖️ Self-Reported Limitations & Trade-Offs

- **OCR on Scanned/Image PDFs**: Text extraction uses PyPDF stream parsing; scanned image-only PDFs fall back to OCR text layers. In production, an upstream vision OCR pre-processor would handle low-resolution scans.
- **Dynamic Chart Rendering in Exported PDFs**: Executive report PDFs currently render formatted markdown tables and summary datasets; native server-side SVG chart rasterization inside PDF documents is earmarked for v1.1.
