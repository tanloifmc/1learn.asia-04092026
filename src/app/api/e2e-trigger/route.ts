import { NextResponse } from "next/server";
import { buildStudentProfile } from "@/features/career/actions/profile-builder";
import { runMatchingEngine } from "@/features/career/actions/matching-engine";
import { RoadmapGenerator } from "@/features/roadmap/engine/roadmap-generator";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("1. Building Profile for", userId);
    const profileResult = await buildStudentProfile(userId, supabaseAdmin);
    if (!profileResult.success) throw new Error("Profile builder failed: " + profileResult.error);

    console.log("2. Running Matching Engine");
    const matchResult = await runMatchingEngine(userId, profileResult.profile!.profile_version, supabaseAdmin);
    if (!matchResult.success) throw new Error("Matching engine failed: " + matchResult.error);

    // 3. Roadmap Generator
    console.log("3. Generating Roadmap");
    // Get all career matches for this run
    const { data: matches, error: matchErr } = await supabaseAdmin
      .from('career_matches')
      .select('career_id')
      .eq('run_id', matchResult.runId)
      .order('match_score', { ascending: false });

    if (matchErr) throw new Error("Supabase error: " + matchErr.message);
    if (!matches || matches.length === 0) throw new Error("No career matches found for run " + matchResult.runId);
    
    let targetUniMajorId = null;
    let targetCareerId = null;
    let targetMajorId = null;
    let targetUniversityId = null;

    for (const match of matches) {
      const { data: mappings } = await supabaseAdmin
        .from('career_major_mappings')
        .select('major_id')
        .eq('career_id', match.career_id)
        .eq('status', 'published');
        
      if (mappings && mappings.length > 0) {
        // Find if any of these mapped majors have a university offering
        for (const mapping of mappings) {
          const { data: uniMajor } = await supabaseAdmin
            .from('university_majors')
            .select('id, university_id')
            .eq('major_id', mapping.major_id)
            .limit(1);
            
          if (uniMajor && uniMajor.length > 0) {
            targetCareerId = match.career_id;
            targetMajorId = mapping.major_id;
            targetUniversityId = uniMajor[0].university_id;
            targetUniMajorId = uniMajor[0].id;
            break;
          }
        }
      }
      if (targetCareerId) break; // found a complete match
    }
    
    if (!targetCareerId || !targetUniMajorId) {
      throw new Error("No career matches found that have a mapped major WITH a university offering!");
    }

    // Ensure there is at least one target_requirement for this university_major so the roadmap generator works
    const { data: existingReqs } = await supabaseAdmin
      .from('target_requirements')
      .select('id')
      .eq('target_type', 'university_major')
      .eq('target_id', targetUniMajorId)
      .limit(1);

    if (!existingReqs || existingReqs.length === 0) {
      console.log(`Injecting dummy requirement for uni_major ${targetUniMajorId}`);
      const { error: insErr } = await supabaseAdmin.from('target_requirements').insert({
        target_type: 'university_major',
        target_id: targetUniMajorId,
        requirement_code: 'MOCK_ACADEMIC',
        requirement_type: 'academic',
        comparison_operator: '>=',
        requirement_value: '8.0',
        unit: 'point',
        importance: 'critical',
        status: 'published'
      });
      if (insErr) {
        console.error("Failed to inject dummy requirement:", insErr);
        throw new Error("Failed to inject dummy requirement: " + insErr.message);
      }
    }

    const roadmapGenerator = new RoadmapGenerator(supabaseAdmin);
    const roadmapResult = await roadmapGenerator.generateRoadmap(
      userId,
      'university_major',
      targetUniMajorId,
      {
        target_career_id: targetCareerId,
        target_major_id: targetMajorId,
        target_university_id: targetUniversityId
      }
    );

    return NextResponse.json({ 
      success: true, 
      profile: profileResult.profile,
      match: matchResult.runId,
      roadmap: roadmapResult
    });
  } catch (err: any) {
    console.error("E2E Trigger Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
