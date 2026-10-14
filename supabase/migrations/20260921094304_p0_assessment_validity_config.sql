-- Align the published assessment package with the final locked validity policy.
-- This migration changes only configuration for the existing package; it does not alter answers or results.
UPDATE public.assessment_versions
SET config = jsonb_set(
  config,
  '{validity_rules}',
  ((config -> 'validity_rules') - 'max_straightline_streak_allowed')
    || '{"straightline_block_threshold": 8}'::jsonb,
  true
)
WHERE version_tag = '2026.1';
