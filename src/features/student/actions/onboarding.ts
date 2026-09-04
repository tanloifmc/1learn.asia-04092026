"use server";

import { createClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/analytics/server";

export async function saveOnboardingStep1Action(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const grade = Number(formData.get("grade"));
  const region = String(formData.get("region"));

  const { error } = await supabase
    .from("student_profiles")
    .upsert({
      id: user.id,
      grade,
      region,
      onboarding_step: 2
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function saveOnboardingStep2Action(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const strongSubjects = String(formData.get("strong_subjects")).split(",");
  const weakSubjects = String(formData.get("weak_subjects")).split(",");
  const gpaRange = String(formData.get("gpa_range"));

  // Delete old records first
  await supabase.from("academic_records").delete().eq("student_id", user.id);

  // Get student's actual grade from profile (saved in step 1)
  const { data: profile } = await supabase.from("student_profiles").select("grade").eq("id", user.id).single();
  const actualGrade = profile?.grade || 10; // Fallback only if missing in DB

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const records = [
    ...strongSubjects.filter(Boolean).map(sub => ({ 
      student_id: user.id, 
      subject: sub.trim(), 
      subject_code: sub.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
      performance_level: "strong", 
      gpa_range: gpaRange,
      semester: 'full',
      academic_year: academicYear,
      grade_level: actualGrade
    })),
    ...weakSubjects.filter(Boolean).map(sub => ({ 
      student_id: user.id, 
      subject: sub.trim(),
      subject_code: sub.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
      performance_level: "weak", 
      gpa_range: gpaRange,
      semester: 'full',
      academic_year: academicYear,
      grade_level: actualGrade
    }))
  ];

  if (records.length > 0) {
    const { error } = await supabase.from("academic_records").insert(records);
    if (error) return { success: false, error: error.message };
  }

  await supabase.from("student_profiles").update({ onboarding_step: 3 }).eq("id", user.id);
  return { success: true };
}

export async function saveOnboardingStep3Action(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const interests = String(formData.get("interest_areas")).split(",");

  await supabase.from("student_interests").delete().eq("student_id", user.id);

  const records = interests.filter(Boolean).map(area => ({
    student_id: user.id,
    interest_area: area.trim(),
    interest_name: area.trim(),
    interest_level: 5,
    intensity: 5,
    source: 'self_report'
  }));

  if (records.length > 0) {
    const { error } = await supabase.from("student_interests").insert(records);
    if (error) return { success: false, error: error.message };
  }

  await supabase.from("student_profiles").update({ onboarding_step: 4 }).eq("id", user.id);
  return { success: true };
}

export async function saveOnboardingStep4Action(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const studyLocation = String(formData.get("study_location_pref"));
  const familySupport = Number(formData.get("family_support_level"));

  const { error } = await supabase
    .from("student_profiles")
    .update({
      study_location_pref: studyLocation,
      family_support_level: familySupport,
      onboarding_step: 5,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  // Fetch the grade that was set in step 1
  const { data: sp } = await supabase.from("student_profiles").select("grade").eq("id", user.id).single();
  await trackServerEvent("ONBOARDING_COMPLETED", {
    grade_level: sp?.grade ? String(sp.grade) : "unknown",
    has_interests: true
  }, user.id);

  return { success: true };
}
