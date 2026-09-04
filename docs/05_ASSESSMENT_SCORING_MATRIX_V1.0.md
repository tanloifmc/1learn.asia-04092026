# 1learn.asia — ASSESSMENT SCORING MATRIX V1.0

**Status:** LOCKED FOR IMPLEMENTATION
**Version:** 2026.1
**Owner:** Product/CTO
**Rule:** Developer MUST implement these formulas exactly. Any change requires a new assessment version.

## 1. Non-negotiable rules
- Scoring is deterministic.
- The frontend MUST NOT calculate authoritative scores.
- The backend/engine is the single source of truth.
- Raw responses MUST be retained.
- assessment_version MUST be retained with every response/result.
- LLM MUST NOT calculate, rank, normalize, or alter scores.
- RIASEC, Big Five and Work Values are profile signals, NOT skill proficiency.
- Assessment dimensions MUST NOT be used as skill-gap coverage.
- Academic readiness/skill gaps come from academic_records and later target_requirements.
- Result language must be probabilistic/exploratory: "đáng khám phá", "có xu hướng", "có nhiều điểm tương đồng"; never "chắc chắn phù hợp".

## 2. Canonical response scales
### 2.1 Agreement scale
| Value | Label |
|---|---|
| 1 | Hoàn toàn không đúng |
| 2 | Không đúng lắm |
| 3 | Phân vân / khó nói |
| 4 | Khá đúng |
| 5 | Rất đúng |
*Used by: RIASEC, Big Five, Career Readiness, Quality consistency items*

### 2.2 Importance scale
| Value | Label |
|---|---|
| 1 | Hoàn toàn không quan trọng |
| 2 | Không quan trọng lắm |
| 3 | Phân vân / khó nói |
| 4 | Khá quan trọng |
| 5 | Cực kỳ quan trọng |
*Used by: Work Values*

## 3. RIASEC
### 3.1 Dimensions
| Code | Dimension | Items |
|---|---|---|
| R | Realistic | R01–R06 |
| I | Investigative | I01–I06 |
| A | Artistic | A01–A06 |
| S | Social | S01–S06 |
| E | Enterprising | E01–E06 |
| C | Conventional | C01–C06 |
*Total: 36 scored items.*

### 3.2 Item score
No reverse scoring.
`item_score = response_value`

### 3.3 Dimension raw score
For each dimension:
`raw_dimension = SUM(6 item scores)`
Range: 6–30.

### 3.4 Dimension normalized score
`score_0_100 = ROUND(((raw_dimension - 6) / 24) * 100)`
Examples: raw 6 → 0, raw 18 → 50, raw 30 → 100

### 3.5 RIASEC ranking
Sort the six normalized scores descending.
Store: rank 1, rank 2, rank 3, full six-dimensional vector
Do NOT discard dimensions 4–6.

**Top-code rule**
primary_code = top 3 dimension codes concatenated in descending score order (e.g. I R E → IRE)

**Tie rule**
If two dimensions differ by <= 2 points on the 0–100 scale:
- treat them as practically tied for display;
- use raw score as secondary ordering;
- if still tied, use canonical dimension order R,I,A,S,E,C;
- do not fabricate a stronger distinction.

## 4. Big Five
### 4.1 Dimensions
| Code | Dimension | Items |
|---|---|---|
| O | Openness | BF_O01–BF_O06 |
| C | Conscientiousness | BF_C01–BF_C06 |
| E | Extraversion | BF_E01–BF_E06 |
| A | Agreeableness | BF_A01–BF_A06 |
| N | Neuroticism / Emotional Reactivity | BF_N01–BF_N06 |
*Total: 30 scored items.*

### 4.2 Raw score
`raw_dimension = SUM(6 item scores)`
Range: 6–30.

### 4.3 Normalized score
`score_0_100 = ROUND(((raw_dimension - 6) / 24) * 100)`

### 4.4 Emotional Stability display
Canonical backend dimension is N = Neuroticism / Emotional Reactivity.
The UI SHOULD avoid presenting "Neuroticism" as a judgmental label.
If the UI needs a positive "Emotional Stability" indicator:
`emotional_stability = 100 - N_score`
Do NOT overwrite the canonical N score.

### 4.5 Big Five role in matching
Big Five is a contextual signal only.
Forbidden: High E -> Sales, Low E -> Not Sales, High C -> Engineer
Personality MUST NOT be used as a hard career gate in V1.

## 5. Work Values
### 5.1 Dimensions
| Code | Items |
|---|---|
| achievement | WV_ACH01–WV_ACH05 |
| independence | WV_IND01–WV_IND05 |
| recognition | WV_REC01–WV_REC05 |
| relationships | WV_REL01–WV_REL05 |
| support | WV_SUP01–WV_SUP05 |
| working_conditions | WV_WOR01–WV_WOR05 |
*Total: 30 scored items.*

### 5.2 Raw score
`raw_dimension = SUM(5 item scores)`
Range: 5–25.

### 5.3 Normalization
`score_0_100 = ROUND(((raw_dimension - 5) / 20) * 100)`

### 5.4 Top values
Sort six dimensions descending.
Store: all six values, top 1, top 2, top 3.
Do NOT collapse Work Values into a single score.

## 6. Career Readiness
Career Readiness is NOT a psychometric personality dimension.
It measures how far the student has already started the exploration/planning process.
Items: CR01–CR15.

### 6.1 Raw
`raw_readiness = SUM(CR01...CR15)`
Range: 15–75.

### 6.2 Normalized
`readiness_score = ROUND(((raw_readiness - 15) / 60) * 100)`

### 6.3 Stage
| Score | Stage | Meaning |
|---|---|---|
| 0–24 | STARTING | Đang bắt đầu |
| 25–49 | EXPLORING | Đang khám phá |
| 50–74 | CLARIFYING | Đang làm rõ lựa chọn |
| 75–100 | PLANNING | Đã bắt đầu lập kế hoạch |
These labels are journey stages, NOT ability grades.

## 7. Quality Control
There are 10 quality-control items: VC01–VC10. (Note: using VQ code in migration).
They are NOT included in any construct score.

### 7.1 Attention checks
Items: VC01, VC02, VC03, VC04 (Wait, matrix says VC01-04, but migration uses VQ_A01-VQ_A03).
Expected exact answers:
- VC01: 4
- VC02: 2
- VC03: 5
- VC04: 1
`attention_fail_count = number of failed checks`

## 8. Consistency checks
Items:
- VC05 ≈ 6 - BF_C01
- VC06 ≈ 6 - BF_O02
- VC07 ≈ 6 - S04
- VC08 ≈ 6 - WV_ACH01
- VC09 ≈ 6 - I06
- VC10 ≈ 6 - C06

For each pair: `difference = ABS(actual_consistency - expected_consistency)`
- Pass if: difference <= 1
- Fail if: difference >= 2
`consistency_fail_count = number of failed pairs`
These are operational response-quality checks, NOT formal validity coefficients.

## 9. Straight-line detection
Exclude quality-control items.
Look at the sequence of scored items in the actual presented order.
If the same response value occurs for: >= 12 consecutive scored questions
set: `STRAIGHTLINE_SUSPECTED = true`
This flag does not automatically invalidate the assessment.

## 10. Speeding
V1 MUST store: started_at, completed_at, duration_seconds.
Do NOT impose a hard time penalty in V1.

## 11. Operational quality score
This score is an internal response-quality indicator.
Start at 100.
Penalty:
- each failed attention check: -15
- each failed consistency check: -5
- straight-line suspected: -15
- severe pattern flag (if separately implemented): -10

Formula:
`quality_score = MAX(0, 100 - 15*attention_fail_count - 5*consistency_fail_count - 15*straightline_flag - 10*severe_pattern_flag)`

## 12. Assessment confidence
This field is generated by the Assessment Engine.
Rules:
- High: quality_score >= 80
- Medium: quality_score < 80
Usability: `is_usable = quality_score >= 60`
If is_usable = false: store the raw result; do not run Career Matching; ask the student to retake/review the assessment.

## 13. Profile confidence vs assessment confidence
Assessment confidence (Quality of this response session) != Derived signal confidence.
Do not calculate one from the other.

## 14. Student Career Profile
Canonical structure defined in spec.

## 15. Career Matching boundary
Assessment Engine stops at: Student Career Profile.
Assessment Engine MUST NOT: select careers, rank careers, calculate career match score, calculate skill gaps, calculate university fit, calculate admission fit.

## 16. Critical separation: preference vs capability
RIASEC / Big Five / Work Values are NOT skill proficiency.
Academic ability and skill readiness must come from academic_records and target_requirements.

## 17. Matching Engine V1 input contract
Career Matching receives RIASEC, Work Values, Big Five vectors.

## 18. Match score contract
DO NOT replace ability_score with a RIASEC/personality proxy.

## 19. Result language
Allowed: "có xu hướng", "có nhiều điểm tương đồng", "đáng khám phá", "phù hợp để tìm hiểu thêm".
Forbidden: "em chắc chắn phù hợp", "em sinh ra để làm nghề...", "em phải chọn...", "em không phù hợp với...", "test xác định chính xác nghề...".

## 20. Required persistence
The database MUST retain Session, Response, Result, Dimension result.

## 21. Deterministic recalculation test
Given the same assessment_version + 121 raw responses, the engine MUST always return the same output. No randomness, No LLM.

## 22. QA golden test
Create at least one fixed fixture.

## 23. Required unit tests
Required test coverage for all rules and bounds.

## 24. Implementation prohibition
Developer MUST NOT: if I > 80: career="Data Scientist", AI.generateScore() etc.

## 25. Versioning
Any change requires a new version.

## 26. Pilot requirement
V1 is a product assessment prototype with a defined measurement model, not yet a fully validated psychometric instrument.

## 27. Definition of Done
Assessment V1 is complete only when all criteria are met.
