# Sprint A — UI Function Matrix

This matrix ensures that every screen in Sprint A connects visible UI functions to real backend data and answers "Where am I?", "What does this mean?", and "What do I do next?".

| Screen | User Goal | Visible Functions | Data Source | Primary CTA | Secondary Actions | States | Status |
| ------ | --------- | ----------------- | ----------- | ----------- | ----------------- | ------ | ------ |
| **A2: Homepage** (`/`) | Understand the product value & convert to user. | 1. Hero Mockup<br>2. 4-step Journey visual<br>3. Capabilities map<br>4. Trust signals | N/A (Marketing Copy) | "Bắt đầu khám phá" | "Dành cho phụ huynh" | Desktop, Mobile, Hover states | TODO |
| **A3: Student Home** (`/home`) | Know what to do today ("My Future Home"). | 1. Current Goal Card<br>2. ONE Top Priority<br>3. Exploring Directions<br>4. Journey Progress | `profiles`, `student_goals`, `roadmap_tasks`, `career_matches` | Complete Priority Task | Change Goal, Go to Journey | Loading, Empty (No Goal), Empty (No Assessment) | TODO |
| **A4: Personal Report** (`/me/bao-cao`) | Understand assessment results in 20 seconds, then deep dive. | 1. Report Summary Card (20s read)<br>2. 10 Structured Sections (Who are you, Strengths, Work style, Values, Environment, Gaps, Careers, Reasons, Missing Data, Next Steps) | `assessment_responses`, `career_matches`, `match_explanations` | "Khám phá và so sánh" | "Lưu báo cáo" | Loading, Error (No Assessment), Print view | TODO |
