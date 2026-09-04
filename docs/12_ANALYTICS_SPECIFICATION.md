# 12. ANALYTICS & DATA QUALITY SPECIFICATION

## I. Architecture & Strategy
Hệ thống theo dõi sự kiện (Analytics) được xây dựng theo kiến trúc **Adapter Pattern**, đảm bảo tính bảo mật và khả năng mở rộng. Client không bao giờ ghi trực tiếp vào Database, mà phải thông qua Ingestion Endpoint trên Server.

```text
[Client Components] -> trackClientEvent() -> /api/analytics -> trackServerEvent() -> Adapter -> [Supabase]
[Server Components / Actions] -----------> trackServerEvent() -> Adapter -> [Supabase]
```

### Event Classification
1. **Behavioral Events**: Được phát từ Client (trình duyệt). Ví dụ: user click, view trang, tương tác UI. Client gọi `/api/analytics`.
2. **Business Events**: Được phát từ Server (Server Actions, Business Logic). Ví dụ: `assessment_completed`, `roadmap_generated`. Không nhận từ Client để chống gian lận.

---

## II. Event Schema Definition

Tất cả các event đều tuân theo chuẩn schema sau trong bảng `analytics_events`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Primary key, tự động sinh |
| `event_name` | string | Tên sự kiện (Strongly typed, không phải free-text) |
| `event_version` | string | Phiên bản của event payload (VD: `v1`) |
| `user_id` | uuid | Supabase Auth ID nếu đã đăng nhập |
| `anonymous_id` | string | ID ẩn danh định danh trình duyệt/thiết bị |
| `session_id` | string | ID phiên làm việc hiện tại |
| `source` | string | Nơi phát sinh event (Client / Server) |
| `platform` | string | `web`, `ios`, `android` |
| `created_at` | timestamp| Thời gian ghi nhận |
| `utm_source` / `medium` / `campaign` / `referrer` | string | Thông tin Marketing Attribution |
| `properties` | jsonb | Payload chi tiết của event. Schema phụ thuộc vào `event_name` và `event_version`. |

---

## III. Event Data Dictionary (Registry)

Dưới đây là danh sách các sự kiện hợp lệ (AnalyticsEvent) và Payload của chúng:

### 1. PAGE_VIEW (Behavioral)
- **Purpose**: Lượt truy cập các trang.
- **Trigger**: `<AnalyticsProvider>` trên Client.
- **Properties**: `path` (string), `search` (string), `title` (string).

### 2. REGISTER (Business)
- **Purpose**: Hoàn thành đăng ký tài khoản.
- **Trigger**: Server action `signupAction`.
- **Properties**: `provider` (string: email/google).

### 3. ONBOARDING_COMPLETED (Business)
- **Purpose**: Học sinh hoàn thành bước thiết lập hồ sơ ban đầu.
- **Trigger**: Server action `updateProfileAction`.
- **Properties**: `grade_level` (string), `has_interests` (boolean).

### 4. ASSESSMENT_STARTED (Business)
- **Purpose**: Bắt đầu làm bài trắc nghiệm.
- **Trigger**: Server action `startAssessmentSession`.
- **Properties**: `assessment_version` (string).

### 5. ASSESSMENT_COMPLETED (Business)
- **Purpose**: Nộp bài và nhận kết quả trắc nghiệm.
- **Trigger**: Server action `scoreAssessment`.
- **Properties**: `assessment_version` (string), `duration_seconds` (number).
- **PII Policy**: KHÔNG chứa raw answers.

### 6. CAREER_EXPLORED / MAJOR_EXPLORED / UNIVERSITY_EXPLORED (Behavioral)
- **Purpose**: Đo lường sự quan tâm đến các nhóm ngành, nghề, trường cụ thể.
- **Trigger**: Client-side khi user ở lại trang chi tiết quá 5 giây hoặc scroll.
- **Properties**: `target_id` (string), `slug` (string).

### 7. ROADMAP_GENERATED (Business)
- **Purpose**: Hoàn thành việc tạo lộ trình (cũng bao gồm việc đã có mục tiêu).
- **Trigger**: Server action `generateRoadmapAction`.
- **Properties**: `target_type` (string), `target_id` (string), `roadmap_id` (string).

### 8. FIRST_TASK_COMPLETED (Business)
- **Purpose**: Học sinh check hoàn thành task đầu tiên trong lộ trình.
- **Trigger**: Server action `completeTask`.
- **Properties**: `roadmap_id` (string), `task_id` (string).

---

## IV. North Star Metric & Funnel

**North Star Candidate (NSM):**
Tỷ lệ phần trăm (%) học sinh thoả mãn TẤT CẢ các điều kiện sau:
`assessment_completed` + `career/major_explored` + `roadmap_generated` + `first_task_completed`.

> Ý nghĩa: "Ứng dụng thực sự giúp học sinh chuyển từ bối rối sang hành động."

**Product Funnel (V1):**
`REGISTER` → `ONBOARDING_COMPLETED` → `ASSESSMENT_COMPLETED` → `CAREER_EXPLORED` → `ROADMAP_GENERATED` → `FIRST_TASK_COMPLETED`.

---

## V. Privacy & Data Retention Policy

### Privacy Policy
- **NO PII**: Tuyệt đối không ghi nhận Tên, Số điện thoại, Email, hay Raw Assessment Answers vào bảng `analytics_events`.
- Dữ liệu `properties` phải là tập hợp các chỉ số metadata (ID, version, duration, counts, flags).

### Data Retention
- **Raw Events**: Bảng `analytics_events` lưu trữ trong 90 ngày. Dữ liệu quá 90 ngày sẽ được cron-job xoá.
- **Aggregated Metrics**: Số liệu tổng hợp (Daily Active Users, Completion Rates, Funnel Counts) sẽ được lưu trữ trong bảng `analytics_aggregations` dài hạn.

---

## VI. Data Quality (Data Freshness Policy)

Dữ liệu (Careers, Majors, Universities) có 3 trạng thái độc lập:
1. **Editorial Status**: `draft`, `published`, `archived`. (Quyết định có show ra UI không).
2. **Verification Status**: `unverified`, `verified`, `needs_review`. (Workflow của Admin).
3. **Freshness Status**: Tính toán on-the-fly dựa trên `last_verified_at` và Policy:
   - **Careers** (Mô tả, Kỹ năng): 365 ngày.
   - **Universities** (Thông tin tuyển sinh, học phí): 180 ngày.
   - Quá hạn sẽ bị tính là `stale`. Dashboard Data Quality sẽ gọi ra action `Fix`.
