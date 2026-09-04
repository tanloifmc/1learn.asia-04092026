# 09 REPORT UI SPECIFICATION (PHASE 2 PREPARATION)

## 1. PRODUCT OBJECTIVE & VISUAL DIRECTION
- **Tone & Feel:** Valuable, personal, modern, visually impressive, easy for Grade 10-12, trustworthy, non-clinical.
- **Visual Design System:** Gen Z, Bento UI, pastel pink, frosted-glass/matte glass visual language. Avoid excessive pink. Use visual hierarchy (scale, spacing, typography, subtle background differences).
- **Core Principle:** "This report is about ME", not a generic personality-test result. Visual design must NEVER change the underlying data contract or business logic.

## 2. REPORT GLOBAL STRUCTURE & RESPONSIVE BEHAVIOR
### Global Structure Hierarchy
1. REPORT HEADER
2. VALIDITY / QUALITY NOTICE (when required)
3. CAREER IDENTITY HERO
4. EXECUTIVE SNAPSHOT
5. CORE SELF-DISCOVERY SECTIONS (RIASEC, Big Five, Values, Strengths, Watch-outs, Environments)
6. INSIGHT SECTIONS (Premium only - Cross-Dimension, Strength Map, Development)
7. EXPLORATION / PREMIUM VALUE (Premium: Careers, Majors, Universities, Roadmap; Free: Premium Teaser)
8. NEXT ACTION (Premium CTA for Free Report)

### Responsive Design
- **Mobile First:** Not just desktop cards stacked vertically. Cards prioritized by importance. Horizontal ranking cards for RIASEC, compact trait cards for Big Five, vertical ranking for Work Values. Touch targets optimized.
- **Tablet:** Cards collapse/reflow logically in grid.
- **Desktop:** Information density optimized for Bento layout.

## 3. FREE REPORT: "Career Discovery Snapshot"
**Purpose:** Help the student understand themselves and become naturally interested in exploring further. Must NOT expose career/major/university matches, gap analysis, or roadmaps. NO fake blurred data.

### Sections
1. **01 - CAREER IDENTITY HERO:** Emotional opening ("Tôi là kiểu người như thế nào?"). Shows Identity, short explanation, Holland Code, Primary & Secondary interest. If not available in data → `NOT_AVAILABLE` state.
2. **02 - CHÂN DUNG CỦA BẠN (RIASEC):** Hero visualization + Ranked cards. Highlights Primary, Secondary, Third, Holland Code. Insight card based strictly on Interpretation Engine.
3. **03 - CÁCH BẠN HOẠT ĐỘNG (Big Five):** Layered presentation (Shape, Prominent/Moderate/Lower, Working Style). Explains thinking, organizing, interacting, responding styles based on data. NOT MBTI.
4. **04 - ĐIỀU GÌ QUAN TRỌNG VỚI BẠN? (Work Values):** Top 3 ONLY. 3 large cards with icon, name, short explanation. No UI tie-resolving.
5. **05 - ĐIỂM MẠNH NỔI BẬT (Strengths):** 3-5 cards. Title, explanation, evidence/source dimension, practical implication. No LLM-invented strengths.
6. **06 - ĐIỀU BẠN NÊN LƯU Ý (Watch-outs):** Supportive tone, never "Điểm yếu". Shows pattern, why it matters, constructive suggestion.
7. **07 - MÔI TRƯỜNG CÓ THỂ PHÙ HỢP (Suitable Environment):** Environmental preferences (autonomy, structure, interaction, etc.) derived ONLY from existing Interpretation data.
8. **08 - EXECUTIVE SNAPSHOT:** One coherent narrative card summarizing Identity, RIASEC/Personality, Values, Strengths, Watch-outs. AI Writer allowed ONLY to express Report Data Contract.
9. **09 - PREMIUM TEASER:** Value proposition block. Promotes Career, Major, University, Roadmap. Does NOT fake results. Clean CTA to upgrade.

## 4. PREMIUM REPORT: "Personal Career Profile"
**Purpose:** Deep profile moving from understanding to decision support.

### Chapters & Sections
- **CHAPTER 1 — UNDERSTAND YOURSELF**
  - **01 - CAREER IDENTITY:** Deeper integration of identity narrative.
  - **02 - EXECUTIVE SUMMARY:** One-page summary (Identity, RIASEC, Personality, Values) + AI-written insights + exploration hints (only if engines available).
  - **03 - INTEREST PROFILE:** Full 6 RIASEC dimensions, ranking, evidence, implications. No career recommendations here.
  - **04 - PERSONALITY PROFILE:** Full Big Five (O, C, E, A, N), relative position, classification, work implication.
  - **05 - WORK VALUES:** Complete 1-6 ranking.
- **CHAPTER 2 — UNDERSTAND YOUR PATTERNS**
  - **06 - CROSS-DIMENSION INSIGHT:** WOW Section. Connects Interest + Personality + Values = Pattern. If `patterns = []`, show empty state. NO AI generation of patterns.
  - **07 - STRENGTHS MAP:** Categorized (Cognitive, Working, Interaction, Motivation) ONLY if provided by contract.
  - **08 - DEVELOPMENT AREAS:** Current tendency → Challenge → Direction. Data from Interpretation Engine.
  - **09 - SUITABLE ENVIRONMENTS:** Deep dive into specific environmental dimensions with visualizations.
- **CHAPTER 3 — EXPLORE YOUR FUTURE**
  - **10 - CAREER EXPLORATION:** Top Themes → Careers → Why matched → Concerns. Shown ONLY if Career Matching Engine is `AVAILABLE`.
  - **11 - MAJOR EXPLORATION:** Profile → Career → Major mapping.
  - **12 - UNIVERSITY EXPLORATION:** University recommendations from DB.
- **CHAPTER 4 — TURN INSIGHT INTO ACTION**
  - **13 - GOAL & ACTION PLAN:** Current state → Target → Gaps → Priorities → Milestones → Tasks. Shown ONLY if Roadmap Engine is `AVAILABLE`.

## 5. VALIDITY & COMPONENT STATES
**Global Validity States:**
- **VALID:** Normal report.
- **QUESTIONABLE:** Report shown. Warning banner stating quality signals suggest interpreting with caution.
- **INVALID:** No report. Clear action to retake assessment.
- **UNDETERMINED:** No report. "Chưa đủ dữ liệu để xác nhận kết quả." NO silent fallback.

**Component States (Mandatory for ALL components):**
Loaded, Empty, Loading, Error, Questionable, Invalid, Undetermined, Not Available, Premium Locked.

**NOT_AVAILABLE State:** Used for Sections 10-13 when engines aren't ready. Shows "COMING NEXT" message. No fake data.

## 6. DATA CONTRACT & AI WRITER COMPLIANCE
- UI must read strictly from `ReportData`. No reading raw answers or assessment internals.
- If a field is missing, DO NOT INVENT.
- AI Writer is restricted to generating `REPORT NARRATIVE` from existing `Report Data Contract`. AI cannot compute scores, ranks, or invent traits/careers.
