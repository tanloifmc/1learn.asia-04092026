import { RoadmapGenerator } from '../features/roadmap/engine/roadmap-generator';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  console.log("======================================");
  console.log("INTEGRATION TEST: Roadmap Engine (Phase 6)");
  console.log("======================================\n");

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const generator = new RoadmapGenerator(supabase);

  // Get Target UUID (HCMUT CS)
  const { data: umData } = await supabase.from('university_majors')
    .select('id, university_id, major_id')
    .limit(1)
    .single();
  const targetId = umData!.id;

  const { data: realProfiles } = await supabase.from('profiles').select('id, display_name');
  const studentA = realProfiles?.find(p => p.display_name === 'studentA')?.id || '11111111-1111-1111-1111-111111111111'; // Grade 12
  const studentB = realProfiles?.find(p => p.display_name === 'studentB')?.id || '22222222-2222-2222-2222-222222222222'; // Grade 10

  // Cleanup old roadmaps for fresh test
  await supabase.from('roadmaps').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("TEST A: Grade 10 - Long Horizon (Student B)");
  const resB = await generator.generateRoadmap(studentB, 'university_major', targetId, { target_program_id: targetId });
  console.log("-> Status:", resB.status, "| Msg:", resB.message);

  if (resB.roadmapId) {
    const { data: tasks } = await supabase.from('roadmap_tasks').select('title, task_type, priority, due_date').eq('milestone_id', (await supabase.from('roadmap_milestones').select('id').eq('roadmap_id', resB.roadmapId).limit(1).single()).data?.id);
    console.log("-> Sample Tasks generated:");
    tasks?.forEach(t => console.log(`   - [${t.task_type}] (${t.priority}) ${t.title} - Due: ${t.due_date}`));
  }

  console.log("\nTEST G: Idempotency (Running same request again for Student B)");
  const resB2 = await generator.generateRoadmap(studentB, 'university_major', targetId, { target_program_id: targetId });
  console.log("-> Status:", resB2.status, "| Msg:", resB2.message);
  
  if (resB2.roadmapId === resB.roadmapId) {
    console.log("-> PASS: Same roadmap returned, no duplicates.");
  } else {
    console.log("-> FAIL: New roadmap created.");
  }

  console.log("\nTEST J: No verified requirement (Fake Target)");
  const fakeTarget = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const resFake = await generator.generateRoadmap(studentB, 'university_major', fakeTarget, { target_program_id: fakeTarget });
  console.log("-> Status:", resFake.status, "| Msg:", resFake.message);
  if (resFake.status === 'limited') console.log("-> PASS: Did not generate tasks for unverified target.");

}

verify().catch(console.error);
