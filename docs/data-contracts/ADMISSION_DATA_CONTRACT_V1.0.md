# ADMISSION DATA CONTRACT V1.0

## 1. Overview
- **Dataset:** admission_data
- **Schema Version:** ADMISSION-DATA-V1.0
- **Purpose:** Điểm chuẩn, thông tin tuyển sinh thực tế (lịch sử) của các trường đại học theo ngành.

## 2. Field Specifications

| Field | DataType | Required | Allowed Values / Validation | Description |
|-------|----------|----------|-----------------------------|-------------|
| `university_code` | string | YES | Must exist in `universities`| Mã trường |
| `major_code` | string | YES | Must exist in `majors` | Mã ngành |
| `admission_year` | number | YES | e.g. 2023, 2024 | Năm tuyển sinh |
| `admission_method_code` | string | YES | "THPT", "DGNL", "DGTD", "OTHER" | Mã phương thức tuyển sinh chuẩn hóa. |
| `admission_method_name` | string | NO | - | Tên chi tiết của phương thức (nếu cần thiết). |
| `score` | number | YES | >= 0 | Mức điểm chuẩn |
| `score_scale` | string | YES | "30", "1200", "40", "100" | Thang điểm chuẩn |
| `score_type` | string | YES | "HISTORICAL_ACTUAL" | Phải là điểm đã chốt công bố. Không dùng điểm dự kiến. |

## 3. Provenance Requirements
- Nguồn: Thông cáo báo chí, website chính thức của trường về Điểm chuẩn năm học, hoặc Bộ GD&ĐT.
- **KHÔNG** lấy dữ liệu từ các diễn đàn thảo luận, dự đoán.

## 4. Perplexity / LLM Search Rules
- Chỉ ghi nhận dữ liệu nếu chắc chắn là điểm chuẩn trúng tuyển thực tế (HISTORICAL_ACTUAL). Bất kỳ loại điểm dự kiến/benchmark nào khác đều bỏ qua.
- **TUYỆT ĐỐI KHÔNG** dùng văn bản tự do cho phương thức tuyển sinh. Phải map đúng vào `admission_method_code` ("THPT" = xét điểm tốt nghiệp THPT, "DGNL" = thi đánh giá năng lực ĐHQG, "DGTD" = đánh giá tư duy ĐHBK, "OTHER" = phương thức khác). 
- Các thang điểm khác nhau phải có `score_scale` khác nhau. Không gộp chung.

## 5. JSON Output Schema
```json
{
  "dataset": "admission_data",
  "schema_version": "ADMISSION-DATA-V1.0",
  "records": [
    {
      "university_code": "",
      "major_code": "",
      "admission_year": 0,
      "admission_method_code": "",
      "admission_method_name": "",
      "score": null,
      "score_scale": "",
      "score_type": "HISTORICAL_ACTUAL",
      "source": {
        "name": "",
        "url": "",
        "evidence": ""
      }
    }
  ]
}
```
