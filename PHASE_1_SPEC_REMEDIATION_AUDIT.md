# PHASE 1 SPEC REMEDIATION AUDIT

## A. VALIDITY

### 1. Current behavior
1. **Assessment Response -> Scoring**: `calculateScoringV1` in `scoring.ts` calculates:
   - `attention_failures` (count based on `expected_answers`).
   - `straightline_suspected` (boolean, if max streak >= threshold).
   - `total_duration_seconds` (number, if timestamps exist).
2. **Confidence Level**: `is_usable` is determined merely by `attention_failures <= max_attention_failures_allowed`. `confidence.level` is hardcoded as: `is_usable === null ? 'Undetermined' : (is_usable ? 'High' : 'Low')`. It never returns `'Medium'`.
3. **Profile Builder**: `profile-builder.ts` maps `confidence.level === 'High' ? 'high' : 'medium'` and stores it in `profileFeatures.meta.validity`. It discards 'Low' and 'Undetermined'.
4. **Report Data**: Currently receives either 'high' or 'medium'.

### 2. Spec 08 requirement
Spec 08 requires 4 states: `VALID`, `QUESTIONABLE`, `INVALID`, `UNDETERMINED`.
Rules:
- Missing metadata -> `UNDETERMINED`
- 0 attention failures + no serious flag -> `VALID`
- 1 attention failure -> `QUESTIONABLE`
- >=2 attention failures -> `INVALID`
- Speeding >= 20% and < 40% -> `QUESTIONABLE`
- Speeding >= 40% -> `INVALID`
- 1 straightline block -> `QUESTIONABLE`
- >=2 straightline blocks -> `INVALID`

### 3. Exact mismatch
- The engine computes a binary `is_usable` flag rather than the 4 granular states.
- `profile-builder.ts` further corrupts this by mapping the already limited output to just `high/medium`.
- Speeding percentage is not calculated.
- Straightline blocks are not counted (only a boolean flag for longest streak is kept).

### 4. Data currently available
- `attention_failures` (number)
- `straightline_suspected` (boolean)
- `total_duration_seconds` (number | null)

### 5. Data missing
- **Expected Duration**: Needed to compute speeding percentage (20%, 40% rules).
- **Straightline Block Count**: The engine tracks `max_streak` but not the *number of separate blocks* of straightlining.

### 6. Required remediation
**SPEC/ENGINE GAP — VALIDITY DATA COLLECTION REQUIRED**
We cannot fully implement Spec 08 without calculating Speeding % (requires expected duration config) and counting straightline blocks. A PO decision is required on whether to adapt Spec 08 to the existing data (`attention_failures` and `straightline_suspected`), or to upgrade `scoring.ts` to collect these missing metrics.

---

## B. BIG FIVE

### 1. Current behavior
- `profileFeatures.personality.scores` contains the normalized scores (0-100 scale) for O, C, E, A, N.
- `interpretProfile` in `interpretation-engine.ts` uses `processFramework('big_five')`, which applies `PROVISIONAL_BANDS` (70 / 40) directly to these absolute scores.
- This outputs `'high' | 'medium' | 'low'`, which is then used to fetch insights from `INTERPRETATION_DICT`.

### 2. Spec 07 requirement
```
M = mean(O,C,E,A,N)
D = score - M
D >= +10 → PROMINENT
D <= -10 → LOWER
otherwise → MODERATE
```

### 3. Exact mismatch
The engine uses absolute static thresholds (70/40) for Big Five, treating it the same as RIASEC. It completely ignores the relative calculation (Mean and Delta) specified in Spec 07.

### 4. Data currently available
- O, C, E, A, N normalized scores (0-100) are fully available in `profileFeatures.personality.scores`.
- Therefore, `Mean` and `D` can be perfectly calculated at the interpretation layer.

### 5. Required remediation
Modify `interpretation-engine.ts` to process `big_five` uniquely:
1. Calculate `M = (O + C + E + A + N) / 5`.
2. For each trait, calculate `D = score - M`.
3. Map `D >= 10` to `'high'` (to match dictionary keys, or rename dictionary keys to `prominent`), `D <= -10` to `'low'` (lower), and else `'medium'` (moderate).
4. Update `INTERPRETATION_DICT['big_five']` keys from `high/medium/low` to `prominent/moderate/lower` (or keep keys as is but change the internal mapping logic) so the rules map correctly.

---

## C. IMPACT
- **`scoring.ts`**: Needs an update if the PO wants to strictly enforce Spec 08 (adding Expected Duration and Straightline Blocks).
- **`profile-builder.ts`**: Needs an update to pass through the full `QualityFlags` or the 4 exact validity states, instead of overwriting with `high/medium`.
- **`interpretation-engine.ts`**: Needs to inject the relative scoring logic (`M` and `D`) specifically for Big Five.
- **`report-builder.ts`**: Currently blocked from writing a deterministic adapter because it receives corrupted validity data and incorrectly interpreted Big Five data.
- **`ReportData`**: Structure is correct and unaffected.

---

## D. MINIMAL REMEDIATION PLAN

1. **Validity (Requires PO Decision)**:
   - *Option A (Upgrade Scoring)*: Add `expected_duration_seconds` to `AssessmentScoringConfig`. Update `calculateScoringV1` to output exactly `VALID | QUESTIONABLE | INVALID | UNDETERMINED` based on Spec 08. Update `profile-builder.ts` to pass this enum directly to `profileFeatures.meta.validity`.
   - *Option B (Graceful Degradation)*: Map existing data in `scoring.ts`: `attention_failures >= 2 -> INVALID`, `attention_failures == 1 -> QUESTIONABLE`, `straightline_suspected -> QUESTIONABLE`. Pass this through `profile-builder.ts`.
2. **Big Five**:
   - In `interpretation-engine.ts`, intercept `frameworkCode === 'big_five'`.
   - Compute `M`.
   - Compute `D` for each trait.
   - Classify as `prominent` (>= 10), `lower` (<= -10), or `moderate`.
   - Update `INTERPRETATION_DICT` levels for `big_five` to `prominent`, `moderate`, `lower`.

---

## E. TEST PLAN

### Validity
1. **VALID**: 0 attention failures, no straightlining -> Report passes.
2. **QUESTIONABLE**: 1 attention failure -> Report renders with warning.
3. **INVALID**: 2 attention failures -> Report blocked.
4. **UNDETERMINED**: Missing timestamps / metadata -> Report blocked.

### Big Five
1. **All traits near Mean**: Scores (50, 52, 48, 51, 49) -> Mean = 50. All D within [-2, +2] -> All classified as `MODERATE`.
2. **One PROMINENT**: Scores (70, 50, 50, 50, 50) -> Mean = 54. O = 70 (D = +16) -> `PROMINENT`.
3. **One LOWER**: Scores (30, 55, 55, 55, 55) -> Mean = 50. O = 30 (D = -20) -> `LOWER`.
4. **Both PROMINENT and LOWER**: Scores (80, 20, 50, 50, 50) -> Mean = 50. O = +30 (`PROMINENT`), C = -30 (`LOWER`).
5. **Exact +10 Boundary**: Scores (60, 47.5, 47.5, 47.5, 47.5) -> Mean = 50. O = 60 (D = +10) -> `PROMINENT`.
6. **Exact -10 Boundary**: Scores (40, 52.5, 52.5, 52.5, 52.5) -> Mean = 50. O = 40 (D = -10) -> `LOWER`.

---

**PHASE 1 REMEDIATION AUDIT COMPLETE — AWAITING PO APPROVAL**
