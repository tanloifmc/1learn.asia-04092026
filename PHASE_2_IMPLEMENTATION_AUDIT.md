# PHASE 2 IMPLEMENTATION AUDIT

## 1. EXISTING IMPLEMENTATION TO REUSE
Based on the repository audit, we have the following core engines existing in `src/features/career/actions/` and `src/features/assessment/utils/`:
- `profile-builder.ts`: Aggregates scores into Unified Profile.
- `interpretation-engine.ts`: Generates deterministic interpretations based on the profile.
- `report-builder.ts`: Current attempt at building report data. Needs to be refactored to align with `09_REPORT_UI_SPECIFICATION.md`.
- `interpretation-dictionary.ts`: Contains string constants and rules for interpretation.
- `scoring.ts`: Existing scoring logic (MUST NOT BE MODIFIED).

## 2. EXISTING `ReportData` STATE
Currently, `report-builder.ts` attempts to build the report, but lacks the formal, strictly typed `ReportData` contract defined in our Phase 2 Spec.
- **Data available:** Identity, RIASEC (scores/ranks), Big Five (scores/ranks), Work Values (scores/ranks), Validity flags (Speeding, Attention).
- **Missing fields:** Formal `status` flags per capability (`AVAILABLE`, `NOT_AVAILABLE`, `EMPTY`), global `Validity` state (VALID, QUESTIONABLE, INVALID, UNDETERMINED).

## 3. SECTION DATA AVAILABILITY
### A. SECTIONS WITH REAL DATA (Ready for Free & Premium)
- **01 Career Identity** (Identity derived from Top RIASEC)
- **02/03 RIASEC Interest Profile** (Rankings available)
- **04 Personality Profile (Big Five)** (Scores available, needs relative Prominent/Moderate/Lower mapping)
- **05 Work Values** (Rankings available)
- **07 Strengths Map / 08 Development Areas** (Available via Interpretation Engine)

### B. SECTIONS PENDING DETERMINISTIC SUPPORT
- **06 Cross-Dimension Insight:** Requires `patterns` from `interpretation-engine.ts`. If not fully supported by engine, will return `patterns: []`.

### C. SECTIONS WITHOUT ENGINE (MUST BE `NOT_AVAILABLE`)
- **10 Career Exploration** (Career Matching Engine not present in current phase)
- **11 Major Exploration** (Major Matching Engine not present)
- **12 University Exploration** (University Matching Engine not present)
- **13 Goal & Action Plan** (Roadmap Engine not present)

## 4. ADAPTERS / MAPPERS REQUIRED
We need to create/update a deterministic adapter (`report-builder.ts`) that:
- Reads the output of `profile-builder.ts` and `interpretation-engine.ts`.
- Applies the Global Validity Gate logic (`08_VALIDITY_SPECIFICATION.md`).
- Maps the data into a strict `ReportData` interface.
- Forces `NOT_AVAILABLE` status for missing engines.

## 5. FORBIDDEN IMPLEMENTATIONS (OUT OF SCOPE)
- **ABSOLUTELY NO:** Database schema changes, migrations, or seed data modifications.
- **ABSOLUTELY NO:** Modifying existing scoring formulas, Big Five `+/-10` rules, or tie-break logic.
- **ABSOLUTELY NO:** Mocking or faking Career, Major, University, or Roadmap data.
- **ABSOLUTELY NO:** AI LLM calls to invent strengths, watch-outs, or cross-dimension patterns.

## 6. PROPOSED FILES TO CREATE/EDIT
1. `src/types/report.ts` (NEW/EDIT): Define the strict `ReportData` contract and capability states.
2. `src/features/career/actions/report-builder.ts` (EDIT): Implement the deterministic mapper/builder enforcing Validity and `NOT_AVAILABLE` states.
3. `src/app/(app)/report/free/page.tsx` (NEW): Implement Free Report UI (Career Discovery Snapshot).
4. `src/app/(app)/report/premium/page.tsx` (NEW): Implement Premium Report UI (Personal Career Profile).
5. `src/components/report/*` (NEW): Reusable Bento UI components (e.g., `CareerIdentityHero.tsx`, `RiasecSection.tsx`, `BigFiveSection.tsx`, `WorkValuesSection.tsx`, `ValidityNotice.tsx`, `PremiumTeaser.tsx`).
