# Visual & UI Audit Report

## 1. Overview
The current UI, while functional from a routing perspective, fails to meet the criteria of a complete, production-ready product. It relies heavily on text blocks, lacks a strong visual hierarchy, and uses an unapproved "AI Blue/Cyan" visual direction.

## 2. Global Issues
- **Visual Direction**: The current implementation uses `--primary: #4F46E5` (Indigo) and `#06B6D4` (Cyan). This is strictly rejected. The new direction must be **Warm Ivory + Deep Plum + Sage + Amber**.
- **Typography**: `Plus Jakarta Sans` is currently used. This must be replaced with `Be Vietnam Pro` to ensure native Vietnamese diacritic support.
- **Hierarchy**: Pages lack the "CURRENT STATE + MEANING + NEXT ACTION" structure. Too many elements are presented with equal visual weight.
- **"Text-Only" Syndrome**: Data like match scores and gaps are rendered as simple text paragraphs or basic lists rather than dedicated `MetricCard` or `InsightCard` components.
- **State Management**: Empty states, loading states, and error states are inconsistent or missing.

## 3. Screen-by-Screen Audit

### 3.1. Public Homepage (`/`)
- **Status**: Currently a basic hero and some text sections.
- **Issues**: Lacks the required 4-step journey visualization, problem section, trust section, and real product capability previews (like Career Explorer).

### 3.2. Student Home (`/home`)
- **Status**: Looks like a generic dashboard with KPI blocks.
- **Issues**: Fails the "This is my story today" requirement. Needs to lead with a dominant "Mục tiêu hiện tại" card and a single "Điều quan trọng nhất lúc này" (Priority) action, rather than a wall of metrics.

### 3.3. Personal Report (`/me/bao-cao`)
- **Status**: Implemented but text-heavy.
- **Issues**: Dumps JSON explanations into paragraphs. Needs to be the most important screen, broken down into 10 structured visual sections (Who are you?, Strengths, Work style, Values, Environment, Gaps, Careers, Reasons, Missing Data, Next Steps).

### 3.4. Assessment (`/me/kham-pha`)
- **Status**: Standard scrolling form.
- **Issues**: Must be a 1-question-per-screen interactive experience with clear progress, save/resume capabilities, and break screens.

### 3.5. Explore Hub (`/explore/*`)
- **Status**: Basic lists.
- **Issues**: Missing rich `CareerCard`, `MajorCard`, and `UniversityCard` components. Compare page (`/explore/so-sanh`) must support max 3 options with horizontal scrolling and a clear "Select Goal" CTA.

### 3.6. Goal & Journey (`/goal`, `/journey`)
- **Status**: Functional but visually flat.
- **Issues**: `/goal` needs to clearly show the funnel (Career -> Major -> Uni -> Readiness). `/journey` must visually dominate the *Present* (what to do today) and quiet down the *Future* (overall roadmap).

### 3.7. Parent Dashboards (`/parent/*`)
- **Status**: Reads like a student dashboard clone.
- **Issues**: Needs a calm, mature visual language focused on "Where are they?", "Where are they going?", "What are the hurdles?", and "How can I help?".

## 4. Conclusion
A complete rebuild of the Design System (tokens, typography, components) is required before rewriting individual screens. We will execute this in a phased approach, starting with the Foundation and the Core Student Flow (Home + Report).
