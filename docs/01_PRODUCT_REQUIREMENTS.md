# 01 — PRODUCT REQUIREMENTS & BUSINESS MODEL

## 1. Định vị sản phẩm (Product Positioning)

**1learn.asia** là **Life Goal Management Platform** — nền tảng Quản trị Cuộc đời.

Không phải app học tập. Không phải career test. Không phải LMS.

> Giúp học sinh THPT hiểu bản thân, xác định mục tiêu nghề nghiệp, và xây dựng lộ trình hành động rõ ràng từ hôm nay đến tương lai.

MVP tập trung vào: **mục tiêu nghề nghiệp + lộ trình học tập**.
Tương lai có thể mở rộng sang: personal development, sức khỏe, kỹ năng sống.

---

## 2. Business Model — Freemium + Feature Gating

### Free tier (luôn miễn phí, không giới hạn)
| Feature | Mô tả |
|---|---|
| Đăng ký / Đăng nhập | Full auth flow |
| Onboarding | Thu thập thông tin ban đầu |
| Assessment | Toàn bộ bộ đánh giá 4 framework |
| Báo cáo tổng quan | Top 3 career directions + overview profile |
| Career Explorer | Browse/xem nghề (cơ bản) |
| Roadmap sơ bộ | Long-term view, không có monthly/weekly detail |

### Premium Features (hiển thị NHƯNG bị blur — phải thấy để muốn mua)

| Feature Pack | Tính năng | Giá (tham khảo) |
|---|---|---|
| **Career Deep Dive** | Full 10+ career matches, detailed explanation, skill gap analysis, Career Trials | - |
| **University Navigator** | Dream/Match/Safe matching, major details, admission data | - |
| **Life Roadmap** | Monthly/weekly task planner, progress tracking, development journal | - |
| **Family Connect** | Parent Dashboard, parent-child sharing | - |
| **AI Advisor** | Chat tư vấn cá nhân hóa | - |
| **All-Access** | Tất cả features trên | Theo năm |

> Giá cụ thể sẽ được quyết định sau khi validate với người dùng thực.

### UX Rule cho Feature Gating — QUAN TRỌNG
```
Premium features PHẢI hiển thị trong giao diện.
Không được ẩn hoàn toàn.

Pattern:
- Hiển thị preview/teaser của kết quả
- Overlay blur effect trên phần chi tiết
- CTA button: "Mở khóa tính năng này"
- Khi click: Modal giải thích gói + link thanh toán

MỤC ĐÍCH: Học sinh nhìn thấy giá trị đang chờ họ → tạo desire → convert.
```

### PremiumGate Component (UI Pattern)
```tsx
<PremiumGate
  featureKey="career-deep-dive"
  previewContent={<TopCareersPreview top3={matches.slice(0,3)} />}
  lockedContent={<FullCareerReport matches={matches} />}
  upsellTitle="Xem toàn bộ 10 hướng nghề phù hợp"
  upsellDescription="Bao gồm giải thích chi tiết, khoảng cách kỹ năng, và bước tiếp theo cho từng hướng."
/>
```

---

## 3. Go-to-Market — Giai đoạn đầu

### User Acquisition Funnel
```
LANDING PAGE
    ↓ (đăng ký sớm / lead capture)
EMAIL/ZALO NURTURE
    ↓
ĐĂNG KÝ TÀI KHOẢN
    ↓
ONBOARDING (5 phút)
    ↓
ASSESSMENT (15-20 phút)
    ↓
XEM BÁO CÁO CƠ BẢN (WOW moment)
    ↓
THẤY PREMIUM FEATURES BỊ BLUR
    ↓
CONVERT TO PAID
```

### Target segments (MVP)
1. Phụ huynh có con lớp 10-11, đang lo về định hướng.
2. Học sinh lớp 10-11 chủ động tìm hiểu tương lai.

### Lead Magnet
"Khám phá sơ bộ hồ sơ hướng nghiệp" — free, không cần tài khoản, chỉ cần email.
Sau khi xem preview → mời tạo tài khoản để nhận đầy đủ.

---

## 4. Assessment Framework (Chuẩn quốc tế, xác thực khoa học)

### 4 Frameworks kết hợp (DL-009)

| Framework | Năm | Items | Dimensions | Dùng để |
|---|---|---|---|---|
| **RIASEC/Holland** | 1959 | 48 items | R,I,A,S,E,C | Career matching (PRIMARY) |
| **Big Five (NEO-PI-R abbreviated)** | 1985 | 30 items | O,C,E,A,N | Work style profile |
| **Work Values Inventory (Super)** | 1970 | 15 items | 6 values | Priority alignment |
| **Multiple Intelligence (Gardner)** | 1983 | 24 items | 8 intelligences | Learning/ability profile |

**Tổng:** ~117 items, chia thành sections, có thể dừng và tiếp tục.
**Thời gian ước tính:** 15-25 phút.

### Nguồn question bank
- [openpsychometrics.org](https://openpsychometrics.org) — public domain, đã validated
- Câu hỏi được dịch và adapt sang tiếng Việt, có review bởi expert

### Điều TUYỆT ĐỐI KHÔNG làm
- Không dùng MBTI làm tiêu chí matching (không đủ validity)
- Không dùng một framework duy nhất để kết luận
- Không để AI generate câu hỏi assessment (phải từ validated question bank)

---

## 5. Matching Algorithm — Kiến trúc 3 tầng (DL-008)

### Tầng 1: Deterministic Scoring Engine (KHÔNG có AI)
```
Input: User responses (numbers only)
         ↓
    Weighted Sum (RIASEC)
    + Big Five correlation
    + Work Values dot product
    + Gardner Intelligence score
         ↓
Output: Career Profile Vector (20+ dimensions, 0-100)
        + Holland Code (3-letter, e.g., "IAS")
        + Confidence per dimension
         ↓
    Career Matching (deterministic filter)
         ↓
Output: Ranked career list with scores

GUARANTEE: Same input → Same output. Always.
```

### Tầng 2: AI Narrative Layer (AI chỉ viết, không tính)
```
Input: Deterministic results (fixed numbers + Holland code)
       Career data from DB (fixed)
         ↓
    AI generates: Human-readable explanation of WHY
    AI does NOT generate: Scores, rankings, recommendations
         ↓
Output: "Dựa trên điểm RIASEC của bạn: R=72, I=85, S=43...
         Hướng Data Analyst phù hợp vì..."

GUARANTEE: AI explanation changes the WORDS, not the RESULT.
```

### Tầng 3: AI Advisor Chat
```
Input: Fixed deterministic results (immutable context)
       Student question
         ↓
    AI answers questions about the fixed results
    AI does NOT re-run or override the matching
         ↓
Output: Q&A responses grounded in deterministic data

GUARANTEE: AI cannot change student's career recommendations.
```

---

## 6. Data Sources — Nguồn dữ liệu (DL-010)

| Dữ liệu | Nguồn | Cách thu thập |
|---|---|---|
| Career database | O*NET (US DOL) + adapt cho VN | Download từ onetcenter.org, map RIASEC codes |
| Danh mục ngành đào tạo | Thông tư 09/2022/TT-BGDĐT + QĐ 1596/2024 của Bộ GD-ĐT | Trích xuất từ PDF, nhập thủ công |
| Trường đại học VN | Website chính thức từng trường | Admin nhập + CSV import |
| Điểm chuẩn | Các kỳ tuyển sinh ĐGNL/THPT | Admin nhập theo năm |
| Mức lương tham khảo | VietnamWorks Salary Report, ITviec | Nhập thủ công, ghi rõ nguồn + năm |

### Rules tuyệt đối
- Mọi record phải có: `source` + `source_url` + `last_verified_at` + `status`
- Chỉ publish data đã verify
- Data > 1 năm: hiện warning; > 2 năm: ẩn khỏi production

---

## 7. Landing Page Requirements (Deliverable #1)

### Nội dung bắt buộc
- Hero: Value proposition rõ ràng (không phải slogan chung chung)
- Pain points của phụ huynh + học sinh
- How it works (3-4 bước đơn giản)
- Social proof (nếu có testimonials sau)
- Lead capture form (tên + email + SĐT + lớp con)
- FAQ
- Footer: Privacy policy, contact

### Technical requirements
- Server-side rendered (Next.js App Router)
- SEO: title, meta description, OG tags đầy đủ
- Analytics tracking (UTM params, form submission events)
- Mobile-first (375px)
- Load time: LCP < 2s
- Không cần auth

### Lead data cần lưu
```sql
-- Bảng leads (public, không auth)
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  child_grade smallint, -- 9,10,11,12
  main_concern text, -- select: career/major/university/strengths/roadmap
  source text, -- utm_source
  campaign text, -- utm_campaign
  created_at timestamptz not null default now()
);
-- RLS: Admin đọc tất cả. Public insert only.
```

---

*Cập nhật khi có thay đổi về business model hoặc go-to-market strategy.*
