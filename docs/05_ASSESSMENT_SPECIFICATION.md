# Assessment Engine V1 - Specification

This document defines the framework, versioning, data models, scoring rules, and quality controls for the 1learn.asia Assessment Engine.

## 1. Assessment Framework & Content Specification

### 1.1 Supported Frameworks (V1)
- **RIASEC (Holland Code)**
  - **Version**: 1.0
  - **Dimensions**: Realistic (R), Investigative (I), Artistic (A), Social (S), Enterprising (E), Conventional (C).
  - **Response Scale**: 1 to 5 (1: Rất không thích, 5: Rất thích).
  - **Reverse Items**: explicitly marked per item if applicable.

*Note: Big Five and Work Values will follow the exact same architecture but will be seeded in later phases.*

### 1.2 Content Constraints
- **NO AI-INVENTED ITEMS**: The engine MUST NOT use AI-generated items for production.
- **Demo Data**: A dummy question bank will be seeded exclusively for technical validation (unit/E2E testing). Production data will be injected via `ASSESSMENT_SPEC` approved by the Product Owner. The demo data must be marked with `environment = demo` or `status = internal_test`.

### 1.3 Assessment Administration Layer & Lifecycle
Content management lifecycle MUST support the following states (enum):
`draft -> review -> internal_test -> published -> archived`
Only `published` assessments are visible to students. The `internal_test` status is explicitly for mock data.

## 2. Data Model + Versioning

The architecture strictly separates versions so that historical results are immutable and reproducible.

### 2.1 Schema Outline

- `assessments`: Defines the test (e.g., "Holland RIASEC").
- `assessment_versions`: Versioning info (v1.0), status (draft, review, internal_test, published, archived), and `scoring_rules_version`.
- `assessment_dimensions`: The traits measured (R, I, A, etc.).
- `assessment_questions`: Linked to `assessment_versions`. Includes `question_version`, `dimension_id`, `is_reverse_scored`. *Note: V1 assumes one question -> one primary dimension. Multi-dimensional items are out of scope for V1.*
- `assessment_question_options`: For multiple choice/scale definitions.
- `assessment_sessions`: Tracks student attempts. Includes `started_at`, `completed_at`, `status` (in_progress, abandoned, completed).
- `assessment_responses`: 
  - `session_id` (uuid)
  - `question_id` (uuid)
  - `response_value` (numeric/text) - Explicit structured column.
  - `response_json` (jsonb) - Original raw payload for audit.
  - `answered_at` (timestamptz)
  - *Must handle idempotency to prevent duplicates.*
- `assessment_results`: 
  - `id`, `session_id`, `student_id`
  - `assessment_version_id`
  - `scoring_version`
  - `completion_quality` (High/Medium/Low)
  - `completed_at`, `is_current` (boolean). Protected by `UNIQUE INDEX (student_id, assessment_version_id) WHERE is_current = true`.
- `assessment_result_dimensions`:
  - `result_id`, `dimension_id`
  - `score` (0-100)
  - `confidence` (High/Medium/Low)
- `derived_profile_signals` (Replaces student_profile_features): 
  - `student_id`
  - `signal_type` (e.g., 'investigative_tendency')
  - `value` (numeric)
  - `source_type` ('assessment')
  - `source_id` (assessment_result_id)
  - `source_version` ('RIASEC v1.0')
  - `confidence` (numeric)
  - `valid_until` (timestamptz)
  - *Must have UNIQUE constraint on (source_id, signal_type) to prevent duplicates.*

## 3. Deterministic Scoring Specification

### 3.1 Principles
- **Pure Functions**: Scoring logic MUST be deterministic. `f(responses, version, rules) -> scores`.
- **Explainable**: Output must be a structured JSON object containing dimensions, quality, confidence, and warnings.
- **Immutability**: If a scoring formula changes, a new `scoring_version` is created. Old results remain untouched.

### 3.2 Scoring Output Structure
```json
{
  "assessmentVersion": "RIASEC-v1.0",
  "scoringVersion": "RIASEC-SCORING-v1.0",
  "dimensions": {
    "R": { "raw": 20, "normalized": 80, "contributingFactors": [...] },
    "I": { "raw": 22, "normalized": 88, "contributingFactors": [...] }
  },
  "completionQuality": { "rate": 1.0, "timeQuality": "normal", "missingRate": 0.0 },
  "confidence": { "level": "High", "score": 0.95 },
  "warnings": []
}
```

### 3.2 Scoring Pipeline
1. **Validation**: Check for missing answers and invalid bounds.
2. **Reverse Scoring**: `scored_value = (scale_max + scale_min) - raw_value`. Do not use `(max + 1) - value`.
3. **Aggregation**: `Raw Dimension Score = SUM(scored_value * weight)`.
4. **Normalization**: `Normalized Score = (Raw Score / Max Possible) * 100`. 
   - `Max Possible = SUM(scale_max * weight)` for all questions belonging to that dimension. It must NOT be hard-coded.
5. **Confidence & Quality Check**: 
   - `completion_quality` drops if completion time < minimum threshold.
   - `confidence` drops if variance in responses is abnormally low (e.g., straight-lining '3').
   - *Note: Confidence represents response/result quality, NOT psychological accuracy or probability.*

## 4. Testing, Security & Acceptance Criteria

### 4.1 Security (RLS & Architecture)
- **Student Privacy**: Students can ONLY read/write their own sessions and responses. 
- **Question Bank Access**: Student can ONLY read questions if:
  - They have an active session (`session.student_id = auth.uid()`).
  - `session.version_id = question.version_id`.
  - `session.status = 'in_progress'`.
  - `version.status = 'published'`.
- **Server-Side Scoring ONLY**: Client MUST NOT calculate or send scores to the server. Client ONLY writes `assessment_responses`. The server calculates and writes `assessment_results` and `derived_profile_signals`.
- **Idempotency**: Saving responses must handle network failures smoothly without creating duplicate records.
- **Public**: No unauthenticated access to any assessment session or result.

### 4.2 Automated Testing
- **Unit Tests**:
  - Normal scoring calculates accurately to 2 decimal places.
  - Reverse scoring flips values correctly.
  - Missing answers trigger fallback/error policies.
  - Boundary values process correctly.
  - Version compatibility ensures `v1.0` logic does not affect `v1.1` results.
- **Integration Tests**: 
  - `Answer -> Save -> Complete Session -> Score -> Result -> Derived Signal`.
- **Security & Concurrency Tests**:
  - Student A cannot read Session B or spoof session ID to save responses.
  - Student cannot modify Result.
  - Student cannot spoof Scoring API.
  - Double Complete request must NOT create multiple current results (Transaction test).
- **E2E Tests**: 
  - Start -> Answer 5 questions -> Close -> Reopen -> Resume -> Finish -> Result.
  - Network failure on answer -> Retry -> Ensure no duplicate response.
- **Regression Tests**: 
  - A fixed set of responses MUST always yield the exact same score.
  - Scoring Version Regression: Result v1.0 MUST NOT change when v1.1 is deployed.
