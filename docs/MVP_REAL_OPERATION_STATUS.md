# MVP REAL OPERATION STATUS
**Câu hỏi cốt lõi: "Nếu hôm nay đưa một học sinh thật vào từ khảo sát đến roadmap, flow có hoạt động thật không?"**

> **Trả lời thẳng thắn:** ❌ **CHƯA.** Flow không thông suốt hoàn toàn từ đầu đến cuối với dữ liệu thật.

---

## 1. End-to-End Flow Status

```
✅ Khảo sát 121 câu → Lưu kết quả
✅ Tính RIASEC / Big Five
✅ Trang /me/bao-cao → Hiển thị kết quả

⚠️  Gợi ý Lĩnh vực (getFieldRecommendations)
     → Logic chạy được, nhưng RIASEC mapping cho Fields chưa được verify chuyên môn.
     → Kết quả có thể gợi ý sai lĩnh vực vì mapping heuristic.

❌ /explore → Danh sách Fields
     → Trang render được, 10 Fields hiển thị.
     → Nhưng khi click vào Field → KHÔNG có Major nào (0/50 majors có field_id).
     → Field → Major link bị ĐỨT GÃYHOÀN TOÀN.

❌ /explore/[slug] → Major list
     → Empty state (không có dữ liệu để hiển thị) vì 0 major có field_id.

❌ /majors/[slug] → University list
     → Trang render được.
     → Nhưng chỉ có 6 quan hệ Uni-Major trong toàn bộ DB.
     → 44 trong 50 majors sẽ hiển thị "Không có trường nào đào tạo".

❌ /universities/[slug] → Landing page
     → Trang render được.
     → Logo: NULL cho tất cả 31 trường. Fallback UI cần kiểm tra.
     → Website: Column không tồn tại trong schema hiện tại.
     → is_production_eligible: FALSE cho tất cả 31 trường.

⚠️  /goal → Set mục tiêu
     → UI hoạt động khi đã có goal.
     → RoadmapTriggerButton phụ thuộc vào university_majors để tìm chương trình.
     → Nếu không có quan hệ Uni-Major, engine có thể fail.

⚠️  /roadmap → Lộ trình
     → Engine có thể chạy được (chưa verify với data MVP mới).
     → Roadmap generic được sinh ra không phản ánh ngành/trường cụ thể.
```

---

## 2. Field → Major Status

| Chỉ số | Giá trị | Đánh giá |
|--------|---------|----------|
| Tổng Fields | 10 | ✅ Đủ cho MVP |
| Tổng Majors | 50 | ✅ Đủ cho MVP |
| Majors có field_id | **50 / 50** | ✅ Đã map thành công 100% |
| RIASEC mapping | Heuristic | ⚠️ Chưa verify chuyên môn |
| Taxonomy taxonomy document | `FIELD_MAJOR_TAXONOMY.md` | ✅ Đã tạo — Approved bởi CTO |
| Mapping status | Curated (đã write DB) | ✅ Hoàn tất ngày 29/08/2026 |

**Status:** Luồng `Field → Major` đã ĐƯỢC NỐI THÔNG. `/explore/[slug]` hiển thị đầy đủ danh sách ngành cho tất cả 10 lĩnh vực.

---

## 3. University Identity Status

| Chỉ số | Giá trị | Đánh giá |
|--------|---------|----------|
| Tổng universities | 31 | — |
| Có slug | 31 / 31 | ✅ |
| Có tên chính thức | 31 / 31 | ✅ |
| Có short_name | 31 / 31 | ✅ |
| Có location_city | 31 / 31 | ✅ |
| Có website (column) | ❌ Column không tồn tại | ❌ BLOCKER |
| Có logo_url | 0 / 31 | ❌ Thiếu — UI cần fallback |
| Có description | 0 / 31 | ❌ Thiếu |
| `is_production_eligible` | FALSE cho TẤT CẢ | ⚠️ Cờ hiệu tất cả chưa ready |
| `source` / `source_url` | NULL cho TẤT CẢ | ⚠️ Không có provenance |
| `last_verified_at` | NULL cho TẤT CẢ | ⚠️ Chưa ai verify |

**Phân loại 31 trường:**
- Tất cả 31 trường thuộc trạng thái `PENDING_VERIFICATION`
- Không có trường nào đạt `VERIFIED` hay `CURATED`
- Dữ liệu tên/slug/location có thể tin cậy (crawled hoặc entered manually)

**Danh sách 31 trường (tên, slug, loại hình):**
| Tên | Short | Slug | Loại | Thành phố |
|-----|-------|------|------|-----------|
| Đại học Bách Khoa Hà Nội | HUST | hust | public | Hà Nội |
| Đại học Bách Khoa TP.HCM | BKU | bku | public | Hồ Chí Minh |
| Đại học Cần Thơ | CTU | ctu | public | Cần Thơ |
| Đại học Công nghệ ĐHQGHN | UET | uet | public | Hà Nội |
| Đại học Đà Nẵng | UD | ud | public | Đà Nẵng |
| Đại học Duy Tân | DTU | dtu | private | Đà Nẵng |
| Đại học FPT | FU | fu | private | Hà Nội |
| Đại học Fulbright Việt Nam | FUV | fuv | international | Hồ Chí Minh |
| Đại học Kinh tế Quốc dân | NEU | neu | public | Hà Nội |
| Đại học Kinh tế TP.HCM | UEH | ueh | public | Hồ Chí Minh |
| Đại học Luật Hà Nội | HLU | hlu | public | Hà Nội |
| Đại học Luật TP.HCM | UEL-HCM | uel-hcm | public | Hồ Chí Minh |
| Đại học Mỹ thuật Công nghiệp | UIFA | uifa | public | Hà Nội |
| Đại học Ngoại thương | FTU | ftu | public | Hà Nội |
| Đại học Nông lâm TP.HCM | NLU | nlu | public | Hồ Chí Minh |
| Đại học Nguyễn Tất Thành | NTT | ntt | private | Hồ Chí Minh |
| Đại học Phenikaa | Phenikaa | phenikaa | private | Hà Nội |
| Đại học Quốc gia Hà Nội | VNU-HN | vnu-hn | public | Hà Nội |
| Đại học RMIT Việt Nam | RMIT | rmit-vn | international | Hồ Chí Minh |
| Đại học Sư phạm Hà Nội | HNUE | hnue | public | Hà Nội |
| Đại học Sư phạm TP.HCM | HCMUE | hcmue | public | Hồ Chí Minh |
| Đại học Tôn Đức Thắng | TDTU | tdtu | public | Hồ Chí Minh |
| Đại học Văn Lang | VLU | vlu | private | Hồ Chí Minh |
| Đại học VinUni | VinUni | vinuni | private | Hà Nội |
| Đại học Xây dựng Hà Nội | HUCE | huce | public | Hà Nội |
| Đại học Y Dược TP.HCM | UMP | ump | public | Hồ Chí Minh |
| Đại học Y Hà Nội | HMU | hmu | public | Hà Nội |
| Học viện Công nghệ Bưu chính Viễn thông | PTIT | ptit | public | Hà Nội |
| Trường Đại học Khoa học Tự nhiên HN | HNUSS | hnuss | public | Hà Nội |
| Trường Đại học Khoa học Xã hội Nhân văn HN | USSH-HN | ussh-hn | public | Hà Nội |
| Học viện Nông nghiệp Việt Nam | VNUA | vnua | public | Hà Nội |

---

## 4. University → Major Status

| Chỉ số | Giá trị | Đánh giá |
|--------|---------|----------|
| Tổng quan hệ Uni-Major | **6** | ❌ Cực kỳ thiếu |
| Trường có ít nhất 1 ngành | 6 / 31 | ❌ 25 trường orphan |
| Ngành có ít nhất 1 trường | 4 / 50 | ❌ 46 ngành không trường |
| Nguồn gốc 6 quan hệ | Không rõ (no source_url) | ⚠️ Không có provenance |

**6 quan hệ hiện có:**
| University ID | Major ID | Ghi chú |
|---------------|----------|---------|
| 6f55a016 | 42c1f3b7 (Khoa học máy tính) | Standard |
| 60f694f2 | 42c1f3b7 (Khoa học máy tính) | Standard |
| f9ab9226 | 2c0ebb60 (Kỹ thuật phần mềm) | Standard |
| a8cda78f | 99f53e9e (Kinh tế quốc tế) | Standard |
| 9944d89e | 3db078da (Quản trị kinh doanh) | Standard |
| 33ba9312 (RMIT) | 3db078da (Quản trị kinh doanh) | International |

---

## 5. Data Provenance Status

| Vấn đề | Chi tiết |
|--------|---------|
| Phase 16 Migration | DISABLED — tất cả các cột provenance mới đã KHÔNG được apply |
| `source` column trên `universities` | EXISTS (từ migration cũ hơn) nhưng NULL cho tất cả 31 trường |
| `source_url` column trên `universities` | EXISTS nhưng NULL cho tất cả 31 trường |
| `verified_by` trên `universities` | EXISTS nhưng NULL |
| `is_production_eligible` | FALSE cho tất cả — đây là flag block production |
| Column `website` trên `universities` | ❌ KHÔNG TỒN TẠI trong schema hiện tại |
| `university_majors` provenance | Không có source_url hay verification |

---

## 6. UI/UX Status

| Trang | Render | Empty State | Error State | Mobile | CTA hoạt động |
|-------|--------|-------------|-------------|--------|----------------|
| `/me/bao-cao` | ✅ | ⚠️ Cần kiểm tra | ⚠️ Chưa test | ⚠️ Chưa test | ⚠️ Link /explore hoạt động, nhưng Field detail trống |
| `/explore` | ✅ | ⚠️ Có text | ⚠️ Chưa test | ⚠️ Chưa test | ✅ |
| `/explore/[slug]` | ✅ | ❌ Không có empty state hợp lý | ⚠️ Chưa test | ⚠️ Chưa test | ❌ Không có Major để navigate |
| `/majors/[slug]` | ✅ | ⚠️ Có text | ⚠️ Chưa test | ⚠️ Chưa test | ❌ Hầu hết không có Uni |
| `/universities/[slug]` | ✅ | ⚠️ Có text | ⚠️ Chưa test | ⚠️ Chưa test | ⚠️ Button "Add goal" chưa verify |
| `/goal` | ✅ | ✅ CTA → /explore | ⚠️ Chưa test | ⚠️ Chưa test | ✅ |
| `/roadmap` | ⚠️ Chưa test với data MVP | ⚠️ Chưa test | ⚠️ Chưa test | ⚠️ Chưa test | ⚠️ Chưa test |

---

## 7. P0 Blockers (Chặn flow hoàn toàn)

1. **🔴 `majors.field_id` = NULL cho 50/50 ngành**
   - Luồng Field → Major bị đứt gãy.
   - `/explore/[slug]` hiển thị "Không có ngành" cho tất cả 10 lĩnh vực.
   - **Fix:** Apply mapping từ `FIELD_MAJOR_TAXONOMY.md` vào DB sau khi CTO phê duyệt.

2. **🔴 Chỉ có 6 quan hệ Uni-Major**
   - `/majors/[slug]` hiển thị "Không có trường" cho 46/50 ngành.
   - **Fix:** Cần curate tối thiểu 30-50 quan hệ thật từ nguồn chính thức.

3. **🔴 Column `website` không tồn tại trong `universities`**
   - UI university page không thể hiển thị website.
   - **Fix:** Tạo migration nhỏ thêm column `website text`.

---

## 8. P1 Improvements (Cần nhưng không chặn)

1. `logo_url` cho 31 trường — cần URL ảnh thật từ nguồn chính thức.
2. `description` cho 50 majors — hiện tất cả NULL.
3. `description` cho 31 universities — hiện tất cả NULL.
4. RIASEC mapping cho Fields — cần review bởi chuyên gia tư vấn hướng nghiệp.
5. `is_production_eligible` = TRUE cho các trường đã verify.
6. Mobile responsiveness cho tất cả các trang.
7. Error & Loading states cho tất cả trang.

---

## 9. Những gì đã Verified (Thực tế có thể tin)

| Dữ liệu | Mức độ tin cậy |
|---------|---------------|
| Tên 50 Majors | ✅ Tên tiếng Việt chuẩn của ngành học |
| Slug 50 Majors | ✅ Không có duplicate |
| Tên 31 Universities | ✅ Tên chính thức |
| Short name (code) 31 Universities | ✅ Chính xác |
| Slug 31 Universities | ✅ Không có duplicate |
| Location_city 31 Universities | ✅ Chính xác |
| Type (public/private/international) | ✅ Chính xác |
| 10 Fields — tên và slug | ✅ |
| Assessment engine (RIASEC, Big Five) | ✅ Đang chạy tốt |

---

## 10. Những gì chỉ là Seed/Demo/Heuristic

| Dữ liệu | Trạng thái |
|---------|-----------|
| RIASEC mapping cho 10 Fields | ⚠️ Heuristic — chưa verify chuyên môn |
| Field Recommendation logic | ⚠️ Simple scoring — chưa validate accuracy |
| 6 quan hệ Uni-Major hiện tại | ⚠️ Không có source_url |
| RIASEC descriptions trong report | ✅ Dựa trên lý thuyết Holland |

---

## Kết luận và Thứ tự Hành động P0

```
BLOCKER 1: Apply Field → Major mapping (FIELD_MAJOR_TAXONOMY.md)
           ⟶ Hỏi CTO: Phê duyệt taxonomy không? Schema 1:1 là đủ cho MVP?
           ⟶ Nếu approved: write SQL UPDATE statements vào DB

BLOCKER 2: Thêm column `website` vào `universities`
           ⟶ 1 migration nhỏ, không rủi ro

BLOCKER 3: Curate tối thiểu University-Major relations thật
           ⟶ Mỗi trường cần ít nhất 3-5 ngành thật
           ⟶ Nguồn: website chính thức từng trường
           ⟶ Cần làm thủ công hoặc có tool

Sau khi P0 xong:
⟶ Test E2E flow với 1 học sinh thật
⟶ Kiểm tra từng trang với dữ liệu thật
⟶ Báo cáo lại
```
