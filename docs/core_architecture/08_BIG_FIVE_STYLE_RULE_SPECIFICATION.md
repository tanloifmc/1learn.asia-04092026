# BIG FIVE STYLE RULE SPECIFICATION (DRAFT)

*Trạng thái: PENDING PO APPROVAL / DESIGN PHASE*
*Tài liệu này xác định các quy tắc kinh doanh (business rules) và diễn giải tâm lý học cho "Working Style" và "Interaction Style" dựa trên kết quả bài test Big Five.*

## 1. MỤC TIÊU
- Định nghĩa rõ ràng "Working Style" và "Interaction Style" trong bối cảnh sản phẩm 1learn.asia.
- Xác định cách ánh xạ (mapping) từ điểm số Big Five sang các phong cách này mà không vi phạm nguyên tắc "Không Hard-code, Không Mock, Không Tự bịa Rule".
- Đảm bảo mọi kết luận tâm lý học đều được thiết kế và phê duyệt trước khi lập trình (Formal Rule Specification).

## 2. QUY TẮC ĐỀ XUẤT (PROPOSED PRODUCT RULES)

*Các quy tắc dưới đây được thiết kế dựa trên lý thuyết Big Five chuẩn, ánh xạ trực tiếp vào thang đo Tương đối (Relative Profiling: Prominent/Moderate/Lower) của 1learn. PO cần duyệt để LOCK spec này.*

### 2.1. Working Style (Phong cách làm việc)
**Định nghĩa:** Cách người dùng tổ chức công việc, quản lý thời gian và tiếp cận nhiệm vụ.
**Nguồn (Source Traits):**
- **Trait chính:** Conscientiousness (C - Tận tâm). C quyết định mức độ kỷ luật và tổ chức.
- **Trait phụ (Fallback):** Openness (O - Cởi mở). O quyết định cách tiếp cận quy trình (đổi mới hay truyền thống).

**Quy tắc diễn giải (Interpretation Rule):**
1. Nếu **C = Prominent**: → `Có cấu trúc & định hướng mục tiêu`
2. Nếu **C = Lower**: → `Linh hoạt & ít thiên về cấu trúc`
3. Nếu **C = Moderate**:
   - Xét **O = Prominent**: → `Khám phá & đổi mới`
   - Xét **O = Lower**: → `Thực tế & có định hướng quy trình`
   - Nếu O cũng Moderate: → `Cân bằng giữa cấu trúc và linh hoạt`

### 2.2. Interaction Style (Phong cách tương tác)
**Định nghĩa:** Cách người dùng giao tiếp, làm việc nhóm và tương tác xã hội trong công việc.
**Nguồn (Source Traits):**
- **Trait chính:** Extraversion (E - Hướng ngoại). E quyết định cường độ tương tác.
- **Trait phụ (Fallback):** Agreeableness (A - Dễ chịu). A quyết định thái độ tương tác (hợp tác hay cạnh tranh).

**Quy tắc diễn giải (Interpretation Rule):**
1. Nếu **E = Prominent**: → `Chủ động & giàu tương tác`
2. Nếu **E = Lower**: → `Trầm tĩnh & tương tác có chọn lọc`
3. Nếu **E = Moderate**:
   - Xét **A = Prominent**: → `Hợp tác & hỗ trợ`
   - Xét **A = Lower**: → `Trực tiếp & định hướng kết quả`
   - Nếu A cũng Moderate: → `Cân bằng & chừng mực`

### 2.3. Cấu trúc Dữ liệu Output (Dictionary)
Sẽ được định nghĩa trong `interpretation-dictionary.ts`:
```typescript
interface StyleDictionary {
  working_style: Record<string, { label: string; explanation: string }>;
  interaction_style: Record<string, { label: string; explanation: string }>;
}
```
*Ghi chú: Text `explanation` chi tiết sẽ được biên soạn sau khi PO chốt bộ `label` trên.*

### 2.4. Khẳng định Provenance
- Rule không sử dụng điểm tuyệt đối, tuân thủ chặt chẽ Relative Profiling (`D = score - M`).
- Cấu trúc Fallback đảm bảo `workingStyle` và `interactionStyle` luôn có giá trị (không bao giờ null).
- Không tự suy diễn pattern ngoài các tổ hợp if-else đã liệt kê ở trên.


## 3. LỘ TRÌNH THỰC THI (SAU KHI CHỐT SPEC)
1. Cập nhật `08_BIG_FIVE_STYLE_RULE_SPECIFICATION.md` thành **FINAL LOCKED**.
2. Cập nhật `interpretation-dictionary.ts` để bổ sung vocabularies.
3. Code logic tổng hợp vào `interpretation-engine.ts`.
4. Gọi data trong `report-builder.ts`.
5. Bổ sung Unit Tests.
6. Kết nối ra giao diện UI.
7. Đánh dấu GAP "Big Five Styles" là **RESOLVED**.
