# Vietnamese UI Copy Audit

## 1. Overview
The current application contains inconsistent Vietnamese terminology, missing diacritics in some generated components, and occasional English labels in the student/parent interfaces. This audit outlines the required corrections to ensure a native, high-quality Vietnamese user experience.

## 2. Terminology Standardization
To maintain consistency across the product, the following standard terminology MUST be used:

| Incorrect / Inconsistent | Standardized Term (MANDATORY) |
| ------------------------ | ----------------------------- |
| Bao cao ca nhan, Báo cáo | **Báo cáo cá nhân** |
| Kham pha ban than, Test | **Khám phá bản thân** |
| Muc tieu, Goal | **Mục tiêu** |
| Lo trinh, Roadmap, Task | **Hành trình** / **Nhiệm vụ** |
| Tien do, Progress | **Tiến độ** |
| Diem manh, Strength | **Điểm mạnh** |
| Dieu can phat trien, Gaps| **Điều cần phát triển** |
| Kha nang dau vao | **Khả năng đầu vào** |
| Muc do phu hop, Fit | **Mức độ phù hợp** |
| Nganh hoc, Major | **Ngành học** |
| Truong dai hoc, Uni | **Trường đại học** |
| Nghe nghiep, Career | **Nghề nghiệp** |

## 3. Font and Typography Rules
- **Font**: `Be Vietnam Pro` must be used for all UI text to ensure full support for Vietnamese diacritics and correct line heights.
- **Capitalization**: Do NOT use CSS `text-transform: uppercase` indiscriminately, as it can cause rendering issues with Vietnamese accents if the font weights/glyphs are not fully optimized in certain browsers. Use natural casing where possible.
- **English Labels**: No English labels (e.g., "Submit", "Back", "Next", "Dashboard") are allowed in the Student or Parent flows. They must be translated to "Xác nhận", "Quay lại", "Tiếp tục", "Tổng quan".

## 4. Action Plan
During the rebuild phase, every screen will be checked against this vocabulary matrix. Any hardcoded English strings or unaccented Vietnamese strings will be replaced immediately.
