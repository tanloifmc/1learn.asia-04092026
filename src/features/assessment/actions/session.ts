"use server";

import { createClient } from "@/lib/supabase/server";
import { trackServerEvent } from "@/lib/analytics/server";

export async function startAssessmentSession(versionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if an active session already exists
  const { data: existingSession } = await supabase
    .from("assessment_sessions")
    .select("id")
    .eq("student_id", user.id)
    .eq("version_id", versionId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existingSession) {
    return { success: true, sessionId: existingSession.id };
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from("assessment_sessions")
    .insert({
      student_id: user.id,
      version_id: versionId,
      status: "in_progress"
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  await trackServerEvent('ASSESSMENT_STARTED', { assessment_version: versionId }, user.id);

  return { success: true, sessionId: newSession.id };
}

export async function saveAssessmentResponse(sessionId: string, questionId: string, value: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Note: RLS ensures that the student can only write to their own session.
  // The unique constraint on (session_id, question_id) handles idempotency via upsert.
  
  const { error } = await supabase
    .from("assessment_responses")
    .upsert({
      session_id: sessionId,
      question_id: questionId,
      response_value: value,
      response_json: { value }
    }, { onConflict: "session_id,question_id" });

  if (error) {
    console.error("Save response error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}
