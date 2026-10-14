/**
 * Domain metric: Goal Readiness
 *
 * This metric is intentionally fail-closed. It measures only requirements for
 * the active roadmap target that have a compatible, recorded student score.
 * A missing score is missing evidence, not a zero and not an unmet result.
 */

import { createClient } from "@/lib/supabase/server";

const IMPORTANCE_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 2,
  medium: 1,
  low: 0.5,
};

const REQUIREMENT_SUBJECT_CODES: Record<string, string> = {
  academic_math: "toan",
  academic_math_grade12: "toan",
  academic_physics: "ly",
  academic_chemistry: "hoa",
  academic_biology: "sinh",
  academic_literature: "van",
  academic_english: "anh",
  academic_history: "su",
  academic_geography: "dia",
};

export type GoalReadinessResult =
  | { score: number; met: number; total: number; gaps: GoalGap[] }
  | { score: null; reason: "no_goal" | "no_requirements" | "insufficient_evidence" };

export interface GoalGap {
  requirement_code: string;
  label: string;
  importance: string;
  student_value: number;
  required_value: number;
  is_met: boolean;
}

function requiredGrade(requirementCode: string): number | null {
  const match = /_grade(9|10|11|12)$/.exec(requirementCode);
  return match ? Number(match[1]) : null;
}

/** Calculates a weighted readiness score only when every target requirement is measurable. */
export async function getGoalReadiness(studentId: string): Promise<GoalReadinessResult> {
  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("student_goals")
    .select("career_id")
    .eq("student_id", studentId)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();
  if (!goal) return { score: null, reason: "no_goal" };

  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("target_program_id, target_career_id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();
  const target = roadmap?.target_program_id
    ? { type: "university_major", id: roadmap.target_program_id }
    : roadmap?.target_career_id || goal.career_id
      ? { type: "career", id: roadmap?.target_career_id ?? goal.career_id! }
      : null;
  if (!target) return { score: null, reason: "no_requirements" };

  const { data: requirements } = await supabase
    .from("target_requirements")
    .select("requirement_code, requirement_type, requirement_value, unit, importance")
    .eq("target_type", target.type)
    .eq("target_id", target.id)
    .in("status", ["verified", "published"])
    .eq("is_production_eligible", true);
  if (!requirements?.length) return { score: null, reason: "no_requirements" };

  const { data: academics } = await supabase
    .from("academic_records")
    .select("subject_code, grade_level, score, max_score")
    .eq("student_id", studentId)
    .not("score", "is", null)
    .not("max_score", "is", null);
  if (!academics?.length) return { score: null, reason: "insufficient_evidence" };

  const gaps: GoalGap[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const requirement of requirements) {
    if (requirement.requirement_type !== "academic") {
      return { score: null, reason: "insufficient_evidence" };
    }
    const subjectCode = REQUIREMENT_SUBJECT_CODES[requirement.requirement_code];
    if (!subjectCode) return { score: null, reason: "insufficient_evidence" };
    const grade = requiredGrade(requirement.requirement_code);
    const record = academics.find(
      (academic) =>
        academic.subject_code?.toLowerCase() === subjectCode &&
        (grade === null || academic.grade_level === grade) &&
        academic.score !== null &&
        academic.max_score !== null &&
        academic.max_score > 0,
    );
    if (!record) return { score: null, reason: "insufficient_evidence" };

    const studentValue = (Number(record.score) / Number(record.max_score)) * 10;
    const requiredValue = Number(requirement.requirement_value);
    if (!Number.isFinite(requiredValue)) return { score: null, reason: "insufficient_evidence" };
    const isMet = studentValue >= requiredValue;
    const weight = IMPORTANCE_WEIGHTS[requirement.importance] ?? 1;
    totalWeight += weight;
    if (isMet) weightedSum += weight;
    gaps.push({
      requirement_code: requirement.requirement_code,
      label: requirement.requirement_code,
      importance: requirement.importance,
      student_value: studentValue,
      required_value: requiredValue,
      is_met: isMet,
    });
  }

  return {
    score: Math.round((weightedSum / totalWeight) * 100),
    met: gaps.filter((gap) => gap.is_met).length,
    total: gaps.length,
    gaps: gaps.sort((left, right) => {
      if (left.is_met !== right.is_met) return left.is_met ? 1 : -1;
      return (IMPORTANCE_WEIGHTS[right.importance] ?? 1) - (IMPORTANCE_WEIGHTS[left.importance] ?? 1);
    }),
  };
}
