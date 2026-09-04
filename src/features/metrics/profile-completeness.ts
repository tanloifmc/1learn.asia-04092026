/**
 * Domain metric: Profile Completeness
 *
 * "Hồ sơ của học sinh đã đầy đủ đến đâu?"
 *
 * Sử dụng WEIGHTED domain scoring với re-normalization:
 * - Các domain chưa có trong hệ thống (ví dụ: experience ở Phase sau)
 *   sẽ bị loại khỏi mẫu số để học sinh vẫn có thể đạt 100%.
 *
 * Domain weights (khi active):
 *   basic      = 15%  → student_profiles: grade, region đã điền
 *   academic   = 25%  → academic_records: ít nhất 3 môn
 *   interests  = 15%  → student_interests: ít nhất 3 sở thích
 *   assessment = 25%  → assessment_results: is_current = true
 *   goals      = 10%  → student_goals: 1 active goal
 *   experience = 10%  → CHƯA ACTIVE → loại khỏi phép tính
 *
 * Đây là SOURCE OF TRUTH duy nhất cho Profile Completeness.
 */

import { createClient } from "@/lib/supabase/server";

interface DomainConfig {
  key: string;
  weight: number;
  active: boolean; // false = domain chưa tồn tại trong hệ thống
}

const DOMAINS: DomainConfig[] = [
  { key: "basic", weight: 15, active: true },
  { key: "academic", weight: 25, active: true },
  { key: "interests", weight: 15, active: true },
  { key: "assessment", weight: 25, active: true },
  { key: "goals", weight: 10, active: true },
  { key: "experience", weight: 10, active: false }, // Phase sau
];

export interface ProfileCompletenessResult {
  score: number;        // 0–100, đã re-normalized
  domains: Record<string, { completed: boolean; label: string }>;
  missingDomains: string[];
}

export async function getProfileCompleteness(
  studentId: string
): Promise<ProfileCompletenessResult> {
  const supabase = await createClient();

  // Fetch tất cả cùng lúc
  const [profile, academics, interests, assessment, goals] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("grade, region")
      .eq("id", studentId)
      .maybeSingle()
      .then((r) => r.data),

    supabase
      .from("academic_records")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .then((r) => (r.count ?? 0) >= 3),

    supabase
      .from("student_interests")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .then((r) => (r.count ?? 0) >= 3),

    supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_current", true)
      .then((r) => (r.count ?? 0) >= 1),

    supabase
      .from("student_goals")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("status", "active")
      .then((r) => (r.count ?? 0) >= 1),
  ]);

  const domainCompleted: Record<string, boolean> = {
    basic: Boolean(profile?.grade && profile?.region),
    academic: academics,
    interests: interests,
    assessment: assessment,
    goals: goals,
    experience: false, // domain chưa active
  };

  // Re-normalize: chỉ tính các domain đang active
  const activeDomains = DOMAINS.filter((d) => d.active);
  const totalActiveWeight = activeDomains.reduce((sum, d) => sum + d.weight, 0);

  let earnedWeight = 0;
  const domainResults: Record<string, { completed: boolean; label: string }> = {};
  const missingDomains: string[] = [];

  const DOMAIN_LABELS: Record<string, string> = {
    basic: "Thông tin cơ bản",
    academic: "Điểm học tập",
    interests: "Sở thích",
    assessment: "Bài khám phá bản thân",
    goals: "Mục tiêu nghề nghiệp",
    experience: "Kinh nghiệm thực tế",
  };

  for (const domain of activeDomains) {
    const completed = domainCompleted[domain.key] ?? false;
    domainResults[domain.key] = { completed, label: DOMAIN_LABELS[domain.key] };
    if (completed) {
      earnedWeight += domain.weight;
    } else {
      missingDomains.push(domain.key);
    }
  }

  const score = Math.round((earnedWeight / totalActiveWeight) * 100);

  return { score, domains: domainResults, missingDomains };
}
