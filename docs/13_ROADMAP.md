# 13 — ROADMAP
> Lộ trình phát triển sản phẩm theo từng Phase. Đây là kế hoạch cấp cao nhất.
> Chi tiết task từng Phase nằm trong `06_PROJECT_BOARD.md`.

---

## Trạng thái (Status Values)

| Ký hiệu | Nghĩa |
|---|---|
| `[ ]` | Chưa bắt đầu |
| `[/]` | Đang thực hiện |
| `[x]` | Hoàn thành (đã pass DoD) |
| `[!]` | Bị chặn / cần quyết định |

---

## Phase 0 — Nền tảng Core Platform (Kế thừa Starter Kit)
> Mục tiêu: Hoàn thiện 100% core platform kế thừa từ starter kit trước khi phát triển domain features.

### Landing Page & Pre-launch (Deliverable #1)
- `[x]` Design Hero + How it works
- `[x]` Database migration: `leads` table
- `[x]` Form thu thập email + Server action
- `[x]` Tự động gửi email xác nhận với Resend
- `[x]` SEO Metadata & OpenGraph
- `[x]` Analytics cơ bản (Vercel Web Analytics)
- `[ ]` Deploy Landing Page lên Vercel production

### Infrastructure & DevOps
- `[x]` Scaffold Next.js App Router + TypeScript
- `[x]` ESLint + Prettier config
- `[x]` GitHub CI Quality Gate
- `[x]` Vercel preview deployment (66 routes)
- `[x]` **Phase 1: DB Real Data Validation (COMPLETE)**
- Hủy bỏ fallback `600s` ở code, xác nhận `600s` là metadata chuẩn từ database.
- Database thật trả về `expected_duration_seconds: 600`, chạy qua engine kết quả **VALID**.
- Đã xác thực trên bản ghi thật với 121 responses: Tất cả các flag, tín hiệu, validity rules đều chạy đúng 100%. Đã xử lý bản ghi rác/cũ (stale db) để đồng bộ với config mới.

**Phase 2: Numeric Scoring Golden Rules (COMPLETE)**
- **RIASEC**: Khi tất cả là `5`, normalized_score của R, I, A, S, E, C = `100`. (PASS)
- **Holland Code Tie-break**: Xác nhận thứ tự ưu tiên khi tất cả đều bằng nhau là `I, R, A, S, E, C`, sinh ra mã `IRA`. (PASS)
- **Big Five**: Xác nhận sinh keys có tiền tố `BF_`. Khi tất cả là `5`, chênh lệch trung bình = `0`, phân loại chính xác = `Moderate`. (PASS)
- **Work Values**: Xác nhận bảng tie-break deterministic và sinh ra top 3 chính xác. (PASS)
- Tích hợp 2 Unit Test mới trong `tests/integration/real-pipeline.test.ts` nhằm chặn đứng lỗi fallback trong tương lai. `[x]` Setup Disaster Recovery (DR) frameworks and boundaries.
- `[x]` **Phase E: E2E & Smoke Testing**
  - `[x]` Write and run comprehensive E2E tests via Playwright.
  - `[x]` Validate core user flows end-to-end.
- `[ ]` **Phase F: Pilot (10-30 users)**
- `[ ]` Vercel production deployment + custom domain
- `[ ]` Error monitoring (Sentry hoặc tương đương)
- `[ ]` Performance monitoring

### Authentication & Identity
- `[x]` Supabase Auth integration
- `[x]` Login / Logout flow (browser-verified)
- `[x]` Registration + email verification (blocked: Supabase email rate limit)
- `[x]` Password recovery
- `[x]` Session management

### Database & Security
- `[x]` 12 Supabase migrations deployed
- `[x]` RLS policies cho tất cả tables
- `[x]` Security advisor: no issues
- `[x]` 3 pending migrations cần deploy (`20260805035209`, `20260805044807`, `20260805045743`, `20260805051757`)

### Account & Profile
- `[x]` Profile CRUD (display name, phone, locale)
- `[x]` Notification preferences
- `[x]` Password change
- `[x]` Avatar upload (Storage RLS pending)
- `[x]` Session management UI

### RBAC (Roles & Permissions)
- `[x]` Roles: user, provider, editor, admin, super_admin
- `[x]` Admin cannot grant Admin/Provider
- `[x]` Super Admin grant/revoke Admin
- `[ ]` Provider workflow audit
- `[x]` Super Admin bootstrap policy

### CMS & Admin Console
- `[x]` Blog posts CRUD + publish/archive
- `[x]` Static pages
- `[x]` Categories
- `[x]` App settings (branding, navigation)
- `[x]` Audit log với pagination và filter
- `[x]` Branding/navigation runtime (pending RLS migration)

### Membership
- `[x]` Plan create/delete safeguards
- `[x]` Activation, renewal, suspension, reactivation
- `[ ]` Payment gateway integration (in consuming app)

### Notifications & Favorites
- `[x]` In-app notifications (inbox, read, bulk-read)
- `[x]` Admin broadcast
- `[x]` Favorites (save/remove/list/duplicate protection)
- `[ ]` Large-audience delivery queue

### Transactional Email
- `[x]` Resend SDK integration
- `[x]` Idempotent send helper
- `[ ]` Domain configuration + sandbox delivery verification

---

## Phase 1 — Student Profile & Onboarding
> Mục tiêu: Học sinh đăng ký và hoàn thành hồ sơ ban đầu.

### Database
- `[x]` Migration: `student_profiles` table
- `[x]` Migration: `academic_records` table
- `[x]` Migration: `student_interests` table
- `[x]` Migration: `student_goals` table
- `[x]` RLS: student sees only own profile

### Authentication (Student-specific)
- `[x]` Student registration flow (role = student)
- `[x]` Parent registration flow (role = parent)
- `[ ]` Parent-child linking
- `[ ]` Email verification flow (sau khi Phase 0 unblocked)

### Onboarding Flow (UI)
- `[x]` Step 1: Thông tin cơ bản (tên, lớp, khu vực)
- `[x]` Step 2: Môn học mạnh/yếu
- `[x]` Step 3: Sở thích ban đầu
- `[x]` Step 4: Mục tiêu sơ bộ
- `[x]` Progress indicator + skip/save-later
- `[x]` Onboarding completion tracking

### Student Dashboard (Shell)
- `[x]` Dashboard layout (mobile-first)
- `[x]` Navigation structure
- `[x]` Profile completeness indicator
- `[x]` Empty states cho tất cả sections

---

## Phase 2 — Assessment Engine - [x] COMPLETE
> Mục tiêu: Học sinh hoàn thành bộ đánh giá đa chiều và nhận Career Profile.

### Database
- `[x]` Migration: `assessments` table (versioning support)
- `[x]` Migration: `assessment_questions` table (question bank)
- `[x]` Migration: `assessment_sessions` table
- `[x]` Migration: `assessment_responses` table
- `[x]` Migration: `assessment_results` table (scores per dimension)
- `[x]` Migration: `derived_profile_signals` table (computed profile traits)

### Assessment Engine (Backend)
- `[x]` Question bank loader (từ DB, không hardcode)
- `[x]` Session management (save progress, resume)
- `[x]` **RIASEC Scoring Engine** (deterministic, pure function, unit-tested)
- `[x]` **Big Five Scoring Engine** (deterministic, pure function)
- `[x]` **Work Values Scoring Engine** (deterministic, pure function)
- `[x]` **Gardner Intelligence Scoring Engine** (deterministic, pure function)
- `[x]` Holland Code generator (top-3 RIASEC dimensions)
- `[x]` Confidence calculation per dimension
- `[x]` Profile vector computation (tổng hợp 4 frameworks)
- `[x]` Assessment versioning support
- `[x]` Assessment history (có thể retake, history preserved)
- `[x]` Unit tests & E2E Tests: chứng minh deterministic (same input = same output)

### Assessment UI
- `[x]` Assessment intro screen (giải thích mục đích, thời gian)
- `[x]` Question renderer (multiple types: scale, choice, ranking)
- `[x]` Progress bar
- `[x]` Save & resume mid-assessment
- `[x]` Results reveal screen (animated, not just list)
- `[x]` Profile breakdown visualization
- `[x]` Explanation cho từng dimension score

### Admin: Assessment Management
- `[x]` Question bank CRUD
- `[x]` Assessment version management
- `[x]` Category và weight configuration
- `[x]` Preview assessment

---

## Phase 3 — Career Database & Explorer - [x] COMPLETE
> Mục tiêu: Học sinh khám phá thế giới nghề nghiệp với dữ liệu đầy đủ, có nguồn.

### Database
- `[x]` Migration: `careers` table (full schema per Product Bible)
- `[x]` Migration: `career_skills` table
- `[x]` Migration: `career_education_paths` table
- `[x]` Migration: `career_trial_challenges` table
- `[x]` Seed data: 50+ nghề phổ biến (có nguồn + ngày verify)

### Career Explorer UI
- `[x]` Career browse/search page
- `[x]` Career detail page (đầy đủ 20+ fields)
- `[x]` "Một ngày làm việc thực tế" section
- `[x]` Skills required visualization
- `[x]` Career path progression view
- `[x]` Related careers
- `[x]` Salary range display (có ghi nguồn + năm)

### Admin: Career Data Management
- `[x]` Career CRUD với full validation
- `[x]` Status management (draft/published/needs_verification)
- `[x]` Source & last_verified_at tracking
- `[x]` Bulk import từ CSV

---

## Phase 4 — Career Matching Engine
> Mục tiêu: Từ Career Profile → Top career directions với explanation rõ ràng.

### Matching Engine (Backend)
- `[x]` Profile normalization
- `[x]` Feature score calculation per dimension
- `[x]` Career weight matrix
- `[x]` Match score algorithm (0–100)
- `[x]` Confidence score calculation
- `[x]` Explainability engine (tại sao match cao/thấp)
- `[x]` Skill gap identification
- `[x]` Alternative career suggestions
- `[x]` Recommended next actions per career

### Matching Results UI
- `[x]` Top 10 career directions
- `[x]` Match score + confidence display
- `[x]` Positive factors list
- `[x]` Skill gaps list
- `[x]` "Recommended next actions" per career
- `[x]` Compare two careers side-by-side
- `[x]` Save/favorite a career direction

---

## Phase 5 — Major & University Database
> Mục tiêu: Từ career directions → ngành học → trường đại học phù hợp.

### Database
- `[x]` Migration: `majors` table
- `[x]` Migration: `universities` table
- `[x]` Migration: `university_majors` (junction)
- `[x]` Migration: `admission_data` table (điểm chuẩn lịch sử)
- `[x]` Seed data: 200+ ngành, 50+ trường (có nguồn + ngày verify)

### Major Explorer UI
- `[x]` Major browse/search
- `[x]` Major detail (học gì, kỹ năng, nghề sau ra trường)
- `[x]` Khác biệt giữa các ngành gần nhau

### University Explorer UI
- `[x]` University browse/search (filter by region, type, major)
- `[x]` University detail (đầy đủ 15+ fields)
- `[x]` Điểm chuẩn tham khảo (ghi rõ năm nguồn)

### University Matching UI
- `[x]` Dream / Match / Safe classification
- `[x]` Matching criteria explanation
- `[x]` Disclaimer: không đảm bảo khả năng đậu

---

## Phase 6 — Personal Roadmap
> Mục tiêu: Mỗi học sinh có lộ trình cá nhân từ hôm nay đến mục tiêu.

### Database
- `[x]` Migration: `roadmaps` table
- `[x]` Migration: `roadmap_milestones` table
- `[x]` Migration: `roadmap_tasks` table
- `[x]` Migration: `task_completions` table

### Roadmap Engine (Backend)
- `[x]` Roadmap generator (dựa trên current_grade, target_career, skill_gaps)
- `[x]` Yearly plan breakdown
- `[x]` Monthly plan breakdown
- `[x]` Weekly tasks
- `[x]` Milestone tracking
- `[x]` Progress calculation

### Roadmap UI
- `[x]` Roadmap overview visualization (như timeline/gantt)
- `[x]` Current focus highlight
- `[x]` Task list per milestone
- `[x]` Checkbox hoàn thành task
- `[x]` "Thay đổi mục tiêu" (re-generate roadmap)
- `[x]` Khuyến khích hoàn thành (gamification nhẹ)

---

## Phase 7 — Parent Dashboard
> Mục tiêu: Phụ huynh theo dõi và hỗ trợ con đúng cách.

### Database
- `[x]` Migration: `parent_child_links` table
- `[x]` Migration: `parent_sharing_permissions` table (học sinh kiểm soát)

### Parent Dashboard UI
- `[x]` Child profile overview (read-only)
- `[x]` Strengths & development areas
- `[x]` Career directions con đang quan tâm
- `[x]` Roadmap view
- `[x]` Progress tracking
- `[x]` Skill gaps con đang thiếu
- `[x]` "Cách phụ huynh có thể hỗ trợ" suggestions
- `[x]` Privacy: học sinh control what parent sees

---

## Phase 8 — Career Trials ("Thử nghề")
> 🛑 TẠM DỪNG THEO YÊU CẦU CTO. (Chờ hoàn thiện UI System & IA)

### Database
- `[ ]` Migration: `trial_sessions` table
- `[ ]` Migration: `trial_responses` table
- `[ ]` Migration: `trial_evaluations` table

### Career Trials Engine
- `[ ]` Trial assignment based on career interest
- `[ ]` Response collection
- `[ ]` Behavior analysis (time spent, completion rate, approach)
- `[ ]` Feed back into Career Profile

### Career Trials UI
- `[ ]` Trial intro screen
- `[ ]` Challenge interface (per career type)
- `[ ]` Real-time feedback
- `[ ]` Post-trial reflection
- `[ ]` Trial results + impact on career match

---

## Phase 9 — AI Advisor
> 🛑 TẠM DỪNG THEO YÊU CẦU CTO. (Chờ hoàn thiện UI System & IA)

### AI Infrastructure
- `[ ]` AI provider selection & integration
- `[ ]` Prompt engineering framework
- `[ ]` Context window management (student profile + conversation)
- `[ ]` AI guardrails (no fabrication, cite sources)
- `[ ]` Rate limiting per student
- `[ ]` Conversation history storage

### AI Advisor UI
- `[ ]` Chat interface (không phải AI chatbot style)
- `[ ]` Context-aware responses
- `[ ]` Source citations
- `[ ]` Uncertainty acknowledgment
- `[ ]` Suggested questions
- `[ ]` Session history

---

## Phase 10: V2 Analytics & Data Quality (Completed)
Status: [x]
Mục tiêu: Theo dõi chính xác phễu người dùng và quản lý chất lượng nội dung.

### Analytics Infrastructure
- `[x]` Tạo bảng `analytics_events` để tracking phễu người dùng (Registration -> Onboarding -> Assessment -> Roadmap).
- `[x]` Gắn tracking events vào các hành động cốt lõi của user.
- `[x]` Cập nhật bảng Careers/Majors/Universities thêm trường `verification_status` và `last_verified_at`.

### Admin Analytics Dashboard
- `[x]` Xây dựng UI **Admin Analytics Dashboard** (xem tổng phễu).
- `[x]` Xây dựng UI **Data Quality Dashboard** (thống kê bao nhiêu nghề nghiệp/trường chưa được verify).

### Production Master Data Foundation (in progress — release blocker)

- `[x]` Schema/RLS fail-closed cho provenance và `is_production_eligible` trên chuỗi nghề → ngành → chương trình/trường.
- `[x]` Audit trail `master_data_import_runs`, database integrity probes và E2E empty-catalog state.
- `[x]` Sổ chứng cứ theo field (`master_data_evidence`), SHA-256 nguồn, trigger chống promotion thiếu evidence; đã kiểm chứng thực tế RMIT University Vietnam → Cử nhân Kinh doanh → chương trình từ trang chính thức.
- `[x]` Đối chiếu và promote 377 ngành mã 7 chữ số với Thông tư 09/2022/TT-BGDĐT: mỗi ngành có hash PDF Chính phủ và bản trích xuất đối chiếu, import audit ghi nhận 377 accepted / 0 rejected.
- `[/]` Nhập và review catalog trường/chương trình từ nguồn chính thức; đã đối chiếu và promotion 327/327 cơ sở/mã cơ sở trong danh mục Bộ GD&ĐT bằng pipeline live (exact normalized-name match, SHA-256 nguồn và verifier độc lập). Tổng 328 trường hiện đủ điều kiện vì có thêm 1 trường đã có chứng cứ độc lập trước đó. Có 3 chương trình có provenance + evidence hoàn chỉnh (RMIT Bachelor of Business; BH120 Software Engineering; BP094 Computer Science); hai chương trình Computing đã có 4 requirement học thuật chính thức (GPA lớp 12 ≥ 7.0/10.0 và Toán lớp 12 ≥ 6.0/10.0), mỗi batch có SHA-256/import audit. Catalog chương trình vẫn là release blocker.
- `[/]` Đã promotion hai chuỗi nghề→ngành có evidence độc lập: O*NET Software Developers (15-1252.00, RIASEC `IC` được lưu binary theo dimension được nguồn nêu) → Kỹ thuật phần mềm 7480103 → RMIT BH120 Software Engineering; và → Khoa học máy tính 7480101 → RMIT BP094 Computer Science. Chưa đủ coverage để mở Career Matching/Premium Report.
- `[ ]` Bổ sung và review độc lập catalog nghề → ngành → chương trình/trường đủ coverage để mở lại Career Matching/Premium Report.

---

## Phase 11 — Product Experience & UI System (ƯU TIÊN CAO)
> Mục tiêu: Tái thiết kế trải nghiệm cốt lõi theo 4 trụ cột: ME -> EXPLORE -> GOAL -> JOURNEY trước khi tiếp tục code logic.

### A. Design System
- `[x]` Xây dựng Design System (Colors, Typography, Spacing, Radius, Glassmorphism).
- `[x]` Chuẩn hóa UI components (Buttons, Cards, Charts, Forms, States).

### B. Information Architecture (IA)
- `[x]` Thiết lập navigation mới dựa trên 4 trụ cột: ME, EXPLORE, GOAL, JOURNEY.
- `[x]` Cấu trúc lại Parent Dashboard (HOME, CHILD, PATH, PROGRESS, SETTINGS).

### C. Screen Design & Prototype
- `[x]` Thiết kế Landing Page & Auth Flow.
- `[x]` Thiết kế Progressive Assessment Journey (20-25 phút, chia module, không hiển thị 121 câu).
- `[x]` Thiết kế Personal Career Report (Tập trung vào Insights & Quyết định, không chỉ là Radar Chart).
- `[x]` Thiết kế Compare Feature (Tính năng cốt lõi so sánh 3 ngành/nghề).
- `[x]` Thiết kế Goal Setting Flow (Chọn mục tiêu chính/phụ trước khi ra Roadmap).
- `[x]` Thiết kế Progress & Evaluation Loop (What did I do? What am I missing? Am I on track?).
- `[ ]` Mockup Prototype cho 1 Persona ("Minh - Lớp 10") xuyên suốt phễu.

---

## Milestone Summary

| Milestone | Phases | Target | Status |
|---|---|---|---|
| M0: Core Platform Complete | Phase 0 | - | `[/]` |
| M1: Student Can Onboard | Phase 1 | - | `[x]` |
| M2: Assessment Live | Phase 2 | - | `[x]` |
| M3: Career Explorer Live | Phase 3 | - | `[x]` |
| M4: Roadmap Engine | Phase 6 | - | `[x]` |
| M5: Parent Dashboard | Phase 7 | - | `[x]` |
| M6: **Product Experience & UI** | **Phase 11** | - | `[ ]` (NEW) |
| M7: Career Trials | Phase 8 | - | `[!]` (Paused) |
| M8: AI Advisor | Phase 9 | - | `[!]` (Paused) |
| M9: Full Platform | Phase 10 | - | `[x]` |

---

*Cập nhật mỗi khi một task được mark `[x]` hoàn thành.*
