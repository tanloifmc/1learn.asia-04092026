# 1LEARN.ASIA — REPORT UI/UX BLUEPRINT

## Career Discovery Snapshot & Personal Career Profile

### PO Draft — Pre-Phase 2

---

# I. MỤC TIÊU SẢN PHẨM

Report không được có cảm giác như một bảng kết quả psychometric test.

Report phải tạo ra trải nghiệm:

> **“Ồ, hóa ra mình có một kiểu tư duy, cách làm việc và những điều mình coi trọng như thế này.”**

Sau đó dẫn tự nhiên tới:

> **“Vậy những đặc điểm này phù hợp với nghề nào, ngành nào và mình cần chuẩn bị gì?”**

Do đó:

**FREE = Self Discovery**

**PREMIUM = Career Decision Support**

Không được dùng Premium như một bản Free bị khóa/blur một cách cơ học.

---

# II. INFORMATION ARCHITECTURE

## A. FREE REPORT

### Career Discovery Snapshot

Free report gồm 8 nội dung chính:

1. Career Identity
2. RIASEC Profile
3. Working Style — Big Five
4. Top 3 Work Values
5. Strengths
6. Watch-outs
7. Suitable Environment
8. Executive Snapshot
9. Premium Exploration Teaser

Thứ tự trải nghiệm:

```text
HERO
 ↓
WHO AM I?
 ↓
HOW DO I WORK?
 ↓
WHAT MATTERS TO ME?
 ↓
WHAT AM I GOOD AT?
 ↓
WHAT SHOULD I WATCH?
 ↓
WHAT ENVIRONMENT FITS?
 ↓
SO WHAT?
 ↓
WHAT CAN I EXPLORE NEXT?

```

---

# III. FREE REPORT — UI SPEC

## SECTION 01 — HERO / CAREER IDENTITY

### Mục tiêu

Tạo “wow moment” ngay khi học sinh mở báo cáo.

### Layout

Desktop:

```text
┌──────────────────────────────────────────────┐
│                                              │
│        HỒ SƠ KHÁM PHÁ BẢN THÂN              │
│                                              │
│        BẠN LÀ NGƯỜI                          │
│        KHÁM PHÁ HỆ THỐNG                    │
│                                              │
│        IRC                                   │
│        Investigative · Realistic ·           │
│        Conventional                          │
│                                              │
│        Một câu mô tả ngắn                    │
│                                              │
└──────────────────────────────────────────────┘

```

### Thành phần

- Career Identity label
- Identity title
- Holland Code
- Primary type
- Secondary type
- One deterministic explanation
- Visual identity/motif

### Không được

- AI tự đặt identity mới.
- AI tự chẩn đoán.
- Identity không có trong Interpretation Data → không được tự tạo.

---

# SECTION 02 — CHÂN DUNG RIASEC

### Mục tiêu

Học sinh hiểu “mình bị thu hút bởi kiểu hoạt động nào”.

### UI

Không chỉ hiển thị một biểu đồ radar.

Dùng:

**Hero visualization + ranked cards**

```text
RIASEC

01  I  Investigative       ████████████
02  R  Realistic           ██████████
03  C  Conventional        █████████
04  A  Artistic             ███████
05  S  Social               ██████
06  E  Enterprising         █████

```

### Highlight

- Primary
- Secondary
- Third
- Holland Code

### Insight card

Ví dụ cấu trúc:

> **Điều nổi bật trong hồ sơ của bạn**
>
> Bạn có xu hướng nổi bật hơn ở những hoạt động liên quan đến...

Nội dung thực tế phải lấy từ Interpretation Engine.

### Không được

Không viết:

> “Bạn chắc chắn phù hợp với ngành X.”

Free chỉ nói về **self profile**, chưa kết luận nghề/ngành.

---

# SECTION 03 — CÁCH BẠN HOẠT ĐỘNG

## Big Five Working Style

Đây là section cần tạo cảm giác khác biệt so với các bài test phổ thông.

Không trình bày đơn thuần:

```text
O = 82
C = 74
E = 61
...

```

Thay vào đó:

### Layer 1 — Personality Shape

Hiển thị 5 dimensions.

### Layer 2 — Prominent / Moderate / Lower

Theo đúng Interpretation Rules đã LOCK.

### Layer 3 — Working Style

Chuyển kết quả thành các nhóm dễ hiểu:

- Cách tư duy
- Cách tổ chức công việc
- Cách tương tác
- Cách phản ứng với môi trường

**Nhưng nội dung phải được cung cấp bởi Interpretation Engine.**

UI không tự suy luận.

---

# SECTION 04 — ĐIỀU GÌ QUAN TRỌNG VỚI BẠN?

## Top 3 Work Values

### UI

Ba card lớn:

```text
01
ACHIEVEMENT

02
INDEPENDENCE

03
RELATIONSHIPS

```

Mỗi card:

- Icon
- Tên value
- Short explanation
- “Điều này có thể có ý nghĩa với bạn...”

### Free

Chỉ Top 3.

### Premium

Toàn bộ ranking.

### Tie

UI tuyệt đối không tự resolve tie.

Engine đã resolve theo locked deterministic rule.

---

# SECTION 05 — ĐIỂM MẠNH NỔI BẬT

Không dùng từ:

> “Bạn giỏi X.”

nếu dữ liệu chỉ cho phép suy luận về tendency.

Nên dùng ngôn ngữ:

> “Một điểm nổi bật trong hồ sơ của bạn là...”

### Layout

3–5 Strength Cards.

Mỗi card:

```text
[ICON]

TÊN ĐIỂM MẠNH

Mô tả ngắn

WHY IT APPEARS
Nguồn dữ liệu / insight liên quan

```

### Data source

Interpretation Engine.

Không phải AI tự phát hiện.

---

# SECTION 06 — ĐIỀU BẠN NÊN LƯU Ý

Không gọi là:

- Weakness
- Defect
- Problem
- Personality flaw

Dùng:

> **Watch-out**

### UI

Cards có cấu trúc:

```text
⚠ WATCH-OUT

Tên xu hướng

Trong một số tình huống, xu hướng này
có thể khiến bạn...

Gợi ý:
Hãy chú ý đến...

```

Không được tạo lời khuyên mới nếu Engine không cung cấp.

---

# SECTION 07 — MÔI TRƯỜNG CÓ THỂ PHÙ HỢP

Đây là một trong những section quan trọng nhất để tạo cảm giác report “thực dụng”.

Hiển thị các chiều:

- Mức độ tự chủ
- Cấu trúc công việc
- Mức độ tương tác
- Không gian khám phá
- Nhịp độ
- Kiểu môi trường

Không dùng điểm giả.

Nếu Interpretation Engine chỉ có một phần dữ liệu:

→ chỉ hiển thị phần có dữ liệu.

Không tự suy luận phần còn lại.

---

# SECTION 08 — EXECUTIVE SNAPSHOT

Một card lớn gần cuối Free Report.

Mục tiêu:

> Gom toàn bộ self-discovery thành một câu chuyện ngắn.

Cấu trúc:

```text
BẠN ĐANG Ở ĐÂU?

[Identity]

BẠN CÓ XU HƯỚNG...

[RIASEC + Personality]

BẠN COI TRỌNG...

[Values]

ĐIỀU NÊN PHÁT HUY...

[Strength]

ĐIỀU NÊN LƯU Ý...

[Watch-out]

```

AI Writer **có thể** tạo prose ở đây.

Nhưng input bắt buộc phải là Report Data Contract.

AI không được thêm facts.

---

# SECTION 09 — PREMIUM TEASER

Đây là phần chuyển đổi thương mại.

Không blur một danh sách nghề giả.

Không hiển thị:

> “Software Engineer — 92%”

nếu Career Matching Engine chưa thực sự cung cấp kết quả.

### UI

```text
┌────────────────────────────────────────────┐
│                                             │
│  BẠN ĐÃ HIỂU MÌNH.                          │
│  NHƯNG ĐIỀU ĐÓ DẪN ĐẾN ĐÂU?                 │
│                                             │
│  Premium sẽ giúp bạn khám phá:              │
│                                             │
│  ✓ Nghề nghiệp phù hợp                     │
│  ✓ Ngành học tương ứng                     │
│  ✓ Trường đại học phù hợp                  │
│  ✓ Khoảng cách từ hiện tại đến mục tiêu    │
│  ✓ Lộ trình hành động                      │
│                                             │
│          [ KHÁM PHÁ HỒ SƠ CHUYÊN SÂU ]     │
│                                             │
└────────────────────────────────────────────┘

```

Đây là **value proposition**, không phải fake result.

---

# IV. PREMIUM REPORT

## PERSONAL CAREER PROFILE

Premium không đơn giản là:

> Free + thêm 5 section.

Nó phải tạo cảm giác:

> **“Bây giờ tôi đã chuyển từ hiểu bản thân sang ra quyết định.”**

---

# PREMIUM INFORMATION ARCHITECTURE

13 sections được gom thành 5 CHAPTERS.

## CHAPTER 1 — UNDERSTAND YOURSELF

01 Career Identity

02 Executive Summary

03 Interest Profile

04 Personality Profile

05 Work Values

---

## CHAPTER 2 — UNDERSTAND YOUR PATTERNS

06 Cross-Dimension Insights

07 Strengths Map

08 Development Areas

09 Suitable Environments

---

## CHAPTER 3 — EXPLORE YOUR FUTURE

10 Career Exploration

11 Major Exploration

12 University Exploration

---

## CHAPTER 4 — TURN INSIGHT INTO ACTION

13 Goal & Action Plan

---

# V. PREMIUM SECTION DETAILS

## 01 — CAREER IDENTITY

Free:

> “Bạn là ai?”

Premium:

> “Chân dung của bạn hình thành như thế nào?”

Có thể hiển thị:

- Identity
- Holland Code
- Primary/Secondary
- Personality pattern
- Core values
- One integrated identity narrative

AI Writer chỉ diễn đạt.

---

# 02 — EXECUTIVE SUMMARY

Đây là “one-page understanding”.

Layout:

```text
YOUR PROFILE

Identity
RIASEC
Personality
Values

────────────

WHAT STANDS OUT

[3–5 insights]

────────────

WHAT THIS MAY MEAN

[AI-written narrative]

────────────

WHAT TO EXPLORE

[Career / Major / University]

```

Career/Major/University chỉ xuất hiện khi engine có dữ liệu.

---

# 03 — INTEREST PROFILE

Premium mở toàn bộ RIASEC.

Có:

- 6 dimensions
- Ranking
- Holland Code
- Primary
- Secondary
- Interpretation
- Evidence
- Implications

Không có “career recommendation” trong section này.

Career recommendation thuộc Section 10.

---

# 04 — PERSONALITY PROFILE

Hiển thị toàn bộ Big Five.

Mỗi trait:

- Score
- Relative position
- Classification
- Interpretation
- Work implication

Không chuyển thành MBTI.

---

# 05 — WORK VALUES

Hiển thị:

```text
1 Achievement
2 Independence
3 Recognition
4 Relationships
5 Support
6 Working Conditions

```

Có thể có:

- ranking visualization
- explanation
- environmental implications

---

# 06 — CROSS-DIMENSION INSIGHT

Đây phải là **WOW section của Premium**.

Ví dụ kiến trúc UI:

```text
INTEREST
     ×
PERSONALITY
     ×
VALUES
     ↓
PATTERN

```

Mỗi Pattern Card:

```text
PATTERN #01

[Interest signal]
+
[Personality signal]
+
[Value signal]

WHY IT MATTERS

[Deterministic explanation]

```

**Cấm AI tự phát hiện pattern.**

Nếu Engine không có pattern:

```text
patterns: []

```

UI hiển thị trạng thái phù hợp, không tự tạo.

---

# 07 — STRENGTHS MAP

Không chỉ danh sách Strength.

Phân nhóm:

```text
COGNITIVE
WORKING
INTERACTION
MOTIVATION

```

Chỉ nhóm nào có dữ liệu mới hiển thị.

---

# 08 — DEVELOPMENT AREAS

Không gọi:

> weaknesses

Mỗi item:

```text
DEVELOPMENT AREA

Current tendency

Potential challenge

Development direction

```

Tất cả phải đến từ Interpretation Data.

---

# 09 — SUITABLE ENVIRONMENTS

Premium cho phép đi sâu hơn Free.

Có thể trình bày thành:

```text
AUTONOMY
████████

STRUCTURE
██████

COLLABORATION
█████████

EXPLORATION
██████████

```

Nhưng chỉ khi Report Data Contract thực sự cung cấp dữ liệu tương ứng.

---

# 10 — CAREER EXPLORATION

Đây là ranh giới cực kỳ quan trọng.

Chỉ hiển thị khi:

```text
Career Matching Engine = AVAILABLE

```

Mỗi Career Card:

```text
CAREER NAME

MATCH
[score / match classification nếu engine cung cấp]

WHY IT MATCHES

[engine explanation]

POTENTIAL CONCERNS

[engine explanation]

EXPLORE CAREER →

```

Không được:

- AI tự tính match score.
- AI tự thêm career.
- AI tự thay đổi ranking.
- AI tự kết luận “nên chọn nghề này”.

---

# 11 — MAJOR EXPLORATION

Flow:

```text
PROFILE
 ↓
CAREER
 ↓
MAJOR

```

Card:

- Major
- Related careers
- Why relevant
- Admission/learning information nếu có data

Không có data:

```text
NOT_AVAILABLE

```

---

# 12 — UNIVERSITY EXPLORATION

Flow:

```text
PROFILE
 ↓
CAREER
 ↓
MAJOR
 ↓
UNIVERSITY

```

University recommendation phải lấy từ University Recommendation Engine.

UI không tự ranking.

Không có engine/data:

```text
NOT_AVAILABLE

```

---

# 13 — GOAL & ACTION PLAN

Đây là điểm cuối của Premium.

Không được thiết kế thành checklist giả.

Chỉ mở khi Roadmap Engine có dữ liệu.

Flow:

```text
CURRENT STATE
      ↓
TARGET
      ↓
REQUIREMENTS
      ↓
GAPS
      ↓
PRIORITIES
      ↓
MILESTONES
      ↓
TASKS

```

UI phải phản ánh đúng Gap-driven Architecture hiện tại.

Không quay lại mô hình:

> “Bạn lớp 10 → hãy làm 10 việc này.”

---

# VI. VALIDITY UI STATES

Đây là global state, không phải section riêng.

## VALID

Hiển thị report bình thường.

Không cần cảnh báo.

---

## QUESTIONABLE

Free:

```text
┌─────────────────────────────────┐
│ ⚠ LƯU Ý VỀ ĐỘ TIN CẬY          │
│                                 │
│ Một số tín hiệu cho thấy kết    │
│ quả có thể chưa hoàn toàn ổn    │
│ định. Bạn vẫn có thể tham khảo  │
│ báo cáo này như một góc nhìn    │
│ khám phá bản thân.              │
└─────────────────────────────────┘

```

Premium:

Warning rõ hơn.

Có CTA:

> Làm lại assessment để có kết quả đáng tin cậy hơn.

---

## INVALID

Không hiển thị report.

```text
KẾT QUẢ CHƯA THỂ SỬ DỤNG

Một số dấu hiệu cho thấy phiên khảo sát
không đủ điều kiện để tạo hồ sơ đáng tin cậy.

[ LÀM LẠI KHẢO SÁT ]

```

---

## UNDETERMINED

Không hiển thị report.

Không được nói:

> “Kết quả của bạn hợp lệ.”

Không được fallback.

Thông báo:

> **Chưa đủ dữ liệu để xác nhận kết quả.**

Nếu có thể, chỉ ra loại metadata còn thiếu.

---

# VII. NOT_AVAILABLE STATE

Dùng cho:

- Career
- Major
- University
- Goal/Roadmap

khi engine chưa sẵn sàng.

Không dùng:

- Fake card
- Fake score
- Fake ranking
- Fake career
- Blur một dữ liệu không tồn tại

### UI

```text
COMING NEXT

Phần khám phá nghề nghiệp sẽ kết nối
hồ sơ của bạn với dữ liệu nghề nghiệp
khi hệ thống hoàn tất.

[ KHÁM PHÁ HỒ SƠ CỦA BẠN ]

```

---

# VIII. VISUAL / UX DIRECTION

## 1. Không làm dashboard admin

Report phải giống:

> **Personalized Digital Profile**

hơn là:

> Analytics Dashboard.

---

## 2. Bento UI

Sử dụng Bento cho:

- Identity
- Strengths
- Values
- Working Style
- Environment

Nhưng không biến toàn bộ report thành hàng chục ô vuông.

Phải có rhythm:

```text
BIG STORY
   ↓
VISUAL
   ↓
INSIGHT
   ↓
DETAIL

```

---

# IX. VISUAL HIERARCHY

Mỗi section chỉ có **ONE primary message**.

Ví dụ:

### RIASEC

Primary message:

> “Bạn thiên về Investigative và Realistic.”

Không để 10 biểu đồ tranh nhau sự chú ý.

### Work Values

Primary message:

> “Điều bạn coi trọng nhất là Achievement.”

### Strengths

Primary message:

> “3 điểm nổi bật nhất trong hồ sơ của bạn là...”

---

# X. MOBILE-FIRST

Mobile phải là thiết kế gốc.

Không thu nhỏ desktop xuống mobile.

### Mobile:

```text
Hero
 ↓
Insight
 ↓
Card
 ↓
Explanation
 ↓
Next

```

Không tạo bảng dữ liệu ngang khó đọc.

RIASEC:

→ horizontal ranking cards.

Big Five:

→ compact trait cards.

Work Values:

→ vertical ranking.

---

# XI. FREE → PREMIUM CONVERSION

Không đặt CTA nâng cấp ở mọi card.

Điểm CTA chính:

### CTA 1

Sau khi học sinh đã hiểu profile.

> **“Bạn đã hiểu mình. Bây giờ hãy xem điều đó dẫn đến đâu.”**

### CTA 2

Sau Cross-Dimension/teaser nếu có Premium.

### CTA 3

Cuối Free Report.

CTA phải bán **kết quả**, không bán “tính năng”.

Không:

> “Mua Premium để mở thêm 13 sections.”

Nên:

> **“Tìm những nghề và ngành học thực sự kết nối với hồ sơ của bạn.”**

---

# XII. AI WRITER UI RULE

AI-generated text phải được đánh dấu trong architecture là:

```text
REPORT NARRATIVE

```

Input:

```text
Report Data Contract
+
approved interpretation

```

Output:

```text
Natural Language

```

AI không được:

```text
Profile
 → AI
 → Career recommendation

```

Mà phải:

```text
Profile
 → Deterministic Engine
 → Report Data
 → AI Writer
 → Natural Language

```

---

# XIII. DATA CONTRACT/UI CONTRACT

UI không được đọc trực tiếp:

- raw answers
- database tables
- assessment internals

UI chỉ được nhận:

```text
ReportData

```

Mọi UI section phải có mapping:

```text
UI Section
    ↓
Report Data Field
    ↓
Source Engine

```

Nếu field không tồn tại:

```text
DO NOT INVENT

```

---

# XIV. COMPONENT ARCHITECTURE

Antigravity phải xây reusable components, không copy-paste UI.

Các component nền:

```text
ReportShell
ReportHeader
ReportSection
InsightCard
MetricCard
RankedDimensionList
TraitCard
ValueCard
StrengthCard
WatchoutCard
EnvironmentCard
PatternCard
TeaserCard
UpgradeCTA
ValidityBanner
NotAvailableState
ReportFooter

```

Mỗi component nhận data qua props.

Không hardcode business logic trong UI.

---

# XV. DESIGN PRINCIPLE — “DATA FIRST, UI SECOND”

Thứ tự implement bắt buộc:

```text
Report Data Contract
       ↓
TypeScript Types
       ↓
Section View Models
       ↓
UI Components
       ↓
Report Pages

```

Không được:

```text
Design UI
 ↓
tự nghĩ data
 ↓
ép backend theo UI

```

---

# XVI. PHASE 2 KHÔNG ĐƯỢC LÀM

Trong Phase 2, nếu engine tương ứng chưa tồn tại:

### KHÔNG:

- tạo Career matching giả
- tạo Major matching giả
- tạo University ranking giả
- tạo Roadmap giả
- tạo AI recommendation
- tạo score mới
- tạo interpretation rule mới
- sửa Validity policy
- sửa RIASEC rule
- sửa Big Five rule
- sửa Work Values rule
- sửa DB schema nếu chưa được PO cho phép

---

# XVII. DEFINITION OF DONE

Phase 2 chỉ được coi là hoàn thành khi:

### DATA

- Report Data Contract rõ ràng.
- UI không đọc raw DB.
- Không có fabricated data.
- Free/Premium boundary được enforce.

### UX

- Free tạo được self-discovery experience.
- Premium có hierarchy rõ.
- CTA không intrusive.
- Mobile hoàn chỉnh.

### STATES

Đã test:

- VALID
- QUESTIONABLE
- INVALID
- UNDETERMINED
- NOT_AVAILABLE
- loading
- empty
- error

### CONTENT

- Không có unauthorized interpretation.
- Không có AI-generated business logic.
- Không có placeholder kiểu `EMPTY BECAUSE NOT IMPLEMENTED` trong UI production.

### FUTURE ENGINES

Career/Major/University/Roadmap:

```text
AVAILABLE → render real data
NOT_AVAILABLE → render approved state
NEVER → fabricate

```

---

# XVIII. PRODUCT EXPERIENCE TỔNG THỂ

Toàn bộ Free Report phải kể một câu chuyện:

```text
        WHO AM I?
             ↓
     HOW DO I THINK?
             ↓
      HOW DO I WORK?
             ↓
      WHAT MATTERS?
             ↓
     WHAT STANDS OUT?
             ↓
      WHAT TO WATCH?
             ↓
   WHAT ENVIRONMENT FITS?
             ↓
      WHAT DOES IT MEAN?
             ↓
   ┌───────────────────┐
   │ WHAT'S NEXT?      │
   │                   │
   │ CAREER            │
   │ MAJOR             │
   │ UNIVERSITY        │
   │ ROADMAP           │
   └───────────────────┘
             ↓
          PREMIUM

```

Premium tiếp tục:

```text
UNDERSTAND
    ↓
CONNECT THE PATTERNS
    ↓
EXPLORE CAREERS
    ↓
EXPLORE MAJORS
    ↓
EXPLORE UNIVERSITIES
    ↓
IDENTIFY GAPS
    ↓
BUILD ROADMAP
    ↓
TAKE ACTION

```

---

# XIX. PO LOCK

Đây là **Blueprint UX/UI**, không phải quyền cho developer tự thay đổi business logic.

Các tài liệu nền tảng bắt buộc tuân thủ:

```text
01_ASSESSMENT_AUDIT
02_SCORING_SPECIFICATION
03_UNIFIED_PROFILE_SPECIFICATION
04_INTERPRETATION_SPECIFICATION
05_REPORT_DATA_SPECIFICATION
06_REPORT_ARCHITECTURE_SPECIFICATION
07_INTERPRETATION_RULES_SPECIFICATION
08_VALIDITY_SPECIFICATION

```

Nếu Blueprint UI này xung đột với một Locked Specification phía trên:

> **Locked Specification được ưu tiên.**

Nếu developer phát hiện mâu thuẫn:

> **STOP — REPORT CONFLICT — DO NOT INVENT A SOLUTION.**

---

# XX. NGUYÊN TẮC CUỐI CÙNG

Report của 1learn.asia không phải là:

> “Một bài test có biểu đồ đẹp.”

Nó phải là:

> **Một hồ sơ cá nhân giúp học sinh hiểu chính mình → nhìn thấy các pattern → kết nối với thế giới nghề nghiệp → và cuối cùng biến hiểu biết đó thành hành động.**

Free tạo ra:

> **“Tôi hiểu mình hơn.”**

Premium tạo ra:

> **“Tôi biết mình nên khám phá gì và bắt đầu từ đâu.”**

Đó là boundary sản phẩm cần giữ xuyên suốt.
