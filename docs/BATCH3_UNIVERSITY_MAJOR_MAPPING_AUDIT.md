# BATCH 3: UNIVERSITY ↔ MAJOR MAPPING AUDIT
*Date: 2026-09-03T12:10:36.344Z*

## 1. Overview
This audit evaluates the deterministic mapping between the real-world admissions data (`data/national_universities_candidate.json`) and the Core Platform's `majors` and `universities` master tables.

**Rules Applied:**
- EXACT-MATCH ONLY on `major_code` and `university_code`. No AI fuzzy matching.
- Any mismatch is flagged as `UNMAPPED`.

## 2. Quantitative Results

| Metric | Count |
|--------|-------|
| Total Universities in candidate file | **304** |
| Total Programs in candidate file | **6542** |
| Exact Major-Code Matches | **4042** |
| Unmatched Major Codes | **2500** |
| Programs without Major Code | **0** |
| Universities not found in DB | **83** |
| Duplicate (University + Major) combinations | **105** |
| Invalid/Null Program Names | **0** |

## 3. Findings

### Universities Mismatch
83 universities in the candidate file were not found in the DB (based on exact `code` match).
*Sample missing codes: ANH, ANS, BPH, IUH, BVS, KGC, KGH, CMC, CSH, KMA*

### Majors Mismatch
2500 programs refer to a major code that does not exist in the 377 Master Majors.
*Sample missing major codes: 7860100, 7860114, BF1, BF2, CH1, CH2, ED2, ED3, ED5, EE1*

### Duplicate Mappings (Constraint Violation Risk)
There are 105 instances where a university offers multiple programs mapping to the **same** `major_code`.
Because the `university_majors` table has a `UNIQUE(university_id, major_id, program_type)` constraint, we MUST carefully assign `program_type` (e.g., Standard, High Quality) or rely on Postgres's handling of NULLs for this constraint to avoid collision if multiple programs are inserted with `program_type = null`.

## 4. Conclusion
**MAPPING_REVIEW_REQUIRED**
Before proceeding with import, please review the exact match rate and duplicate handling.
