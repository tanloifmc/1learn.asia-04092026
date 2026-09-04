# REPORT UI/UX BLUEPRINT RECONCILIATION

## MỤC TIÊU CỦA KẾ HOẠCH NÀY
Tài liệu này đóng vai trò là "Bản đồ đối chiếu thực tế" (Reconciliation Map) giữa **Hiện trạng Code thực tế (Current Implementation)** và **Blueprint UI/UX do PO vừa cung cấp**. Kế hoạch này thay thế cho các technical gate thuần túy và sẽ được giữ làm Source of Truth cho đến khi Report V1 (Free & Premium) hoàn thiện 100% về mặt trải nghiệm sản phẩm.

---

## 1. BẢNG ĐỐI CHIẾU FREE REPORT (SELF DISCOVERY)

| Blueprint Section | Required UX | Required ReportData fields | Current implementation | Status | Missing Dependencies / Gaps | Exact Files / Components |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01 Career Identity** | Hero visual, Identity title, Holland Code, Primary/Secondary, Narrative | `identity.title`, `identity.explanation`, `riasec.hollandCode`, `riasec.primary`/`secondary` | Rendered Card with Title and Explanation | 🟡 PARTIAL | Thiếu Visual Motif/Hero impact. Cần nâng cấp UI để tạo Wow Moment. | `CareerIdentityCard.tsx` |
| **02 RIASEC Profile** | Hero visualization, Ranked Cards, Insight/Narrative Card | `riasec.dimensions`, `riasec.interpretation` | Radar chart or bar chart + list | 🟡 PARTIAL | Mới có ranked visualization. Thiếu Insight Card ("Điều nổi bật trong hồ sơ của bạn..."). | `RiasecProfileCard.tsx` |
| **03 Big Five Working Style** | Layer 1: Shape, Layer 2: Classifications, Layer 3: Working/Interaction Styles | `bigFive.traits`, `bigFive.workingStyle`, `bigFive.interactionStyle` | Trait bars + Prominent/Moderate labels | 🟡 PARTIAL | Thiếu Layer 3 (Cách tư duy, Cách tổ chức...). Cần kiểm tra xem Interpretation Engine đã trả về đủ `workingStyle`/`interactionStyle` chưa. | `BigFiveCard.tsx` |
| **04 Top 3 Work Values** | 3 Large Cards with Icons, Name, Short Explanation, Implication | `workValues.values` (rank 1-3) | List of values | 🟡 PARTIAL | Thiếu Short Explanation và "Điều này có ý nghĩa gì". Cần đối chiếu `WorkValue` object. | `WorkValuesCard.tsx` |
| **05 Strengths** | 3-5 Cards. Icon, Name, Description, "WHY IT APPEARS" (source) | `strengths.items` (title, description, sourceDimensions) | Simple list in InsightsCard | 🟡 PARTIAL | Đang gộp chung trong `InsightsCard`. Thiếu cấu trúc độc lập và phần giải thích "Why it appears". | `InsightsCard.tsx` |
| **06 Watch-outs** | Watch-out cards. Không gọi là Weakness. Có suggestion. | `watchOuts.items` (title, description, implication) | Simple list in InsightsCard | 🟡 PARTIAL | Đang gộp chung trong `InsightsCard`. Cần tách thành Card riêng biệt và format đúng cấu trúc "Trong một số tình huống... -> Gợi ý". | `InsightsCard.tsx` |
| **07 Suitable Environment** | Hiển thị các chiều (Tự chủ, Tương tác, Không gian...). Render real data only. | `environments.items` | Simple list in InsightsCard | 🟡 PARTIAL | Cần cấu trúc hóa các chiều môi trường. | `InsightsCard.tsx` |
| **08 Executive Snapshot** | "BẠN ĐANG Ở ĐÂU", "XU HƯỚNG", "COI TRỌNG", "PHÁT HUY", "LƯU Ý" | `executiveSnapshot.deterministicSummary` | Không có | 🔴 MISSING | Hoàn toàn chưa được code UI lẫn Data Builder cho phần này. | (Cần tạo Component mới) |
| **09 Premium Teaser** | CTA bán kết quả (Value proposition). Không blur data. | Hardcoded UI states | `FutureExplorationCard` hiển thị "Sắp ra mắt" | 🟡 PARTIAL | Đang hiển thị trạng thái kĩ thuật (NOT_AVAILABLE) thay vì Value Proposition chuẩn thương mại. | `FutureExplorationCard.tsx` |

---

## 2. BẢNG ĐỐI CHIẾU PREMIUM REPORT (DECISION SUPPORT)

*Ghi chú: Toàn bộ Premium Report hiện tại là 🔴 MISSING trong UI Implementation. Blueprint quy định 13 section chia làm 4 CHAPTER.*

| Chapter / Section | Required UX | ReportData fields | Status | Missing Dependencies / Gaps |
| :--- | :--- | :--- | :--- | :--- |
| **CHAPTER 1: UNDERSTAND YOURSELF** |
| 01 Career Identity | Integrated identity narrative | `identity.explanation` | 🔴 MISSING | Khác Free ở mức độ sâu của narrative. |
| 02 Executive Summary | One-page understanding (Profile, Stand outs, Meaning, Explore) | `executiveSnapshot` + AI Narrative | 🔴 MISSING | Cần cập nhật `buildReportData` để trả về AI Narrative cho Premium. |
| 03 Interest Profile | Full 6 dimensions, evidence, implications | `riasec` | 🔴 MISSING | |
| 04 Personality Profile | Full traits, relative position, work implication | `bigFive` | 🔴 MISSING | |
| 05 Work Values | Full ranking, explanation, environmental implications | `workValues` | 🔴 MISSING | |
| **CHAPTER 2: UNDERSTAND YOUR PATTERNS** |
| 06 Cross-Dimension Insights | The WOW section. Interest + Personality + Values = Pattern | `crossDimension.patterns` | 🔴 MISSING | `PatternItem` contract đã có, cần build UI. Cấm tự AI nghĩ pattern. |
| 07 Strengths Map | Phân nhóm (Cognitive, Working, Interaction, Motivation) | `strengths.items` | 🔴 MISSING | Cần categorization logic trong Interpretation Engine. |
| 08 Development Areas | Current tendency, Potential challenge, Direction | `watchOuts.items` | 🔴 MISSING | |
| 09 Suitable Environments | Biểu đồ thanh ngang (Autonomy, Structure, Collaboration) | `environments.items` | 🔴 MISSING | |
| **CHAPTER 3: EXPLORE YOUR FUTURE** |
| 10 Career Exploration | Career Name, Match Score, Why it matches, Concerns | `careerExploration` | 🔴 BLOCKED | Đợi Career Matching Engine (Phase 4). |
| 11 Major Exploration | Major, Related careers, Why relevant | `majorExploration` | 🔴 BLOCKED | Đợi Major Matching Engine (Phase 5). |
| 12 University Exploration| University recommendation (No UI ranking) | `universityExploration`| 🔴 BLOCKED | Đợi University Recommendation Engine (Phase 5). |
| **CHAPTER 4: TURN INSIGHT INTO ACTION** |
| 13 Goal & Action Plan | Gaps -> Priorities -> Milestones -> Tasks | `actionPlan` | 🔴 BLOCKED | Đợi Roadmap Engine (Phase 6). |

---

## 3. GLOBAL STATES RECONCILIATION

| State | Definition | Current Implementation | Status | Gaps |
| :--- | :--- | :--- | :--- | :--- |
| **VALID** | Render bình thường | Đã xử lý (Render `ReportUI`) | 🟢 DONE | Đã verify với dữ liệu thật. |
| **QUESTIONABLE** | Hiển thị `<ValidityBanner />` | Có Component `ValidityBanner` | 🟡 PARTIAL | Chưa verify behavior thực tế khi data có state này. |
| **INVALID** | Khóa Report, nút "Làm lại khảo sát" | Có `<ReportBlockedView />` | 🟡 PARTIAL | UI chưa có CTA "Làm lại khảo sát" rõ ràng theo blueprint. |
| **UNDETERMINED**| Báo chưa đủ dữ liệu xác nhận | Dùng chung `<ReportBlockedView />`| 🔴 MISSING | UI chưa phân tách thông báo rõ ràng cho lỗi thiếu Metadata. |
| **NOT_AVAILABLE**| Hiển thị "Coming Next" CTA | Đã có Capability State support | 🟡 PARTIAL | Đang render text thuần, chưa có CTA "Khám phá hồ sơ của bạn" chuẩn. |
| **EMPTY/LOADING**| Loading states | Cơ bản của React Suspense | 🟡 PARTIAL | Chưa có skeleton loader đẹp mắt. |

---

## 4. TỔNG HỢP TIẾN ĐỘ THỰC TẾ (PRODUCT COMPLETION)

> **A. CURRENT PRODUCT COMPLETION: ~40%** 
(Nền tảng Data Contract và Server Component đã vững, nhưng Product Experience/Narrative còn thiếu rất nhiều).

> **B. FREE REPORT COMPLETION: ~60%**
(Đã lên hình các Card dữ liệu cơ bản, nhưng thiếu Storytelling, Executive Snapshot và phân lớp sâu theo yêu cầu của Blueprint).

> **C. PREMIUM REPORT COMPLETION: 0%**
(Hoàn toàn chưa thiết kế hay lắp ráp giao diện Premium).

> **D. GLOBAL STATES COMPLETION: 30%**
(Mới verify được đường Happy Path - VALID).

---

## 5. BƯỚC TRIỂN KHAI TIẾP THEO (EXACT NEXT IMPLEMENTATION STEP)

**[STEP 6.5]: FINISH FREE REPORT UX (NARRATIVE & STRUCTURE)**

Dựa theo Blueprint, chúng ta không được nhảy cóc sang Premium mà phải hoàn tất Storytelling cho Free Report:
1. Nâng cấp `CareerIdentityCard` thành **Hero Section** thực thụ.
2. Cập nhật `RiasecProfileCard` và `BigFiveCard`: Bổ sung Insight/Narrative (Layer 3).
3. Rã `InsightsCard` hiện tại thành các thành phần độc lập (`StrengthCard`, `WatchOutCard`, `EnvironmentCard`), bổ sung cấu trúc "Why it appears".
4. Dựng mới `ExecutiveSnapshotCard` ở cuối báo cáo (Tích hợp thêm Data Builder để bóc tách thông tin nếu cần).
5. Thay thế text thuần bằng **Premium Teaser Value Proposition**.

*(Cam kết: Chỉ chỉnh sửa Presentational Components và xào nấu Data Contract, không thay đổi Data Flow gốc hoặc tính lại điểm số).*
