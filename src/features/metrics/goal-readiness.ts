/**
 * Domain metric: Goal Readiness
 *
 * "Em đang đáp ứng yêu cầu mục tiêu đến đâu?"
 *
 * Nguồn dữ liệu:
 *   - target_requirements (requirement_code, importance, requirement_value)
 *   - academic_records    (subject_code, score, max_score)
 *
 * Công thức: Weighted readiness
 *   readiness = Σ(weight_i × met_i) / Σ(weight_i) × 100
 *
 * Trọng số theo importance:
 *   critical = 4
 *   high     = 2
 *   medium   = 1
 *   low      = 0.5
 *
 * Khi không đủ dữ liệu (academic_records trống hoặc requirements trống):
 *   → trả về { score: null, reason: 'insufficient_data' }
 *
 * Đây là SOURCE OF TRUTH duy nhất cho Goal Readiness.
 * Không tính lại công thức này ở bất kỳ React component nào.
 */

import { createClient } from "@/lib/supabase/server";

const IMPORTANCE_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 2,
  medium: 1,
  low: 0.5,
};

export type GoalReadinessResult =
  | { score: number; met: number; total: number; gaps: GoalGap[] }
  | { score: null; reason: "no_requirements" | "no_academic_data" | "no_goal" };

export interface GoalGap {
  requirement_code: string;
  label: string;
  importance: string;
  student_value: number | null;
  required_value: number;
  is_met: boolean;
}

/**
 * Tính Goal Readiness cho mục tiêu chính của học sinh.
 * Tổng hợp requirements của Career + Major + University (khi goal đầy đủ).
 */
export async function getGoalReadiness(studentId: string): Promise<GoalReadinessResult> {
  const supabase = await createClient();

  // Lấy primary active goal
  const { data: goal } = await supabase
    .from("student_goals")
    .select("career_id, major_id, university_id")
    .eq("student_id", studentId)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();

  if (!goal) return { score: null, reason: "no_goal" };

  // Lấy requirements từ tất cả target đã có (career + major + university)
  const targetIds: Array<{ type: string; id: string }> = [];
  if (goal.career_id) targetIds.push({ type: "career", id: goal.career_id });
  if (goal.major_id) targetIds.push({ type: "major", id: goal.major_id });
  if (goal.university_id) targetIds.push({ type: "university", id: goal.university_id });

  if (targetIds.length === 0) return { score: null, reason: "no_requirements" };

  // Fetch requirements của từng target
  const requirementPromises = targetIds.map(({ type, id }) =>
    supabase
      .from("target_requirements")
      .select("requirement_code, requirement_value, importance, status")
      .eq("target_type", type)
      .eq("target_id", id)
      .eq("status", "active")
  );
  const requirementResults = await Promise.all(requirementPromises);
  const allRequirements = requirementResults.flatMap((r) => r.data ?? []);

  if (allRequirements.length === 0) return { score: null, reason: "no_requirements" };

  // Lấy academic records của học sinh
  const { data: academics } = await supabase
    .from("academic_records")
    .select("subject_code, score, max_score, performance_level")
    .eq("student_id", studentId);

  if (!academics || academics.length === 0) {
    return { score: null, reason: "no_academic_data" };
  }

  // Tính weighted readiness
  let weightedSum = 0;
  let totalWeight = 0;
  const gaps: GoalGap[] = [];

  for (const req of allRequirements) {
    const weight = IMPORTANCE_WEIGHTS[req.importance] ?? 1;
    totalWeight += weight;

    const record = academics.find(
      (a) => a.subject_code?.toLowerCase() === req.requirement_code?.toLowerCase()
    );

    const studentPct = record && record.max_score
      ? (record.score / record.max_score) * 100
      : null;
    const requiredPct = parseFloat(req.requirement_value);
    const isMet = studentPct !== null && studentPct >= requiredPct;

    weightedSum += isMet ? weight : 0;

    gaps.push({
      requirement_code: req.requirement_code,
      label: req.requirement_code, // Frontend có thể map sang tên tiếng Việt
      importance: req.importance,
      student_value: studentPct,
      required_value: requiredPct,
      is_met: isMet,
    });
  }

  const score = Math.round((weightedSum / totalWeight) * 100);

  return {
    score,
    met: gaps.filter((g) => g.is_met).length,
    total: allRequirements.length,
    gaps: gaps.sort((a, b) => {
      // Sắp xếp: unmet critical trước
      if (!a.is_met && b.is_met) return -1;
      if (a.is_met && !b.is_met) return 1;
      return (IMPORTANCE_WEIGHTS[b.importance] ?? 1) - (IMPORTANCE_WEIGHTS[a.importance] ?? 1);
    }),
  };
}
