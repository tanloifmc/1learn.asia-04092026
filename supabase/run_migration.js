import pkg from 'pg';
const { Client } = pkg;

const DIRECT_URL = "postgresql://postgres.cbhkrijxgqedcxywuwut:*6nRwuuH&&GY5Mn@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function verify() {
  const client = new Client({ connectionString: DIRECT_URL });
  try {
    await client.connect();
    
    console.log('--- Running Migration ---');
    await client.query(`
      ALTER TABLE public.assessment_versions
      ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;
    `);
    
    await client.query(`
      UPDATE public.assessment_versions
      SET config = '{
        "options_scale": { "min": 1, "max": 5 },
        "validity_rules": {
          "expected_answers": {
            "VQ_A01": 4,
            "VQ_A02": 1,
            "VQ_A03": 5
          },
          "max_attention_failures_allowed": 1,
          "max_straightline_streak_allowed": 12,
          "expected_duration_seconds": 600
        }
      }'::jsonb
      WHERE version_tag = '2026.1';
    `);
    console.log('Migration completed.');
  } catch (err) {
    console.error('Verify failed:', err);
  } finally {
    await client.end();
  }
}

verify();
