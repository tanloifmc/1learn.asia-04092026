# CAREER TO MAJOR MAPPING CONTRACT V1.0

## 1. Overview
- **Dataset:** career_major_mapping
- **Schema Version:** CAREER-MAJOR-MAPPING-V1.0
- **Purpose:** Xây dựng cầu nối (Mapping) chuẩn xác giữa Nghề nghiệp và Ngành học.

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `career_code` | string | YES | Must exist in `careers` | Mã nghề |
| `major_code` | string | YES | Must exist in `majors` | Mã ngành học |
| `relation_type` | string | NO | "DIRECT", "RELATED", "ALTERNATIVE", or `null` | Mức độ trực tiếp của ngành học với nghề. Nếu nguồn KHÔNG ghi rõ mối quan hệ, bắt buộc để `null`. |

## 3. Provenance Requirements
Tuyệt đối không dùng LLM để "suy diễn" quan hệ. Phải lấy từ:
- Website hướng nghiệp chính thống (VD: ILO).
- Báo cáo thị trường lao động.
- Chương trình đào tạo chính thức (phần "Cơ hội việc làm").

## 4. Perplexity / LLM Search Rules
- **KHÔNG** tự gán trọng số (`priority`, `weight`). Hệ thống mặc định V1.0 sử dụng `MappingWeight = 1`.
- **KHÔNG** tự quyết định `relation_type` theo cảm tính. Nếu nguồn chỉ nói "phù hợp" chung chung mà không phân cấp, gán `relation_type = null`.
- Chỉ xuất ra mảng JSON mappings. 

## 5. JSON Output Schema
```json
{
  "dataset": "career_major_mapping",
  "schema_version": "CAREER-MAJOR-MAPPING-V1.0",
  "records": [
    {
      "career_code": "",
      "major_code": "",
      "relation_type": "",
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
