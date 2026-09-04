# UNIVERSITY MAJOR CONTRACT V1.0

## 1. Overview
- **Dataset:** university_major
- **Schema Version:** UNIVERSITY-MAJOR-V1.0
- **Purpose:** Định nghĩa ánh xạ: Trường đại học X có đào tạo ngành Y.

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `university_code` | string | YES | Must exist in `universities`| Mã trường |
| `major_code` | string | YES | Must exist in `majors` | Mã ngành |
| `program_name_vi` | string | NO | - | Tên chương trình đào tạo cụ thể (vd: Hệ chuẩn, Chất lượng cao) |
| `degree_level` | string | NO | - | Cấp bằng (Cử nhân/Kỹ sư) |
| `admission_year` | number | NO | e.g. 2024 | Năm tuyển sinh được ghi nhận |

## 3. Provenance Requirements
- Chỉ tạo ánh xạ nếu có evidence từ Website tuyển sinh của trường hoặc Đề án tuyển sinh chính thức.
- KHÔNG suy diễn: "Bách Khoa chắc chắn dạy CNTT nên cứ map vào". Phải có nguồn.

## 4. Perplexity / LLM Search Rules
- Foreign keys phải trùng khớp với dữ liệu đã thu thập ở Batch trước.

## 5. JSON Output Schema
```json
{
  "dataset": "university_major",
  "schema_version": "UNIVERSITY-MAJOR-V1.0",
  "records": [
    {
      "university_code": "",
      "major_code": "",
      "program_name_vi": "",
      "degree_level": "",
      "admission_year": null,
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
