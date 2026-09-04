# Product Function Visibility Audit

This document maps all implemented backend features from Phases 1-7 to their corresponding UI representations. The goal is to ensure NO backend capability remains invisible or is represented by "fake" UI.

## Matrix of Existing Functions

| Existing Function | API / Data Source | UI Screen | UI Control | User Outcome | Status / Issue |
| ----------------- | ----------------- | --------- | ---------- | ------------ | -------------- |
| **Authentication & Profile** | Supabase Auth, `profiles` table | `/` and `/home` | Header Profile, Onboarding Form | User logs in, sets basic role/location. | Currently functional but lacks visual depth (identity representation in `/me`). |
| **Big Five & RIASEC Assessment** | `assessment_responses`, `assessment_results` | `/me/kham-pha` | Question Cards, Progress Bar | Completes test, generates traits. | Currently implemented but feels like a boring form. Needs 1-question-per-screen UX. |
| **Career Matching & Gaps** | `career_matches`, `match_explanations` | `/me/bao-cao` | Match Score Cards, Gap Visualizations | Discovers suitable careers and missing skills. | Implemented but heavily text-based. Needs Insight Cards and proper hierarchy. |
| **Major & University Fit** | `majors`, `universities`, `student_university_recommendations` | `/explore/*` | University Cards, Admission Fit Bars | Compares university choices. | "So sánh" (Compare) is currently a desktop-only table. Needs horizontal scroll/cards. |
| **Goal Setting** | `student_goals`, `goal_readiness` | `/goal` | Select Target CTA, Goal Readiness Ring | Locks in a primary goal for the roadmap. | Function exists, but Readiness is shown as plain text/basic bars instead of a decisive "Action" screen. |
| **Roadmap Generation** | `roadmaps`, `roadmap_milestones`, `roadmap_tasks` | `/journey` | Timeline, Task Checkboxes | Understands what to do next. | Functional, but lacks "Present-focused" dominance. Future milestones clutter the screen. |
| **Task Completion & Tracking** | `task_completions` | `/journey` | "Đánh dấu hoàn thành" Button | Progresses through the roadmap. | Works, but completion doesn't visibly update Home or show celebratory micro-interactions. |
| **Parent-Child Link** | `parent_child_links` | `/parent/home` | Summary Dashboard | Parent tracks student progress. | Functional but looks like a generic dashboard. Needs "Support suggestions" UX. |

## Visibility Gaps to Address
1. **Match Explanations**: We generate rich JSON explanations for *why* a career matches, but the UI just dumps it as text. It must be structured into "Điểm mạnh", "Điều cần phát triển", and "Môi trường phù hợp".
2. **Missing Evidence**: The system tracks missing data (e.g., no academic scores yet), but the UI doesn't clearly prompt the user to fill it out as an actionable insight.
3. **Task Completion**: Marking a task as complete must have a visual feedback loop that directly updates the "Current Priority" in both `/home` and `/journey`.

All of these will be addressed in the Rebuild Phase by connecting our new UI Primitives to these exact data sources.
