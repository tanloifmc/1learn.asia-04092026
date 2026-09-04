"use server";

import { createClient } from "@/lib/supabase/server";

export interface FieldRecommendation {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  matchScore: number;
  reason: string;
}

export async function getFieldRecommendations(studentId: string): Promise<FieldRecommendation[]> {
  const supabase = await createClient();

  // 1. Fetch latest assessment result to get RIASEC profile
  const { data: result } = await supabase
    .from("assessment_results")
    .select("id")
    .eq("student_id", studentId)
    .eq("is_current", true)
    .maybeSingle();

  let riasecTopCodes = "";
  if (result) {
    const { data: dimScores } = await supabase
      .from("assessment_result_dimensions")
      .select("score, assessment_dimensions(code, framework)")
      .eq("result_id", result.id)
      .order("score", { ascending: false });
    
    const riasec = (dimScores || []).filter(d => (d.assessment_dimensions as any).framework === "riasec");
    const topRiasec = riasec.slice(0, 3).map(r => (r.assessment_dimensions as any).code.charAt(0));
    riasecTopCodes = topRiasec.join("");
  }

  // 2. Fetch all active fields
  const { data: fields } = await supabase
    .from("fields")
    .select("*")
    .eq("active", true)
    .order("display_order");

  if (!fields) return [];

  // 3. Simple matching logic based on RIASEC code overlap
  // For MVP: If the field's riasec_mapping shares characters with student's top 3 RIASEC codes, it's a match.
  const scoredFields = fields.map(field => {
    let score = 0;
    let reason = "Lĩnh vực này mang đến nhiều cơ hội phát triển năng lực của bạn.";
    
    if (riasecTopCodes && field.riasec_mapping) {
      const fieldCodes = field.riasec_mapping.split(',');
      let matchedCodes = [];
      for (const fc of fieldCodes) {
        if (riasecTopCodes.includes(fc.trim())) {
          score += 30; // Base score per match
          matchedCodes.push(fc.trim());
        }
      }
      
      if (score > 0) {
        // Boost score slightly based on display order to break ties but prioritize matches
        score += (10 - (field.display_order || 0));
        reason = `Lĩnh vực này phù hợp với đặc điểm nhóm ${matchedCodes.join(', ')} nổi bật của bạn.`;
      }
    } else {
      // Default score if no RIASEC data
      score = 10 - (field.display_order || 0);
    }
    
    return {
      id: field.id,
      name: field.name,
      slug: field.slug,
      description: field.description,
      icon: field.icon,
      matchScore: score,
      reason
    };
  });

  // 4. Sort by score descending and return top 3
  scoredFields.sort((a, b) => b.matchScore - a.matchScore);
  
  return scoredFields.slice(0, 3);
}
