# CAREER DATA CONTRACT V1.0

## 1. Overview
- **Dataset:** careers
- **Schema Version:** CAREER-DATA-V1.0
- **Purpose:** Core backbone storing accurate, verified career information.

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `career_code` | string | YES | Unique, Uppercase, Immutable | Mã định danh nội bộ ổn định (canonical internal identifier). Tuyệt đối không thay đổi giữa các đợt cập nhật. KHÔNG tự tạo mã nếu nguồn cung cấp mã chuẩn. Nếu nguồn có official occupation code, có thể lưu riêng, nhưng `career_code` phải deterministic. |
| `career_name_vi` | string | YES | Non-empty | Tên tiếng Việt của nghề |
| `career_name_en` | string | NO | - | Tên tiếng Anh (nếu có) |
| `description_vi` | string | YES | Non-empty | Mô tả tổng quan về nghề |
| `tasks_vi` | array[string] | YES | Min length: 1 | Danh sách các công việc thường ngày |
| `skills_required` | array[string] | YES | Min length: 1 | Kỹ năng cứng & mềm yêu cầu |
| `riasec_code` | string | NO | Length: 3 (R,I,A,S,E,C) | Mã Holland (Chỉ điền nếu nguồn có sẵn độ tin cậy cao). Tuyệt đối KHÔNG tự suy diễn từ tên nghề. Nếu không có nguồn đáng tin, gán `null`. |

## 3. Provenance Requirements
Tất cả các bản ghi bắt buộc phải cung cấp block `source` bao gồm:
- `name`: Tên nguồn (vd: ILO, Tổng cục Giáo dục Nghề nghiệp, O*NET...)
- `url`: URL trỏ tới trang web cung cấp thông tin (bắt buộc phải hợp lệ)
- `publisher`: Tổ chức phát hành
- `retrieved_at`: ISO 8601 Timestamp thời điểm thu thập
- `evidence`: Trích dẫn hoặc bằng chứng để có thể audit chéo.

## 4. Perplexity / LLM Search Rules
- **No Hallucination:** Nếu một trường không có trên nguồn tham chiếu, gán giá trị `null` hoặc array rỗng `[]`. Tuyệt đối không tự sáng tác.
- **Priority:** Ưu tiên nguồn chính thống (Chính phủ, Bộ ban ngành, tổ chức quốc tế lớn).
- **Format:** Output trả về phải tuân thủ nghiêm ngặt JSON schema quy định bên dưới.

## 5. JSON Output Schema
```json
{
  "dataset": "careers",
  "schema_version": "CAREER-DATA-V1.0",
  "source": {
    "name": "",
    "url": "",
    "publisher": "",
    "retrieved_at": "",
    "published_at": ""
  },
  "records": [
    {
      "career_code": "",
      "career_name_vi": "",
      "career_name_en": "",
      "description_vi": "",
      "tasks_vi": [],
      "skills_required": [],
      "riasec_code": null,
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
