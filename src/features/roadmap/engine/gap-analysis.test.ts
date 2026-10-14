import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { GapAnalysisEngine, StudentState } from "./gap-analysis";
import { TargetRequirement } from "./requirement-engine";

const studentState = {
  profile: {
    id: randomUUID(),
    grade: 12,
    birth_year: 2008,
    gender: null,
    region: "Hà Nội",
    study_location_pref: "near",
    family_support_level: 3,
    onboarding_step: 5,
    onboarding_completed_at: "2026-09-23T00:00:00.000Z",
    updated_at: "2026-09-23T00:00:00.000Z",
  },
  academicRecords: [],
} as StudentState;

function requirement(overrides: Partial<TargetRequirement>): TargetRequirement {
  return {
    id: randomUUID(),
    target_type: "university_major",
    target_id: randomUUID(),
    requirement_code: "ielts_academic_overall",
    requirement_type: "certification",
    comparison_operator: ">=",
    requirement_value: "6.5",
    unit: "IELTS",
    importance: "critical",
    satisfaction_group: null,
    status: "published",
    source: "Official admission source",
    source_url: "https://example.edu/admission",
    last_verified_at: "2026-09-23T00:00:00.000Z",
    created_at: "2026-09-23T00:00:00.000Z",
    is_production_eligible: true,
    ...overrides,
  };
}

describe("GapAnalysisEngine alternative target requirements", () => {
  it("creates one unresolved gap for a group of alternative credentials", () => {
    const requirements = [
      requirement({ satisfaction_group: "rmit-english-admission-v1" }),
      requirement({ requirement_code: "toefl_ibt", requirement_value: "79", unit: "TOEFL_iBT", satisfaction_group: "rmit-english-admission-v1" }),
    ];

    const gaps = new GapAnalysisEngine().analyze(requirements, studentState);

    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({ hasGap: true, alternatives: requirements });
  });

  it("does not duplicate independently required academic requirements", () => {
    const gpa = requirement({ requirement_code: "academic_gpa_grade12", requirement_type: "academic", requirement_value: "7.0", unit: "score_10", importance: "high" });
    const alternatives = [
      requirement({ satisfaction_group: "rmit-english-admission-v1" }),
      requirement({ requirement_code: "toefl_ibt", requirement_value: "79", unit: "TOEFL_iBT", satisfaction_group: "rmit-english-admission-v1" }),
    ];

    const gaps = new GapAnalysisEngine().analyze([gpa, ...alternatives], studentState);

    expect(gaps).toHaveLength(2);
    expect(gaps.find((gap) => gap.requirement.id === gpa.id)?.alternatives).toBeUndefined();
    expect(gaps.find((gap) => gap.alternatives)?.alternatives).toHaveLength(2);
  });
});
