# REPORT DATA SPECIFICATION

*Ngày thực hiện: 31/08/2026*

## 1. MỤC TIÊU & KIẾN TRÚC
> **[DECIDED] Nguyên tắc:** Báo cáo khám phá bản thân (`Report`) KHÔNG PHẢI là một chuỗi văn bản (String) hay một bài blog do AI viết liền mạch. Nó phải là một **Hồ sơ hướng nghiệp có cấu trúc chặt chẽ (Structured Data Model)** được thiết kế hoàn chỉnh trước khi đổ vào giao diện UI. 

## 2. DATA MODEL CỦA REPORT (THE REPORT CONTRACT)
Dưới đây là cấu trúc JSON/TypeScript Model bắt buộc cho mọi báo cáo (Phase 1):

```typescript
interface CareerDiscoveryReport {
  student_id: string;
  report_date: string;
  meta: {
    data_sources: string[]; // VD: ["1learn_career_exploration"]
    reliability_level: "high" | "medium" | "low"; 
  };

  // 1. Tóm tắt chân dung
  executive_summary: {
    title: string; // VD: "Người Khám phá - Phân tích"
    short_description: string;
  };

  // 2. Tự nhận thức (Self Profile)
  self_profile: {
    // 3. Sở thích nghề nghiệp
    interest_profile: {
      primary_traits: TraitDetail[]; // Dựa trên RIASEC
      secondary_traits: TraitDetail[];
    };
    
    // 4. Đặc điểm cá nhân / Cách làm việc
    personality_profile: {
      working_style: string; // Dựa trên Big Five
      interaction_style: string;
    };

    // 5. Giá trị nghề nghiệp
    work_values: {
      top_values: TraitDetail[]; // VD: Tự chủ, Thành tựu
    };
  };

  // 6 & 7. Phân tích SWOT cá nhân
  analysis: {
    strengths: string[];
    development_areas: string[]; // Watch-outs
    suitable_environments: string[]; // VD: "Môi trường công nghệ cao", "Độc lập"
  };

  // 8 & 9. Gợi ý Nghề nghiệp
  career_recommendations: {
    career_themes: string[]; // Nhóm lĩnh vực (VD: Công nghệ thông tin)
    recommended_careers: CareerItem[]; // Nghề cụ thể (Từ Matching Engine Tầng 1 & 2)
  };

  // 10 & 11. Gợi ý Ngành & Trường
  academic_recommendations: {
    recommended_majors: MajorItem[];
    universities_exploration: UniversityItem[];
  };

  // 12 & 13. Kế hoạch hành động
  action_plan: {
    suggested_goals: GoalItem[];
    next_steps: TaskItem[];
  };
}
```

## 3. LUỒNG SINH BÁO CÁO (THE REPORT GENERATION FLOW)
> **[DECIDED] AI chỉ là bước cuối cùng (The Writer, not the Thinker).**

1. **Thu thập Profile:** Lấy `profile_features` của học sinh (đã hợp nhất ở Spec 3).
2. **Deterministic Interpretation:** Đẩy Profile qua Rule Engine (Spec 4) để lấy ra các Insights, Strengths, Watch-outs cố định.
3. **Structing Data:** Lắp ghép các Insights vào Model `CareerDiscoveryReport` (Đã được định dạng JSON ở trên).
4. **AI Generation (Optional Layer):** 
   - Đưa Object `executive_summary` và `self_profile` cho AI.
   - Trả về đoạn văn mượt mà cho UI.
   - *Lưu ý:* Các danh sách nghề nghiệp (`recommended_careers`), trường, ngành **KHÔNG ĐƯỢC PHÉP ĐƯA QUA AI VIẾT LẠI**. Nó phải được đổ trực tiếp từ Database ra thẳng UI để đảm bảo tính tuyệt đối chính xác (100% Fact-based).
