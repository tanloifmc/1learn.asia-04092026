# MAJOR DATA CONTRACT V1.0

## 1. Overview
- **Dataset:** majors
- **Schema Version:** MAJOR-DATA-V1.0
- **Purpose:** Core backbone storing accurate, verified academic major information.

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `major_code` | string | YES | Unique, Uppercase | Mã ngành theo quy định (vd: của Bộ GD&ĐT) |
| `major_name_vi` | string | YES | Non-empty | Tên ngành tiếng Việt |
| `major_name_en` | string | NO | - | Tên ngành tiếng Anh (nếu có) |
| `field_name_vi` | string | YES | - | Lĩnh vực/Nhóm ngành |
| `description_vi` | string | YES | Non-empty | Tổng quan về chương trình học |

## 3. Provenance Requirements
- Nguồn ưu tiên: Cổng thông tin Bộ GD&ĐT, danh mục giáo dục quốc gia, website chính thức của các trường đại học lớn.
- Bắt buộc phải có `source.url` và `source.evidence`. Không tự chế tên ngành.

## 4. Perplexity / LLM Search Rules
- Không bịa mã ngành (major_code). Nếu ngành mới không có mã chính thức, cần ghi chú rõ trong `evidence` và dùng Tên viết tắt.
- Chỉ tạo JSON theo đúng schema. Nếu thiếu thông tin, dùng `null`.

## 5. JSON Output Schema
```json
{
  "dataset": "majors",
  "schema_version": "MAJOR-DATA-V1.0",
  "records": [
    {
      "major_code": "",
      "major_name_vi": "",
      "major_name_en": "",
      "field_name_vi": "",
      "description_vi": "",
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
