# 02 — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
> **Tài liệu quan trọng nhất để AI agent code.** Mọi feature phải có đủ thông tin trong tài liệu này trước khi bắt đầu code.
> Không có spec = không code.

---

## 1. Scope

Tài liệu này định nghĩa toàn bộ các yêu cầu chức năng và phi chức năng cho nền tảng **1learn.asia** — Career Decision & Development Platform dành cho học sinh THPT Việt Nam và phụ huynh.

---

## 2. Actors (Người dùng hệ thống)

| Actor | Role DB | Mô tả |
|---|---|---|
| Student | `student` | Học sinh lớp 9–12, người dùng chính |
| Parent | `parent` | Phụ huynh, theo dõi và hỗ trợ con |
| Admin | `admin` | Quản trị viên, quản lý nội dung và người dùng |
| Super Admin | `super_admin` | Quyền cao nhất, quản lý hệ thống |
| System | — | Các tác vụ tự động (scheduled jobs, AI calls) |

---

## 3. User Journeys

### Journey A: Học sinh lần đầu sử dụng
```
Đăng ký tài khoản
    ↓
Xác nhận email
    ↓
Onboarding (thông tin cơ bản + lớp + khu vực)
    ↓
Làm Assessment (multi-step, có thể dừng và tiếp tục)
    ↓
Nhận Career Profile (điểm số + giải thích)
    ↓
Xem Top Career Directions (có explanation)
    ↓
Khám phá chi tiết từng nghề
    ↓
Thử nghề (Career Trial)
    ↓
Xem Ngành học phù hợp
    ↓
Xem Trường đại học phù hợp (Dream/Match/Safe)
    ↓
Tạo Personal Roadmap
    ↓
Theo dõi tiến độ hàng tuần
```

### Journey B: Phụ huynh
```
Đăng ký tài khoản phụ huynh
    ↓
Kết nối với tài khoản con (invite link / code)
    ↓
Con chấp nhận kết nối + chọn thông tin chia sẻ
    ↓
Xem Dashboard: hồ sơ + điểm mạnh + hướng nghề con quan tâm
    ↓
Xem Roadmap của con
    ↓
Đọc "Cách hỗ trợ con hiệu quả"
```

### Journey C: Admin quản lý dữ liệu
```
Đăng nhập Admin
    ↓
Quản lý Career database (thêm/sửa/xóa nghề)
    ↓
Quản lý Major database
    ↓
Quản lý University database
    ↓
Quản lý Assessment questions
    ↓
Xem Analytics dashboard
    ↓
Xem Data quality alerts
```

---

## 4. Functional Requirements

### FR-01: Authentication & Identity

#### FR-01-1: Student Registration
```
Feature:    Đăng ký tài khoản học sinh
Actor:      Anonymous visitor
Input:      email, password, full_name, grade (9-12), region
Process:    - Validate email format
            - Validate password strength (min 8 chars, 1 uppercase, 1 number)
            - Check email uniqueness
            - Create auth.users record
            - Create profiles record (role = student)
            - Send verification email via Resend
Output:     Success message + redirect to "check email" page
Error:      Email taken → error message; Invalid format → inline validation
Permission: Public (no auth required)
DoD:        Registration completes, email sent, DB records created
```

#### FR-01-2: Parent Registration
```
Feature:    Đăng ký tài khoản phụ huynh
Actor:      Anonymous visitor
Input:      email, password, full_name
Process:    - Same as student registration
            - role = parent
            - No grade/region required
Output:     Success + redirect to "link child" flow
Permission: Public
DoD:        Registration completes, email sent, DB records created
```

#### FR-01-3: Parent-Child Linking
```
Feature:    Kết nối phụ huynh với học sinh
Actor:      Parent (authenticated), Student (authenticated)
Input:      Parent sends invite (email or 6-digit code)
            Student receives and accepts/declines
Process:    - Parent generates invite token (expires 48h)
            - Student receives email with accept link
            - Student can preview what parent will see before accepting
            - Student accepts → parent_child_links record created
            - Student can revoke at any time
Output:     Parent sees child profile (per sharing permissions)
Permission: Parent generates invite; Student accepts/declines/revokes
Privacy:    Student controls all sharing permissions
DoD:        Link established, permissions respected, revocation works
```

---

### FR-02: Student Profile & Onboarding

#### FR-02-1: Initial Onboarding
```
Feature:    Thu thập thông tin ban đầu của học sinh
Actor:      Student (authenticated, newly registered)
Steps:
  Step 1: Thông tin cơ bản
    Input:  full_name (confirm), grade (9/10/11/12), gender (optional), birth_year (optional)
  Step 2: Học tập
    Input:  strong_subjects (multi-select), weak_subjects (multi-select), gpa_range
  Step 3: Sở thích sơ bộ
    Input:  interest_areas (multi-select từ danh sách 20 lĩnh vực)
  Step 4: Hoàn cảnh
    Input:  study_location_preference (near/far/abroad), family_support_level (1-5)
Process:    - Save each step independently (no all-or-nothing)
            - Allow skip + return later
            - Calculate onboarding_completion_pct
Output:     Student profile partially filled; prompt to start Assessment
Permission: Student only, own profile
DoD:        All 4 steps save correctly, profile_completion updates, can resume
```

---

### FR-03: Assessment Engine

#### FR-03-1: Take Assessment
```
Feature:    Học sinh làm bộ đánh giá đa chiều
Actor:      Student (authenticated, onboarding complete)
Precond:    Has not started OR has incomplete assessment session
Input:      User responses to questions (scale 1-5, multi-choice, ranking)
Process:
  - Load questions from DB (version-controlled)
  - Present in sections (Personality → Abilities → Interests → Values)
  - Save each response immediately (no data loss on browser close)
  - Track session progress
  - On completion: run scoring engine
  - Calculate dimension scores (RIASEC, Big5, Work Values, Abilities)
  - Calculate confidence per dimension
  - Store assessment_results
  - Update student_career_profiles (computed vector)
Output:
  - Completion screen with teaser
  - Full Career Profile reveal (see FR-03-2)
Error:      Network error → auto-save, can resume; Invalid response → inline validation
Permission: Student only, own assessment
DoD:        Session saves, scoring runs, profile updated, history preserved
```

#### FR-03-2: Career Profile Reveal
```
Feature:    Hiển thị kết quả hồ sơ hướng nghiệp
Actor:      Student (completed assessment)
Output:
  - Personality dimensions (visual breakdown)
  - Top ability areas
  - Interest clusters
  - Work value priorities
  - Narrative summary (AI-generated, from profile data)
  - "What this means for you" section
  - CTA: "See your career matches"
Explainability: Every score must show contributing factors
Permission: Student only
DoD:        All dimensions shown, narrative accurate, CTA works
```

---

### FR-04: Career Matching

#### FR-04-1: Career Match Generation
```
Feature:    Tạo danh sách nghề phù hợp từ Career Profile
Actor:      System (triggered on assessment completion or profile update)
Input:      student_career_profiles record
Process:
  - Normalize profile vector
  - Score each career in DB against profile
  - Calculate match_score (0-100)
  - Calculate confidence (high/medium/low)
  - Identify positive_factors (why it matches)
  - Identify skill_gaps (what's missing)
  - Generate next_actions (specific, actionable)
  - Rank top 10
  - Store in career_matches table
Output:
  {
    career_id: uuid,
    match_score: integer (0-100),
    confidence: enum (high/medium/low),
    positive_factors: string[],
    skill_gaps: string[],
    recommended_actions: string[],
    alternative_careers: uuid[]
  }
Constraint: NEVER return a single definitive career; always return ranked list with explanations
Permission: System writes; Student reads own
DoD:        Top 10 generated, all fields populated, explainability present
```

#### FR-04-2: Career Match Display
```
Feature:    Hiển thị kết quả nghề phù hợp
Actor:      Student
Output:
  - Top 10 career directions card list
  - Each card: career name, match %, confidence badge, top 3 reasons
  - Click → Career detail + full match explanation
  - Side-by-side comparison (max 2 careers)
  - Favorite/save a career direction
  - "Why this might not be for you" section (transparency)
Permission: Student reads own matches
DoD:        All cards shown, comparison works, favorite saves
```

---

### FR-05: Career Explorer

#### FR-05-1: Career Browse
```
Feature:    Khám phá danh sách nghề nghiệp
Actor:      Student (any), Public (limited view)
Input:      search query, filters (field/industry, skill type, work environment)
Output:     Career cards grid (name, field, brief description)
Permission: Public can browse; Student gets match overlay
DoD:        Search works, filters work, pagination works
```

#### FR-05-2: Career Detail
```
Feature:    Trang chi tiết của một nghề
Actor:      Student (authenticated preferred)
Output:
  Section 1: What is this career?
  Section 2: A day in the life (realistic daily tasks)
  Section 3: Work environment (office/remote/outdoor/etc.)
  Section 4: Required skills (hard + soft)
  Section 5: Tools & technology commonly used
  Section 6: Career progression path (entry → mid → senior)
  Section 7: Education paths (ngành học nào dẫn đến đây)
  Section 8: Salary range (with source + year)
  Section 9: Market demand
  Section 10: Who fits / Who should reconsider
  Section 11: Common misconceptions
  Section 12: Companies that hire
  Footer: Source + last_verified_at + data status
Constraint: If last_verified_at > 1 year → show staleness warning
Permission: Public (basic); Student (full + match score overlay)
DoD:        All sections populated for published careers, source visible
```

---

### FR-06: Major & University

#### FR-06-1: Major Detail
```
Feature:    Trang chi tiết một ngành học
Output:
  - Ngành học gì?
  - Học những môn gì?
  - Khác gì với ngành tương tự?
  - Sau khi ra trường làm nghề gì?
  - Kỹ năng hình thành
  - Ai phù hợp / ai nên cân nhắc
  - Trường đào tạo ngành này
  - Phương thức tuyển sinh
  - Source + last_verified_at
Permission: Public
DoD:        All sections populated, source visible, related careers linked
```

#### FR-06-2: University Matching
```
Feature:    Phân loại trường phù hợp
Actor:      Student (has target career/major)
Input:      target_major, student academic profile, location preference, budget
Output:
  Dream:   1-3 trường (mục tiêu cao, cần cố gắng)
  Match:   2-4 trường (phù hợp với hồ sơ hiện tại)
  Safe:    2-3 trường (khả năng cao hơn)
  Each:    Reasoning + điểm chuẩn tham khảo (ghi rõ năm)
Constraint: "Tham khảo, không đảm bảo" disclaimer bắt buộc
Permission: Student only
DoD:        Classification works, disclaimer present, data sourced
```

---

### FR-07: Personal Roadmap

#### FR-07-1: Roadmap Generation
```
Feature:    Tạo lộ trình cá nhân
Actor:      Student (has career direction + target major/university)
Input:      current_grade, target_career, target_major, target_university, skill_gaps
Process:
  - Calculate remaining semesters/months
  - Generate yearly milestones
  - Generate monthly plans
  - Generate weekly task templates
  - Identify critical path (most important items first)
Output:
  Roadmap with:
  - Long-term view (until after THPT)
  - Year-by-year breakdown
  - Month-by-month plan for current year
  - This week's tasks
Permission: Student only, own roadmap
DoD:        Roadmap generated, tasks have due dates, milestone tracking works
```

---

### FR-08: Parent Dashboard

#### FR-08-1: Child Overview
```
Feature:    Phụ huynh xem tổng quan về con
Actor:      Parent (authenticated, linked to child)
Output:
  - Child name + grade + last active
  - Strengths summary (top 3)
  - Areas for development
  - Career directions child is exploring
  - Roadmap progress (%)
  - Recent activity
  - "How you can support" suggestions
Privacy:    Only shows info child has permitted
Permission: Parent reads only; cannot modify child data
DoD:        Correct data shown, privacy respected, read-only enforced
```

---

### FR-09: AI Advisor

#### FR-09-1: AI Advisor Chat
```
Feature:    Tư vấn AI cá nhân hóa
Actor:      Student (authenticated)
Context provided to AI:
  - student_career_profile
  - assessment_results
  - career_matches (top 10)
  - current roadmap
  - conversation_history (last 10 turns)
AI behavior:
  - MUST explain reasoning
  - MUST cite sources for factual claims
  - MUST express uncertainty when unsure
  - MUST NOT fabricate university data, scores, salaries
  - MUST NOT make definitive career predictions
  - MUST ask clarifying questions when profile is incomplete
Max retries: 3 per conversation turn before escalating
Permission: Student only, own conversation
DoD:        Chat works, guardrails enforced, history saved
```

---

## 5. Non-Functional Requirements

### NFR-01: Performance
- Page load (LCP): < 2.5s on 4G mobile
- API response: < 500ms for 95th percentile
- Assessment submission: < 1s
- Career matching computation: < 3s (async if needed)
- Database queries: no query > 100ms without index justification

### NFR-02: Scale
- Target: 10,000 concurrent users initial
- Design for: 100,000 users without re-architecture
- All tables must have proper indexes from day 1
- Supabase connection pooling configured

### NFR-03: Security
- All routes require authentication unless explicitly public
- RLS on every table in public schema
- No user-editable metadata for authorization
- No secrets in client-side code
- Input validation on both client and server
- Rate limiting on all mutation endpoints

### NFR-04: Privacy
- Student is data subject and controller of own data
- Parent can only see what student permits
- No selling or sharing of student data
- GDPR-compatible data retention policy
- Right to delete account and all data

### NFR-05: Accessibility
- WCAG 2.1 AA minimum
- Mobile-first (target: 80%+ mobile users)
- Support for low-bandwidth connections
- No content locked behind JavaScript for static pages

### NFR-06: Data Integrity
- All factual data (salary, university info) must have source + last_verified_at
- Status field on all factual entities: published / needs_verification / draft
- No AI-generated factual claims without source
- Data older than 1 year triggers staleness warning

---

## 6. Business Rules

| Rule ID | Rule | Enforcement |
|---|---|---|
| BR-01 | AI MUST NOT make definitive career predictions | AI guardrails + prompt |
| BR-02 | University data MUST have source + last_verified_at | DB constraint + UI |
| BR-03 | Parent CANNOT modify student data | RLS policy |
| BR-04 | Student controls parent sharing permissions | DB + API |
| BR-05 | Matching MUST provide explanation, not just score | API output validation |
| BR-06 | Assessment can be retaken; history preserved | DB design |
| BR-07 | No career recommendation without confidence score | API output validation |
| BR-08 | Unverified data shows warning to user | UI rule |
| BR-09 | Max 3 retry attempts before human escalation | System rule |
| BR-10 | Student data deletion must cascade completely | DB + API |

---

*Tài liệu này phải được cập nhật trước khi bắt đầu code một feature mới.*
*Chỉ được code khi feature có đủ: Feature + Actor + Precond + Input + Process + Output + Error + Permission + DoD.*
