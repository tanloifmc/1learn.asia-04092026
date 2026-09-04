# 04 — DATABASE SPECIFICATION
> Canonical database design cho tất cả domain features của 1learn.asia.
> Core platform tables đã có trong `docs/03-data-contracts.md`.
> Tài liệu này chỉ định nghĩa **domain-specific tables** (Career, Assessment, Roadmap...).
> Không được tạo migration trước khi table được định nghĩa ở đây.

---

## Naming Rules (kế thừa từ core platform)

- snake_case cho table và column
- Plural table names
- `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` cho mutable tables
- RLS bắt buộc trên mọi table
- Mọi foreign key ownership/join column phải có index

---

## Enums mới cần tạo

| Enum | Values | Purpose |
|---|---|---|
| `user_role_extended` | `student`, `parent`, `admin`, `super_admin` | Mở rộng app_role cho domain |
| `assessment_status` | `not_started`, `in_progress`, `completed`, `expired` | Trạng thái assessment session |
| `career_status` | `draft`, `needs_verification`, `verified`, `published`, `archived` | Vòng đời dữ liệu nghề |
| `major_status` | `draft`, `published`, `needs_verification`, `archived` | Vòng đời dữ liệu ngành |
| `university_status` | `draft`, `published`, `needs_verification`, `archived` | Vòng đời dữ liệu trường |
| `match_confidence` | `high`, `medium`, `low` | Độ tin cậy kết quả match |
| `roadmap_task_status` | `pending`, `in_progress`, `completed`, `skipped` | Trạng thái task lộ trình |
| `parent_link_status` | `pending`, `accepted`, `declined`, `revoked` | Trạng thái kết nối PH-HS |
| `dream_match_safe` | `dream`, `match`, `safe` | Phân loại trường đại học |
| `requirement_type` | `academic`, `skill`, `experience`, `certification`, `other` | Phân loại requirement |
| `requirement_verification_status` | `draft`, `verified`, `published`, `archived` | Trạng thái xác thực requirement |
| `roadmap_status` | `active`, `archived` | Trạng thái của Roadmap snapshot |

---

## Domain Tables

### `student_profiles`
Hồ sơ mở rộng của học sinh (extends `profiles`).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | References `profiles(id)` |
| `grade` | `smallint` | 9, 10, 11, hoặc 12 |
| `birth_year` | `smallint` | Optional |
| `gender` | `text` | Optional, không dùng cho matching |
| `region` | `text` | Tỉnh/thành phố |
| `study_location_pref` | `text` | near/far/abroad |
| `family_support_level` | `smallint` | 1-5, tự khai |
| `onboarding_step` | `smallint` | 1-4, track bước onboarding |
| `onboarding_completed_at` | `timestamptz` | Null nếu chưa xong |
| `updated_at` | `timestamptz` | Required |

RLS: Student reads/writes only own record. Admin reads all.

---

### `academic_records`
Kết quả học tập của học sinh.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `subject` | `text` | Tên môn học |
| `performance_level` | `text` | strong/average/weak |
| `gpa_range` | `text` | excellent/good/average/below_average |
| `semester` | `text` | Optional: "2024-HK1" |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Index: `student_id`
RLS: Student reads/writes own. Admin reads all.

---

### `student_interests`
Sở thích của học sinh (multi-select).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `interest_area` | `text` | Lĩnh vực quan tâm (từ danh sách chuẩn) |
| `interest_level` | `smallint` | 1-5 |
| `created_at` | `timestamptz` | |

Index: `student_id`
Unique: `student_id`, `interest_area`
RLS: Student manages own.

---

### `assessments`
Bộ đánh giá (versioned question bank).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `name` | `text` | Tên assessment |
| `version` | `text` | Semantic version: "1.0.0" |
| `description` | `text` | |
| `total_questions` | `integer` | |
| `estimated_minutes` | `integer` | |
| `is_active` | `boolean` | Chỉ 1 version active tại một thời điểm |
| `created_at` | `timestamptz` | |

---

### `assessment_questions`
Question bank.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `assessment_id` | `uuid` | References `assessments(id)` |
| `section` | `text` | personality/ability/interest/value |
| `order_index` | `integer` | Thứ tự trong section |
| `question_text` | `text` | Nội dung câu hỏi |
| `question_type` | `text` | scale/multiple_choice/ranking |
| `options` | `jsonb` | Các lựa chọn (nếu có) |
| `dimension` | `text` | Dimension đo (R/I/A/S/E/C cho RIASEC...) |
| `weight` | `numeric` | Trọng số trong scoring |
| `created_at` | `timestamptz` | |

Index: `assessment_id`, `section`

---

### `assessment_sessions`
Phiên làm assessment của học sinh.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `assessment_id` | `uuid` | References `assessments(id)` |
| `status` | `assessment_status` | |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | Null nếu chưa xong |
| `current_question_index` | `integer` | Resume support |
| `created_at` | `timestamptz` | |

Index: `student_id`, `assessment_id`
RLS: Student reads own. Admin reads all.

---

### `assessment_responses`
Câu trả lời từng câu hỏi.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `session_id` | `uuid` | References `assessment_sessions(id)` |
| `question_id` | `uuid` | References `assessment_questions(id)` |
| `response_value` | `jsonb` | Scale number / choice list / ranking order |
| `answered_at` | `timestamptz` | |

Index: `session_id`, `question_id`
Unique: `session_id`, `question_id`
RLS: Student reads own session's responses.

---

### `assessment_results`
Kết quả điểm số theo từng dimension.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `session_id` | `uuid` | References `assessment_sessions(id)` |
| `student_id` | `uuid` | References `profiles(id)` |
| `dimension` | `text` | Tên dimension (realistic, investigative...) |
| `score` | `numeric` | 0.0 – 100.0 |
| `confidence` | `match_confidence` | |
| `contributing_factors` | `jsonb` | Array of {question_id, impact} |
| `created_at` | `timestamptz` | |

Index: `student_id`, `session_id`
RLS: Student reads own. Admin reads all.

---

### `student_career_profiles`
Computed profile vector (được cập nhật sau mỗi lần complete assessment).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `profile_version` | `integer` | Tăng dần mỗi khi recalculate |
| `evidence_coverage` | `numeric` | 0.0 to 1.0. CHECK: >=0 AND <=1 |
| `profile_features` | `jsonb` | Full vector data (RIASEC, Ability, Values, Academic) |
| `source_assessment_versions` | `jsonb` | Map of assessment to version used |
| `is_current` | `boolean` | True for the latest active profile |
| `computed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Unique: `(student_id, profile_version)` and partial unique index on `student_id` where `is_current = true`

RLS: Student reads own. Admin reads all.
RLS: Student reads own. Admin reads all.

---

### `careers`
Database nghề nghiệp. Thiết kế chuẩn bị cho Career Matching Engine.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `code` | `text` | Immutable identifier (e.g., SOFTWARE_ENGINEER) |
| `name` | `text` | Tên nghề (vi) |
| `name_en` | `text` | Tên nghề (en) |
| `slug` | `text` | Unique URL slug |
| `career_domain_code` | `text` | Taxonomy chuẩn (technology, healthcare...) |
| `description` | `text` | Mô tả tổng quan |
| `daily_tasks` | `jsonb` | Array of strings |
| `work_environment` | `text` | office/remote/outdoor/lab/mixed |
| `skills` | `jsonb` | Schema: `[{ code, name, importance (0-1), type (hard/soft) }]` |
| `tools_used` | `jsonb` | Array of strings |
| `education_paths` | `jsonb` | Schema: `[{ major_code, priority, notes }]` |
| `career_paths` | `jsonb` | Schema: `{ entry, mid, senior, expert }` |
| `related_careers` | `jsonb` | Schema: `{ related: [codes], alternative: [codes], progression: [codes] }` |
| `market_data` | `jsonb` | Schema: `{ salary: { currency, min, max, period, location, experience_level, year, source }, demand: { level, year, source } }` |
| `good_fit_indicators` | `jsonb` | Array of strings |
| `possible_challenges` | `jsonb` | Array of strings |
| `work_style` | `jsonb` | Array of strings |
| `company_examples` | `jsonb` | Ví dụ minh họa, không phải realtime jobs |
| `riasec_profile` | `jsonb` | Schema: `{ R: 0.2, I: 0.9, A: 0.2, S: 0.3, E: 0.5, C: 0.6 }` (cho Matching) |
| `riasec_primary` | `char(1)` | Generated Column: auto-calculated từ `riasec_profile` (max value) |
| `ability_weights` | `jsonb` | {logical: 0.8, verbal: 0.5, ...} |
| `status` | `career_status` | draft, needs_verification, verified, published, archived |
| `source` | `text` | Nguồn dữ liệu chung |
| `source_url` | `text` | URL gốc |
| `source_type` | `text` | official, research, internal... |
| `published_at` | `timestamptz` | |
| `last_verified_at` | `timestamptz` | |
| `created_by` | `uuid` | Audit: Admin who created |
| `updated_by` | `uuid` | Audit: Admin who last updated |
| `verified_by` | `uuid` | Audit: Admin who verified |
| `published_by` | `uuid` | Audit: Admin who published |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Unique: `code`, `slug`
Index: `career_domain_code`, `status`, `riasec_primary`, `code`
RLS: Public reads published. Admin manages all.


### `career_audit_log`
Lịch sử thay đổi dữ liệu của `careers`. Bắt buộc để truy vết.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `career_id` | `uuid` | References `careers(id)` |
| `action` | `text` | create, update, verify, publish, archive |
| `from_status` | `career_status` | Trạng thái trước khi thay đổi |
| `to_status` | `career_status` | Trạng thái sau khi thay đổi |
| `changed_by` | `uuid` | References `profiles(id)` |
| `changed_at` | `timestamptz` | |
| `metadata` | `jsonb` | Chi tiết thay đổi hoặc notes |

Index: `career_id`, `changed_at`
RLS: Admin reads all. Student has no access.

---

### `match_runs`
Lịch sử các lần chạy thuật toán Matching. Đảm bảo tính minh bạch và auditability.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `profile_version` | `integer` | Version của profile snapshot |
| `algorithm_version` | `text` | VD: 'MATCH-V1.0' |
| `evidence_coverage` | `numeric` | 0.0 to 1.0. CHECK: >=0 AND <=1 |
| `overall_confidence_score` | `numeric` | 0.0 to 1.0. CHECK: >=0 AND <=1 |
| `overall_confidence_level` | `match_confidence` | Enum: high/medium/low |
| `status` | `text` | completed / insufficient_data / failed |
| `insufficient_reason` | `text` | NULL, hoặc NO_ASSESSMENT, LOW_EVIDENCE_COVERAGE... |
| `started_at` | `timestamptz` | |
| `completed_at` | `timestamptz` | |

Unique constraint: `(student_id, profile_version, algorithm_version)` để đảm bảo idempotency.
Index: `student_id`, `created_at`
RLS: Student reads own. Admin reads all.

---

### `career_matches`
Kết quả matching nghề cho mỗi học sinh theo từng Run. Không ghi đè.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `run_id` | `uuid` | References `match_runs(id)` ON DELETE CASCADE |
| `career_id` | `uuid` | References `careers(id)` |
| `rank` | `integer` | |
| `match_score` | `numeric` | 0-100 (Final Score). CHECK: >=0 AND <=100 |
| `riasec_score` | `numeric` | 0-100. CHECK: >=0 AND <=100 |
| `ability_score` | `numeric` | 0-100. CHECK: >=0 AND <=100 |
| `value_score` | `numeric` | 0-100. CHECK: >=0 AND <=100 |
| `academic_score` | `numeric` | 0-100. CHECK: >=0 AND <=100 |
| `effective_weights` | `jsonb` | Trọng số thực tế sử dụng (VD: `{ riasec: 0.72 }`) |
| `confidence_score` | `numeric` | 0-1.0. CHECK: >=0 AND <=1 |
| `confidence_level` | `match_confidence` | high/medium/low cho riêng nghề này |
| `evidence_coverage` | `numeric` | 0-1.0. Tỉ lệ evidence áp dụng. CHECK: >=0 AND <=1 |
| `factors` | `jsonb` | Structured factors for explainability |
| `gaps` | `jsonb` | Structured gaps (chỉ khi có skill data) |
| `required_skills` | `jsonb` | Structured required skills |

Unique: `(run_id, career_id)` và `(run_id, rank)`
Index: `run_id`, `rank`
RLS: Student reads own via `match_runs`. Admin reads all.

---

### `majors`
Database ngành học đại học.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `name` | `text` | Tên ngành (vi) |
| `code` | `text` | Mã ngành Bộ GD-ĐT |
| `slug` | `text` | Unique |
| `field` | `text` | Khối ngành |
| `description` | `text` | |
| `subjects_studied` | `jsonb` | Array of subject names |
| `skills_developed` | `jsonb` | Array of strings |
| `career_path_ids` | `uuid[]` | Career IDs từ `careers` table |
| `related_major_ids` | `uuid[]` | |
| `admission_methods` | `jsonb` | Array of {method, notes} |
| `typical_subjects` | `jsonb` | Tổ hợp thi thường dùng |
| `difficulty_level` | `text` | easy/medium/hard |
| `who_fits` | `text` | |
| `status` | `major_status` | |
| `source` | `text` | |
| `last_verified_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Unique: `slug`, `code`
Index: `field`, `status`

---

### `universities`
Database trường đại học.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `name` | `text` | Tên trường |
| `short_name` | `text` | Tên viết tắt |
| `slug` | `text` | Unique |
| `location_city` | `text` | |
| `location_region` | `text` | north/central/south |
| `website` | `text` | |
| `type` | `text` | public/private/international |
| `scale` | `text` | small/medium/large |
| `description` | `text` | |
| `strengths` | `jsonb` | Array of strings |
| `environment_notes` | `text` | |
| `status` | `university_status` | |
| `source` | `text` | |
| `last_verified_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Unique: `slug`
Index: `location_region`, `type`, `status`

---

### `university_majors`
Junction: trường đào tạo ngành gì.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `university_id` | `uuid` | References `universities(id)` |
| `major_id` | `uuid` | References `majors(id)` |
| `admission_methods` | `jsonb` | Phương thức tuyển sinh của trường này cho ngành này |
| `is_active` | `boolean` | Ngành có còn tuyển không |
| `created_at` | `timestamptz` | |

Unique: `university_id`, `major_id`
Index: `university_id`, `major_id`

---

### `admission_data`
Điểm chuẩn lịch sử của từng trường-ngành-năm.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `university_major_id` | `uuid` | References `university_majors(id)` |
| `year` | `smallint` | Năm tuyển sinh |
| `method` | `text` | Phương thức (THPT QG, ĐGNL, Học bạ...) |
| `score_type` | `text` | Điểm thi / GPA / combo |
| `cutoff_score` | `numeric` | Điểm chuẩn |
| `subject_combination` | `text` | Tổ hợp môn |
| `quota` | `integer` | Chỉ tiêu |
| `source` | `text` | |
| `created_at` | `timestamptz` | |

Index: `university_major_id`, `year`

---

### `student_university_matches`
Kết quả phân loại trường cho học sinh.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `university_id` | `uuid` | References `universities(id)` |
| `major_id` | `uuid` | References `majors(id)` |
| `classification` | `dream_match_safe` | |
| `match_reason` | `text` | Giải thích ngắn |
| `computed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

Index: `student_id`, `classification`

---

### `student_saved_items`
Lưu trữ các lựa chọn (nghề, ngành, trường) mà học sinh đưa vào danh sách Đang cân nhắc (Considering) từ Explore.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `item_type` | `text` | `career`, `major`, `university` |
| `item_id` | `uuid` | References corresponding table (`careers`, `majors`, `universities`) |
| `created_at` | `timestamptz` | |

Unique: `student_id, item_type, item_id` (Đảm bảo không lưu trùng)
Index: `student_id`, `item_type`
RLS: Student manages own items. Admin reads all.

---

### `target_requirements`
Lớp dữ liệu trung gian chuẩn hóa yêu cầu của các Target (Trường/Ngành).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `target_type` | `text` | 'university_major', 'career' |
| `target_id` | `uuid` | References corresponding table |
| `requirement_code` | `text` | e.g. english_level, math_score, project |
| `requirement_type` | `requirement_type` | academic, skill, experience, certification, other |
| `comparison_operator` | `text` | `>=`, `>`, `=`, `<=`, `<`, `required` |
| `requirement_value` | `text` | Giữ text để cover nhiều loại (VD: "B2", "8.0", "2") |
| `unit` | `text` | CEFR, score_10, projects, etc. |
| `importance` | `text` | critical, high, medium, low |
| `status` | `requirement_verification_status` | draft, verified, published, archived |
| `source` | `text` | Nguồn lấy dữ liệu |
| `source_url` | `text` | |
| `last_verified_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

Index: `target_id`, `target_type`, `status`

---

### `roadmaps`
Lộ trình cá nhân của học sinh. Lưu snapshot không overwrite. Đổi mục tiêu -> Archive cũ tạo mới.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `target_career_id` | `uuid` | References `careers(id)` |
| `target_major_id` | `uuid` | References `majors(id)` |
| `target_university_id` | `uuid` | References `universities(id)` |
| `target_program_id` | `uuid` | References `university_majors(id)` |
| `roadmap_version` | `integer` | |
| `generator_version` | `text` | VD: "ROADMAP-V1.0" |
| `profile_version` | `integer` | Snapshot profile |
| `academic_data_version` | `timestamptz` | Snapshot lúc tạo (dùng generated_at) |
| `status` | `roadmap_status` | active, archived |
| `generated_at` | `timestamptz` | |
| `archived_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Partial Unique Index: `(student_id)` WHERE `status = 'active'` (Đảm bảo 1 active roadmap).
RLS: Student manages own. Admin reads all.

---

### `roadmap_milestones`
Các mốc quan trọng trong lộ trình.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `roadmap_id` | `uuid` | References `roadmaps(id)` |
| `title` | `text` | |
| `description` | `text` | |
| `target_date` | `date` | Deadline của milestone |
| `priority` | `text` | critical, high, medium, low |
| `source_requirement_id` | `uuid` | References `target_requirements(id)` để giải thích "Why" |
| `status` | `roadmap_task_status` | |
| `order_index` | `integer` | |
| `completed_at` | `timestamptz` | Null = chưa xong |
| `created_at` | `timestamptz` | |

Index: `roadmap_id`

---

### `roadmap_tasks`
Các task nhỏ trong từng milestone.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `milestone_id` | `uuid` | References `roadmap_milestones(id)` |
| `title` | `text` | |
| `description` | `text` | |
| `task_type` | `text` | skill_building, exploration, foundation, admission... |
| `priority` | `text` | critical, high, medium, low |
| `due_date` | `date` | |
| `estimated_effort` | `text` | e.g. "10 hours", "1 week" |
| `status` | `roadmap_task_status` | pending, in_progress, completed, skipped |
| `source_requirement_id` | `uuid` | References `target_requirements(id)` (Traceability) |
| `depends_on` | `uuid` | References `roadmap_tasks(id)`. V1 supports single dependency |
| `evidence_required` | `boolean` | |
| `evidence_type` | `text` | none, score, certificate, url, file, self_report |
| `completion_evidence` | `text` | URL hoặc mô tả evidence khi user completed |
| `completed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

Index: `milestone_id`, `status`, `due_date`
RLS: Student update status/evidence of own tasks. Engine manages creation.

---

### `parent_link_invitations`
Quản lý các lời mời kết nối, đảm bảo bảo mật và chống brute-force. (Phase 7)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `student_id` | `uuid` | References `profiles(id)` |
| `token_hash` | `text` | UNIQUE. Lưu mã hash của token (SHA-256). Mật khẩu plaintext chỉ trả 1 lần. |
| `status` | `text` | pending, used, expired, revoked |
| `expires_at` | `timestamptz` | Expiry ngắn (ví dụ 24h) |
| `used_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |

Index: `student_id`, `token_hash`
RLS: Student manages their own invitations. Parent cannot access. 
Trigger: Ensure only 1 active invitation per student.

---

### `parent_child_links`
Kết nối phụ huynh-học sinh. Quan hệ M:N, cho phép nhiều phụ huynh liên kết với nhiều con.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `parent_id` | `uuid` | References `profiles(id)` |
| `student_id` | `uuid` | References `profiles(id)` |
| `relationship_type` | `text` | parent, guardian, other |
| `status` | `text` | accepted, revoked |
| `accepted_at` | `timestamptz` | |
| `revoked_at` | `timestamptz` | |
| `revoked_by` | `uuid` | References `profiles(id)` |
| `created_at` | `timestamptz` | |

Constraints: `UNIQUE(parent_id, student_id)`, `CHECK (parent_id <> student_id)`
Index: `parent_id`, `student_id`
RLS: Parent sees own links. Student sees own links. Neither sees other's. Parent is read-only.

---

### `parent_sharing_permissions`
Học sinh kiểm soát phụ huynh xem được gì thông qua các Permission Level (1, 2, 3).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `link_id` | `uuid` | References `parent_child_links(id)` |
| `career_profile_level` | `integer` | 1=Summary, 2=Detailed |
| `assessment_level` | `integer` | 1=Summary, 2=Detailed, 3=Private. Mặc định 1. |
| `roadmap_level` | `integer` | 1=Summary, 2=Detailed |
| `academic_level` | `integer` | 1=Summary, 2=Detailed |
| `updated_at` | `timestamptz` | |

Unique: `link_id`
RLS: Student manages own permissions only. Parent can only read if link is accepted.

**Privacy Levels Định Nghĩa Dữ Liệu:**
- **Career Profile:** 
  - L1 (Summary): strengths, career directions (semantic).
  - L2 (Detailed): dimension scores, detailed factors.
- **Assessment:**
  - L1 (Summary): interpretation, traits summary.
  - L2 (Detailed): dimension results.
  - L3 (Private): raw responses, individual answers. Parent mặc định KHÔNG được cấp L3.
- **Roadmap:**
  - L1 (Summary): overall progress, current milestone, next 3 priorities.
  - L2 (Detailed): detailed tasks and history.

---

### `permission_audit_logs`
Lưu vết mọi thay đổi về quyền riêng tư (Append-only).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `actor_id` | `uuid` | References `profiles(id)`. Người thực hiện |
| `target_link_id` | `uuid` | References `parent_child_links(id)` |
| `action` | `text` | e.g. granted_roadmap_level_2, revoked_parent, accepted_invitation |
| `created_at` | `timestamptz` | |

RLS: Student/Parent only INSERT. NO UPDATE/DELETE. (Append-only).


### `payment_transactions`
Lưu trữ giao dịch thanh toán nâng cấp tài khoản.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `user_id` | `uuid` | References `profiles(id)` |
| `amount` | `numeric` | Số tiền |
| `status` | `payment_status` | pending, completed, rejected |
| `method` | `payment_method` | bank_transfer |
| `plan_id` | `uuid` | References `membership_plans(id)` |
| `transaction_code` | `text` | UNIQUE. Mã giao dịch sinh ngẫu nhiên để so khớp (VD: 1L-XXXXXX) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

RLS: Users can insert and read own. Admin reads and updates all.

---

## Migration Order

```
01: student_profiles, academic_records, student_interests
02: assessments, assessment_questions
03: assessment_sessions, assessment_responses, assessment_results
04: student_career_profiles
05: careers (schema only, no seed in migration)
06: career_matches
07: majors, universities, university_majors, admission_data
08: student_university_matches
09: roadmaps, roadmap_milestones, roadmap_tasks
10: parent_child_links, parent_sharing_permissions
```

---

*Không tạo migration trước khi table được approve ở đây. Đây là nguồn sự thật cho DB.*
