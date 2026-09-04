# UNIVERSITY DATA CONTRACT V1.0

## 1. Overview
- **Dataset:** universities
- **Schema Version:** UNIVERSITY-DATA-V1.0
- **Purpose:** Thông tin về các cơ sở giáo dục đại học (trường đại học, học viện).

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `university_code` | string | YES | Unique | Mã trường chính thức (official institutional code). KHÔNG tự tạo mã nếu nguồn không cung cấp mã trường. |
| `university_name_vi` | string | YES | Non-empty | Tên trường tiếng Việt |
| `university_name_en` | string | NO | - | Tên trường tiếng Anh (nếu có) |
| `university_type` | string | YES | "Công lập", "Tư thục", "Quốc tế" | Loại hình trường |
| `location.province` | string | YES | - | Tỉnh/Thành phố trực thuộc Trung ương |
| `location.city` | string | NO | - | Thành phố trực thuộc tỉnh/Địa danh hành chính phù hợp. Tuyệt đối không đưa Quận/Huyện vào đây. Không tự biến district thành city. |
| `official_website` | string | YES | Valid URL | Trang web chính thức của trường |

## 3. Provenance Requirements
- Nguồn: Danh bạ các trường Đại học của Bộ GD&ĐT, hoặc chính website của trường.
- Bắt buộc kiểm tra mã trường (`university_code`) có đúng thực tế hay không. Không tự sinh mã ID ngẫu nhiên.

## 4. Perplexity / LLM Search Rules
- Tuyệt đối không sinh data ảo. 

## 5. JSON Output Schema
```json
{
  "dataset": "universities",
  "schema_version": "UNIVERSITY-DATA-V1.0",
  "records": [
    {
      "university_code": "",
      "university_name_vi": "",
      "university_name_en": "",
      "university_type": "",
      "location": {
        "province": "",
        "city": ""
      },
      "official_website": "",
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
