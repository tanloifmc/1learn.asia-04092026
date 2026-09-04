# DATA PROVENANCE AUDIT — 4 BLOCKED FIELDS (STEP 6.5)

**Ngày thực hiện:** 01/09/2026  
**Nguồn tham chiếu:**
- `src/types/report.ts` (ReportData Contract)
- `src/features/career/actions/report-builder.ts` (Current Builder Implementation)
- `src/features/career/actions/interpretation-engine.ts` (Current Engine)
- `src/features/career/utils/interpretation-dictionary.ts` (Rule Dictionary)
- `docs/core_architecture/04_INTERPRETATION_SPECIFICATION.md` (Locked Spec)
- `docs/core_architecture/07_INTERPRETATION_RULES_SPECIFICATION.md` (Locked Spec)
- `docs/core_architecture/10_REPORT_DATA_CONTRACT_SPECIFICATION.md` (Locked Spec)
- `docs/15_ASSESSMENT_PROFILE_REPORT_SPEC.md` (Architecture Spec)

---

## FIELD 1: `identity.title` & `identity.explanation`

### Trace nguồn hiện tại
```typescript
// report-builder.ts — Lines 108-112 (CURRENT)
identity: {
  state: riasecPrimary ? 'AVAILABLE' : 'EMPTY',
  title: riasecPrimary ? `Thuộc nhóm ${riasecPrimary}` : null,
  explanation: "Dựa trên sở thích nghề nghiệp nổi bật nhất"
}
```

### Phân loại nguồn
| Trường | Loại | Giá trị thực tế |
|--------|------|-----------------|
| `title` | **Hardcoded string template** | `"Thuộc nhóm I"` — sử dụng 1 ký tự mã RIASEC không có nghĩa với học sinh |
| `explanation` | **Hardcoded literal** | Chuỗi tĩnh không phụ thuộc bất kỳ dữ liệu nào |

### Locked Specification yêu cầu gì?
- `10_REPORT_DATA_CONTRACT_SPECIFICATION.md` (Example line 72): `"title": "Người Khám Phá Hệ Thống"` — rõ ràng là một **label có nghĩa bằng tiếng Việt**, không phải mã chữ cái.
- `15_ASSESSMENT_PROFILE_REPORT_SPEC.md` (Phần 2, Tầng 3): `"Bạn là người Khám phá - Phân tích (Nhóm I)"` — đây là format mong muốn.
- `04_INTERPRETATION_SPECIFICATION.md`: Không định nghĩa cụ thể cách tạo Identity Title.

### Có đủ source data không?
- `interpretation-dictionary.ts` có `meaning` cho từng RIASEC dimension theo level (high/medium/low), ví dụ: `I.high → "Sở thích Phân tích cao"`.
- **Tuy nhiên**, Dictionary này dùng threshold tuyệt đối (high ≥ 70) — vi phạm Locked Spec 07 (RIASEC phải dùng Relative Profiling, không dùng threshold tuyệt đối).
- `interpretation-engine.ts` đã xử lý đúng: sort by score và xếp hạng (không dùng threshold cho RIASEC), nhưng nó **không map ra một "Human-readable label"** cho identity.

### Kết luận
| | |
|---|---|
| **Status** | 🔴 **GAP — Placeholder** |
| **Phân tích** | Title hiện tại (`"Thuộc nhóm I"`) là một placeholder không có ý nghĩa sản phẩm. Specification yêu cầu label có ngữ nghĩa như `"Người Khám Phá - Phân tích"`. |
| **Nguồn data có tồn tại không?** | **CÓ** — Dictionary đã có `meaning` cho từng RIASEC dimension. Source data đủ. |
| **Cách fix hợp lệ** | Tạo **mapping table** từ RIASEC primary code → Human-readable Vietnamese label. Đây là pure deterministic mapping, không phải suy luận mới. |
| **Ví dụ fix** | `R → "Người Thực Hành"`, `I → "Người Phân Tích"`, `A → "Người Sáng Tạo"`, `S → "Người Kết Nối"`, `E → "Người Khởi Xướng"`, `C → "Người Tổ Chức"` |
| **Cần PO approve mapping?** | **CÓ** — Label này là Product Copy, cần PO duyệt trước khi code. |

---

## FIELD 2: `riasec.interpretation`

### Trace nguồn hiện tại
```typescript
// report-builder.ts — Line 120 (CURRENT)
riasec: {
  ...
  interpretation: "Phân tích sở thích nghề nghiệp"  // HARDCODED PLACEHOLDER
}
```

### Phân loại nguồn
| Trường | Loại | Giá trị thực tế |
|--------|------|-----------------|
| `interpretation` | **Hardcoded literal** | Chuỗi tĩnh không có nghĩa — mọi học sinh đều thấy câu này |

### Locked Specification yêu cầu gì?
- `04_INTERPRETATION_SPECIFICATION.md` định nghĩa pipeline: `Score → Meaning → Evidence → Insight`.
- `interpretation-dictionary.ts` có `insight` per dimension (per level): VD `I.high.insight = "Bạn thích tìm hiểu nguyên nhân cốt lõi..."`.
- Specification **không định nghĩa** cách tổng hợp `insight` của nhiều dimensions thành một `interpretation` tổng thể.

### Có đủ source data không?
- **Engine đã có**: Top-3 dimension details với `insight` text đầy đủ cho từng dim.
- **Còn thiếu**: Không có rule nào trong Locked Spec định nghĩa cách tổng hợp thành "RIASEC narrative".
- Có thể tạm thời render `Top-1 RIASEC dimension insight` (duy nhất 1 câu từ Primary dimension) — đây là **deterministic mapping**, không suy luận.

### Kết luận
| | |
|---|---|
| **Status** | 🟡 **PARTIAL GAP — Source exists but no aggregation rule** |
| **Phân tích** | Insight per dimension đã có. Nhưng không có Locked Rule cho "tổng hợp narrative". |
| **Cách fix hợp lệ** | Map `interpretation = primary_dimension.insight` (1:1 mapping từ Primary RIASEC dimension insight). Đây là mapping deterministic, không suy luận. |
| **Cần PO approve?** | **CÓ** — Cần xác nhận: "Có chấp nhận mapping 1:1 Primary Insight làm RIASEC Interpretation không?" |

---

## FIELD 3: `bigFive.workingStyle` & `bigFive.interactionStyle`

### Trace nguồn hiện tại
```typescript
// report-builder.ts — Lines 126-127 (CURRENT)
bigFive: {
  ...
  workingStyle: null,      // EXPLICITLY NULL
  interactionStyle: null,  // EXPLICITLY NULL
}
```

### Phân loại nguồn
- `interpretation-engine.ts`: Không có output cho `workingStyle`/`interactionStyle`.
- `interpretation-dictionary.ts`: Hoàn toàn không có field này.
- `04_INTERPRETATION_SPECIFICATION.md`: Không định nghĩa rule cho `workingStyle`.
- `07_INTERPRETATION_RULES_SPECIFICATION.md`: Không đề cập.

### Có đủ source data không?
**KHÔNG.** Không có bất kỳ nguồn dữ liệu hay rule nào trong toàn bộ Locked Specification định nghĩa cách tạo ra `workingStyle` hay `interactionStyle`.

### Kết luận
| | |
|---|---|
| **Status** | 🛑 **CRITICAL GAP — NO SOURCE** |
| **Phân tích** | Field tồn tại trong Contract nhưng không có source data, không có Locked Rule để generate. |
| **Cách fix hợp lệ** | Không có cách fix trong phạm vi hiện tại. Cần PO ra Spec mới định nghĩa rule từ Big Five traits → Working/Interaction Style. |
| **Quyết định** | Giữ `null`, UI ẩn section này hoàn toàn. |

---

## FIELD 4: `executiveSnapshot.deterministicSummary`

### Trace nguồn hiện tại
```typescript
// report-builder.ts — Lines 160-166 (CURRENT)
executiveSnapshot: {
  state: 'AVAILABLE',           // <-- LỖI: state AVAILABLE nhưng data không hợp lệ
  deterministicSummary: [
    hollandCode ? `Định hướng RIASEC: ${hollandCode}` : "Chưa xác định định hướng"
  ],
  aiNarrative: null
}
```

### Phân loại nguồn
| Trường | Loại | Vấn đề |
|--------|------|---------|
| `state` | **Hardcoded 'AVAILABLE'** | Sai — không phản ánh chất lượng data |
| `deterministicSummary[0]` | **String template** | Chỉ 1 câu, không đủ để là "Executive Snapshot" |

### Locked Specification yêu cầu gì?
- `10_REPORT_DATA_CONTRACT_SPECIFICATION.md` (Mục 14): `aiNarrative` là optional — không bắt buộc.
- Specification **không định nghĩa** cụ thể `deterministicSummary` phải gồm bao nhiêu mục hay nội dung gì.
- `15_ASSESSMENT_PROFILE_REPORT_SPEC.md` (Tầng 3 mục 1): Mô tả: `"Bạn là người Khám phá - Phân tích (Nhóm I)"` → đây là câu mở đầu tự nhiên.

### Có đủ source data không?
- **Builder đã có**: `hollandCode`, `riasecPrimary`, `bigFiveTraits` (với classification), `workValues` (top 3 names).
- Đủ dữ liệu để tạo 3-5 câu deterministic summary bằng cách **assemble từ các fields đã được tính toán đúng**.
- Đây là **pure mapping/assembly**, không phải suy luận mới.

### Kết luận
| | |
|---|---|
| **Status** | 🟡 **GAP — Source exists but assembly logic missing** |
| **Phân tích** | Source data có đủ. Chỉ thiếu assembly logic trong Builder. |
| **Cách fix hợp lệ** | Tạo `buildDeterministicSummary()` trong Builder — assemble từ các computed fields (hollandCode, primary trait name, top work value). Pure mapping, không suy luận. |
| **Cần PO approve?** | **CÓ** — Cần xác nhận format câu tóm tắt chấp nhận được. |

---

## TRẠNG THÁI STEP 6.5 (THEO CHỈ ĐẠO CỦA PO)

```text
STEP 6.5
│
├─ 6.5-A Identity Hero
│   └─ BLOCKED → cần khóa Identity Label source/rule
│
├─ 6.5-B RIASEC Narrative
│   └─ BLOCKED/PARTIAL → cần khóa aggregate interpretation rule
│
├─ 6.5-C Big Five Styles
│   └─ BLOCKED → đang mở Spec 08
│
├─ 6.5-D Work Values
│   └─ READY / UI có thể hoàn thiện
│
├─ 6.5-E Insights
│   └─ READY / UI có thể hoàn thiện
│
├─ 6.5-F Executive Snapshot
│   └─ BLOCKED → cần khóa assembly rule
│
└─ 6.5-G Premium Teaser
    └─ READY / UI có thể hoàn thiện
```

**Nguyên tắc tuyệt đối:**
1. Mọi dữ liệu nhìn thấy trên Report phải là dữ liệu/rule thật có provenance rõ ràng.
2. Không có placeholder nghiệp vụ, mock data, hardcoded business content hoặc logic "sẽ sửa sau".
3. KHÔNG ĐƯỢC đánh dấu Step 6.5 là RESOLVED khi các GAP nghiệp vụ chưa được giải quyết thông qua pipeline: `Specification → Dictionary/Rule → Builder → UI`.
