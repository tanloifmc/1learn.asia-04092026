import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateScoringV1, DimensionMeta, RawResponse } from '../src/features/assessment/utils/scoring';
import { interpretProfile } from '../src/features/career/actions/interpretation-engine';
import { buildReportData } from '../src/features/career/actions/report-builder';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Find a completed assessment_session
  const { data: session } = await supabase
    .from('assessment_sessions')
    .select('*')
    .eq('status', 'completed')
    .limit(1)
    .single();

  if (!session) {
    console.error('FAIL: No completed assessment session found in DB.');
    
    // Fallback: Check if there's any session with responses we can use
    const { data: anySession } = await supabase.from('assessment_sessions').select('*').limit(1).single();
    if (anySession) {
      console.log('Found an incomplete session:', anySession.id);
      const { data: respCount } = await supabase.from('assessment_responses').select('id', { count: 'exact' }).eq('session_id', anySession.id);
      console.log('It has responses:', respCount);
    }
    return;
  }

  console.log(`Found completed session: ${session.id} for student: ${session.student_id}`);

  // 2. Fetch Version, Dimensions, Questions
  const { data: version } = await supabase.from('assessment_versions').select('*').eq('id', session.version_id).single();
  const { data: dimensions } = await supabase.from('assessment_dimensions').select('*').eq('version_id', version.id);
  const { data: questions } = await supabase.from('assessment_questions').select('*').eq('version_id', version.id);

  // 3. Fetch real responses
  const { data: dbResponses } = await supabase.from('assessment_responses').select('*').eq('session_id', session.id);
  
  if (!dbResponses || dbResponses.length === 0) {
    console.error('FAIL: Session has no responses in DB.');
    return;
  }
  
  console.log(`Fetched ${dbResponses.length} real responses from DB.`);

  // Analyze package questions
  const hasBigFive = questions.some(q => {
    const dim = dimensions.find(d => d.id === q.dimension_id);
    return dim && dim.framework === 'big_five';
  });
  const hasWorkValues = questions.some(q => {
    const dim = dimensions.find(d => d.id === q.dimension_id);
    return dim && dim.framework === 'work_values';
  });

  console.log(`- Big Five Questions present in version: ${hasBigFive ? 'YES' : 'NO'}`);
  console.log(`- Work Values Questions present in version: ${hasWorkValues ? 'YES' : 'NO'}`);

  // Map DB responses to RawResponse
  const responses: RawResponse[] = dbResponses.map(r => {
    const q = questions.find(x => x.id === r.question_id);
    const dim = dimensions.find(d => d.id === q?.dimension_id);
    return {
      question_id: r.question_id,
      question_code: q?.question_code || '',
      dimension_id: q?.dimension_id || '',
      framework: dim?.framework || '',
      matching_role: dim?.matching_role || '',
      is_reverse_scored: q?.is_reverse_scored || false,
      weight: q?.weight || 1,
      response_value: r.response_value
    };
  });

  // 4. Run SCORING
  // Use real config from the DB
  const config = version.config;

  if (!config) {
    console.error('FAIL: Missing config on assessment_version.');
    return;
  }

  const startedAt = new Date(session.started_at);
  const completedAt = session.completed_at ? new Date(session.completed_at) : new Date();

  console.log('--- RUNNING SCORING ENGINE ---');
  let scoringResult;
  try {
    scoringResult = calculateScoringV1(responses, dimensions, config, startedAt, completedAt);
    console.log(`Global Validity from Scoring: ${scoringResult.confidence.level}`);
  } catch(e) {
    console.error('Error during scoring:', e);
    return;
  }
  
  console.log(`Quality Flags:`, scoringResult.quality, scoringResult.confidence.flags);

  // 5. Run PROFILE BUILDER Mapping
  console.log('--- RUNNING PROFILE MAPPING ---');
  const profileFeatures: any = {
    interests: { framework: 'riasec', scores: {}, primary_code: "" },
    personality: { framework: 'big_five', scores: {} },
    work_values: { framework: 'work_values', scores: {} },
    readiness: { score: 0, level: 'STARTING' },
    meta: { validity: scoringResult.confidence.level, source_assessments: [version.id] }
  };

  for (const [framework, scores] of Object.entries(scoringResult.frameworks)) {
    if (framework === 'riasec') {
      profileFeatures.interests.scores = scores;
      const riasecScores = Object.entries(scores) as [string, number][];
      riasecScores.sort((a, b) => {
        const diff = b[1] - a[1];
        if (Math.abs(diff) <= 2) {
           const order = ['R', 'I', 'A', 'S', 'E', 'C'];
           return order.indexOf(a[0]) - order.indexOf(b[0]);
        }
        return diff;
      });
      profileFeatures.interests.ranked_dimensions = riasecScores.map(x => x[0]);
      profileFeatures.interests.primary_code = riasecScores.slice(0, 3).map(x => x[0]).join('');
    } else if (framework === 'big_five') {
      profileFeatures.personality.scores = scores;
    } else if (framework === 'work_values') {
      profileFeatures.work_values.scores = scores;
    }
  }

  // 6. Run REPORT BUILDER
  console.log('--- RUNNING REPORT BUILDER ---');
  try {
    const reportData = buildReportData(session.student_id, session.id, profileFeatures);
    console.log("=== REPORT DATA SNAPSHOT ===");
    console.log(JSON.stringify(reportData, null, 2));
  } catch (e: any) {
    console.log(`Report Building failed: ${e.message}`);
  }
}

run().catch(console.error);
