-- Add config JSONB column to assessment_versions for Validity thresholds and rules
ALTER TABLE public.assessment_versions
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

-- Update the locked Spec 1.0 version (2026.1) to have the necessary config
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
