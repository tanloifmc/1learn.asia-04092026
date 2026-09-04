import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

import { buildStudentProfile } from './src/features/career/actions/profile-builder';
import { runMatchingEngine } from './src/features/career/actions/matching-engine';

async function test() {
  const studentId = '1c42a451-93c2-49b7-8708-49b62df581da';
  try {
    console.log("Running profile builder...");
    const profileResult = await buildStudentProfile(studentId, supabase);
    console.log("Profile Result:", JSON.stringify(profileResult, null, 2));
    
    if (profileResult.success && profileResult.profile) {
      console.log("Running matching engine...");
      const matchResult = await runMatchingEngine(studentId, profileResult.profile.profile_version, supabase);
      console.log("Match Result:", JSON.stringify(matchResult, null, 2));
    }
  } catch(e) {
    console.error("Caught error:", e);
  }
}
test();
