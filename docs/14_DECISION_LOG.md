# 14 — DECISION LOG
> Ghi lại tất cả quyết định quan trọng về sản phẩm và kỹ thuật, kèm lý do.
> Mọi quyết định kiến trúc lớn phải được ghi ở đây TRƯỚC KHI thực thi.

---

## Format

```
### DL-XXX: [Tiêu đề quyết định]
- **Ngày:** YYYY-MM-DD
- **Người quyết định:** [Product Owner / CTO / Team]
- **Trạng thái:** Accepted | Rejected | Superseded by DL-XXX
- **Bối cảnh:** Tại sao cần quyết định này?
- **Các phương án đã xem xét:**
  1. Option A — pros/cons
  2. Option B — pros/cons
- **Quyết định:** Option X vì...
- **Hệ quả:** Ảnh hưởng đến những gì?
```

---

### DL-001: Dùng Core Platform starter kit thay vì xây mới từ đầu
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner + CTO
- **Trạng thái:** Accepted
- **Bối cảnh:** Cần triển khai nhanh. Đã có sẵn starter kit Next.js + Supabase với Auth, RBAC, CMS, Audit Log, Media Storage.
- **Các phương án:**
  1. Xây mới 100% — Full control nhưng mất 2-3 tháng chỉ để làm nền móng
  2. Dùng core platform — Tiết kiệm 2 tháng, tận dụng 80% nền móng đã verified
- **Quyết định:** Option 2 — Dùng core platform. Domain features được xây trên top của core.
- **Hệ quả:** Domain modules nằm trong `src/features/[domain]/`. Core modules không được import từ domain.

---

### DL-002: Không dùng MBTI làm tiêu chí quyết định nghề nghiệp
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner
- **Trạng thái:** Accepted
- **Bối cảnh:** MBTI phổ biến nhưng thiếu độ tin cậy khoa học khi dùng độc lập để quyết định nghề nghiệp.
- **Quyết định:** Dùng RIASEC (Holland) làm framework chính, kết hợp Big Five và Work Values. MBTI chỉ được dùng như dữ liệu tham khảo bổ sung, không phải tiêu chí quyết định.
- **Hệ quả:** Assessment engine phải hỗ trợ multi-framework scoring. DB schema phải có đủ dimension columns.

---

### DL-003: AI không được tự tạo dữ liệu thực tế
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner + CTO
- **Trạng thái:** Accepted
- **Bối cảnh:** AI (LLM) có xu hướng "hallucinate" — tự bịa thông tin trường, điểm chuẩn, học phí khi không có dữ liệu.
- **Quyết định:** Hard rule: AI chỉ được sử dụng dữ liệu từ database có nguồn. Mọi output phải có `last_verified_at`. Nếu thiếu dữ liệu → AI phải nói rõ không có thông tin.
- **Hệ quả:** Career, Major, University database phải có `status`, `source`, `last_verified_at`. Prompt engineering phải enforce no-fabrication rule.

---

### DL-004: Học sinh là chủ thể dữ liệu — phụ huynh chỉ xem với sự cho phép
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner
- **Trạng thái:** Accepted
- **Bối cảnh:** Privacy của học sinh vị thành niên là yêu cầu pháp lý và đạo đức. Cần cân bằng giữa hỗ trợ phụ huynh và quyền tự chủ của học sinh.
- **Quyết định:** Học sinh control hoàn toàn `parent_sharing_permissions`. Phụ huynh không thể tự truy cập mà không có invite được học sinh chấp nhận. Phụ huynh chỉ READ, không WRITE.
- **Hệ quả:** `parent_child_links` + `parent_sharing_permissions` tables. RLS phải enforce ở DB level, không chỉ UI level.

---

### DL-005: Mobile-first design (không phải desktop-first)
- **Ngày:** 2026-08-25
- **Người quyết định:** CTO
- **Bối cảnh:** Target users là học sinh THPT — 80%+ dùng điện thoại là thiết bị chính.
- **Quyết định:** Thiết kế và code mobile-first. Desktop là enhancement. Playwright tests phải chạy cả desktop lẫn mobile breakpoint.
- **Hệ quả:** CSS phải dùng mobile-first media queries. Component design từ 320px lên.

---

### DL-006: Không xây AI Advisor trước Phase 9
- **Ngày:** 2026-08-25
- **Người quyết định:** CTO
- **Bối cảnh:** AI Advisor cần dữ liệu đủ tốt (career, major, university) và matching engine hoạt động để tạo ra context tốt. AI không có context tốt sẽ trả lời kém chất lượng và có hại hơn có lợi.
- **Quyết định:** AI Advisor chỉ được xây ở Phase 9, sau khi Phase 3-6 hoàn thành.
- **Hệ quả:** Phases 1-8 không có AI chat feature. AI chỉ được dùng để generate summaries/narratives trên kết quả matching (không phải chat tự do).

---

### DL-007: Multi-agent system cho development workflow
- **Ngày:** 2026-08-25
- **Người quyết định:** CTO
- **Bối cảnh:** Dự án phức tạp, nhiều domain. Cần phân công chuyên môn để đảm bảo chất lượng.
- **Quyết định:** Dùng Antigravity multi-agent system với Orchestrator + Specialist agents. Mỗi agent có phạm vi trách nhiệm rõ ràng. Quality gate bắt buộc trước mỗi merge.
- **Hệ quả:** `.agents/agents/` folder với agent definitions. `AGENTS.md` với orchestration rules. Không có agent nào tự ý merge vào main.

---

### DL-008: Matching Engine phải DETERMINISTIC — AI chỉ được dùng cho narrative
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner + CTO
- **Trạng thái:** Accepted
- **Bối cảnh:** AI (LLM) không cho ra kết quả nhất quán với cùng một input. Nếu học sinh làm lại assessment hoặc hỏi lại thì nhận được kết quả khác nhau → mất uy tín hoàn toàn với hệ thống tư vấn.
- **Quyết định:** Kiến trúc **3 tầng cứng**:
  - **Tầng 1 (Core — Deterministic):** Scoring engine dùng thuật toán toán học thuần túy (RIASEC weighted sum + Big Five correlation + Work Values dot product). Cùng input → cùng output 100% mọi lần. Đây là nguồn sự thật duy nhất.
  - **Tầng 2 (Narrative — AI):** AI chỉ được dùng để *viết diễn giải* của kết quả deterministic — không tạo ra kết quả. Kết quả đã có, AI chỉ dịch sang ngôn ngữ tự nhiên.
  - **Tầng 3 (Q&A — AI):** AI Advisor trả lời câu hỏi của học sinh, với kết quả deterministic làm context cố định.
- **Hệ quả:** Scoring engine phải là pure functions (no randomness, no LLM). Phải có unit tests chứng minh tính deterministic. AI không bao giờ được gọi trong quá trình tính điểm.

---

### DL-009: Assessment Framework — Chuẩn khoa học quốc tế, đa mô hình
- **Ngày:** 2026-08-25
- **Người quyết định:** CTO
- **Trạng thái:** Accepted
- **Bối cảnh:** Cần framework đủ tin cậy khoa học để kết quả có giá trị thực sự, không chỉ là "test vui".
- **Quyết định:** Sử dụng **4 framework kết hợp** — không dùng độc lập:
  1. **RIASEC/Holland** (1959, validated internationally) — framework chính cho career matching. Chuẩn O*NET. Deterministic hoàn toàn.
  2. **Big Five Personality (NEO-PI-R abbreviated)** — validated across 50+ cultures. Không dùng để quyết định nghề, dùng để làm giàu work style profile.
  3. **Work Values Inventory (Super, 1970)** — đo priority: thu nhập/ổn định/tự do/sáng tạo/tác động. 15 items, validated.
  4. **Multiple Intelligence Theory (Gardner)** — phù hợp với học sinh THPT, gần gũi hơn với môi trường học đường.
- **Nguồn mở sử dụng:** Open-Source Psychometrics Project (openpsychometrics.org) — public domain question banks.
- **MBTI:** Không sử dụng làm tiêu chí. Có thể hiển thị như "fun reference" nếu học sinh muốn nhưng không ảnh hưởng matching.
- **Hệ quả:** Assessment database phải lưu từng câu hỏi thuộc framework nào + dimension + weight. Kết quả phải trả về điểm từng dimension của từng framework riêng biệt.

---

### DL-010: Nguồn dữ liệu Nghề/Ngành/Trường
- **Ngày:** 2026-08-25
- **Người quyết định:** CTO
- **Trạng thái:** Accepted
- **Bối cảnh:** Cần nguồn dữ liệu chính thống, đáng tin cậy, có thể cập nhật định kỳ.
- **Quyết định — theo tầng ưu tiên:**
  - **Nghề nghiệp:** O*NET (US DOL, open data) làm khung chuẩn → adapt sang bối cảnh Việt Nam. Mỗi nghề có RIASEC code chuẩn từ O*NET.
  - **Ngành học VN:** Thông tư 09/2022/TT-BGDĐT + Quyết định 1596/QĐ-BGDĐT (2024) từ Bộ GD-ĐT → trích xuất thủ công từ PDF chính thức, load vào DB với `source = "Bộ GD-ĐT"` và `last_verified_at`.
  - **Trường đại học:** Dữ liệu tuyển sinh từ trang chính thức của từng trường + tổng hợp từ các kỳ xét tuyển ĐGNL/THPT.
  - **Không có API công khai từ Bộ GD-ĐT hiện tại** → phải nhập thủ công có kiểm chứng. Admin interface phải hỗ trợ nhập hàng loạt (CSV import).
- **Hệ quả:** Cần xây admin import tool trước khi launch. Mọi record phải có `source`, `source_url`, `last_verified_at`, `status`. Không seed dữ liệu chưa verify vào production.

---

### DL-011: Business Model — Freemium + Feature-Gating
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner
- **Trạng thái:** Accepted
- **Bối cảnh:** Cần mô hình kinh doanh bền vững nhưng không tạo rào cản với học sinh nghèo.
- **Quyết định — Freemium với Feature Gating:**
  - **Free (luôn miễn phí):** Đăng ký, onboarding, toàn bộ assessment, báo cáo tổng quan (top 3 careers, overview profile, basic roadmap).
  - **Premium Features (hiển thị nhưng bị blur/lock):**
    - Báo cáo Career chi tiết (full 10+ career directions, detailed explanation)
    - University Matching (Dream/Match/Safe với chi tiết)
    - Personal Roadmap đầy đủ (monthly/weekly tasks)
    - Progress Tracking & Journal
    - Parent Dashboard
    - Career Trials ("Thử nghề")
    - AI Advisor
  - **Mô hình bán:** Gói theo tính năng (Feature Pack) hoặc gói tổng (All-Access), thanh toán theo năm.
  - **UX rule:** Premium features PHẢI hiển thị trong UI nhưng bị blur + có "Mở khóa" CTA. Học sinh thấy mình sắp nhận được gì → tạo động lực mua.
- **Hệ quả:** Mọi feature premium cần có `is_premium: boolean` trong config. Middleware/RLS check subscription status. UI component cần `<PremiumGate>` wrapper.

---

### DL-012: Landing Page là deliverable đầu tiên
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner
- **Trạng thái:** Accepted
- **Bối cảnh:** Cần thu thập lead (phụ huynh + học sinh) trước khi sản phẩm hoàn chỉnh để validate thị trường.
- **Quyết định:** Landing Page (LP) là deliverable đầu tiên — trước cả Student Onboarding. LP phải:
  - Truyền tải value proposition rõ ràng
  - Thu thập email/SĐT (lead magnet)
  - Form đăng ký sớm (early access)
  - SEO-optimized
  - Không cần auth — public page
- **Thứ tự:** Landing Page → Phase 0 finish → Phase 1 (Student Profile) → ...
- **Hệ quả:** Thêm LP vào Phase 0 của Roadmap.

---

### DL-013: Tên sản phẩm/Định vị — "Quản trị cuộc đời"
- **Ngày:** 2026-08-25
- **Người quyết định:** Product Owner
- **Trạng thái:** Accepted
- **Bối cảnh:** Product Owner xác nhận đây không phải app hướng nghiệp thông thường — đây là nền tảng "Quản trị cuộc đời" (Life Goal Management) với trọng tâm là nghề nghiệp và mục tiêu học tập.
- **Quyết định:** Định vị sản phẩm là **Life Goal Management Platform** — không phải Career App hay LMS. Nghề nghiệp là một trong những mục tiêu cuộc đời cần quản trị. Về sau có thể mở rộng sang các loại mục tiêu khác (personal development, health, relationships). MVP tập trung vào mục tiêu nghề nghiệp + học tập.
- **Hệ quả:** Cập nhật `00_PRODUCT_VISION.md` và `product-bible.md` để phản ánh định vị này. Roadmap phần sau có thể mở rộng beyond career.

---

*Mọi quyết định quan trọng phải được thêm vào đây. Format: DL-[số thứ tự tăng dần].*
