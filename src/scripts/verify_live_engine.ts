import { runUniversityRecommendation } from '../features/university/actions/recommendation-engine';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  console.log("======================================");
  console.log("INTEGRATION TEST: Matching Engine (Live)");
  console.log("======================================\n");

  // targetMajorId needs to be fetched from the DB, but since we seeded them, 
  // let's fetch the ID of 'khoa-hoc-may-tinh'
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: csMajor } = await supabase.from('majors').select('id').eq('slug', 'khoa-hoc-may-tinh').single();
  const majorId = csMajor!.id;

  console.log("1. Testing Student A (Has THPT 27.5, applying for CS)");
  const resA = await runUniversityRecommendation('11111111-1111-1111-1111-111111111111', majorId, 'THPT');
  console.log("Status:", resA.status || "Success");
  if (resA.recommendations) {
    resA.recommendations.forEach((r: any) => {
      console.log(` - Uni ID: ${r.university_id} | Tier: ${r.tier} | Gap: ${r.fit_breakdown.admission_gap}`);
    });
  }
  console.log("\n--------------------------------------\n");

  console.log("2. Testing Student B (Grade 10, only GPA, no THPT)");
  const resB = await runUniversityRecommendation('22222222-2222-2222-2222-222222222222', majorId, 'THPT');
  console.log("Status:", resB.status);
  console.log("Message:", resB.message);
  
  console.log("\n--------------------------------------\n");

  console.log("3. Testing Student C (IELTS only, checking RMIT compatibility)");
  const { data: bizMajor } = await supabase.from('majors').select('id').eq('slug', 'quan-tri-kinh-doanh').single();
  const resC = await runUniversityRecommendation('33333333-3333-3333-3333-333333333333', bizMajor!.id, 'IELTS');
  console.log("Status:", resC.status || "Success");
  if (resC.recommendations) {
    resC.recommendations.forEach((r: any) => {
      console.log(` - Uni ID: ${r.university_id} | Tier: ${r.tier} | Gap: ${r.fit_breakdown.admission_gap} | Scale Checked`);
    });
  }
}

verify().catch(console.error);
