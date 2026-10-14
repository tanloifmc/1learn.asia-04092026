import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('SUPABASE_DB_URL is required.');
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const query = async (label, text, values = []) => {
  const result = await client.query(text, values);
  console.log(`\n${label}`);
  console.table(result.rows);
};

await client.connect();

try {
  await query(
    'Required table presence',
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name`,
    [[
      'membership_plans', 'membership_subscriptions', 'payment_transactions',
      'student_goals', 'roadmaps', 'student_roadmaps', 'roadmap_milestones',
      'roadmap_tasks', 'target_requirements', 'careers'
    ]]
  );

  await query(
    'Payment transaction columns',
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'public' and table_name = 'payment_transactions'
      order by ordinal_position`
  );

  await query(
    'Roadmap and task columns',
    `select table_name, column_name, data_type, is_nullable
       from information_schema.columns
      where table_schema = 'public'
        and table_name = any($1::text[])
      order by table_name, ordinal_position`,
    [['student_goals', 'roadmaps', 'student_roadmaps', 'roadmap_milestones', 'roadmap_tasks']]
  );

  await query(
    'Relevant RLS status',
    `select tablename, rowsecurity
       from pg_tables
      where schemaname = 'public'
        and tablename = any($1::text[])
      order by tablename`,
    [['payment_transactions', 'membership_subscriptions', 'student_goals', 'roadmaps', 'roadmap_milestones', 'roadmap_tasks']]
  );

  await query(
    'Relevant policies',
    `select tablename, policyname, cmd, roles, qual, with_check
       from pg_policies
      where schemaname = 'public'
        and tablename = any($1::text[])
      order by tablename, policyname`,
    [['payment_transactions', 'membership_subscriptions', 'student_goals', 'roadmaps', 'roadmap_milestones', 'roadmap_tasks']]
  );

  await query(
    'Membership plans',
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'public' and table_name = 'membership_plans'
      order by ordinal_position`
  );

  await query(
    'Target requirement columns',
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'public' and table_name = 'target_requirements'
      order by ordinal_position`
  );

  await query(
    'Active membership plans',
    `select code, name, price_amount, duration_days, currency
       from public.membership_plans
      where is_active = true
      order by price_amount, code`
  );

  await query(
    'Career and verified requirement availability',
    `select
       (select count(*) from public.careers) as careers_total,
       (select count(*) from public.target_requirements) as requirements_total,
       (select count(*) from public.target_requirements where status in ('verified', 'published')) as requirements_verified_or_published,
       (select count(*) from public.target_requirements where is_production_eligible) as requirements_production_eligible`
  );

  await query(
    'Eligible requirement coverage by target type',
    `select target_type, count(*) as total, count(*) filter (where status in ('verified', 'published')) as verified_or_published,
            count(*) filter (where is_production_eligible) as production_eligible
       from public.target_requirements
      group by target_type
      order by target_type`
  );

  await query(
    'Existing requirement provenance',
    `select target_type, target_id, requirement_code, requirement_value, unit, status,
            is_production_eligible, source, source_url, last_verified_at
       from public.target_requirements
      order by created_at asc`
  );

  await query(
    'University program candidates with mapped major',
    `select um.id as program_id, u.name as university_name, m.name as major_name,
            um.program_name, um.source_url, um.verification_status
       from public.university_majors um
       join public.universities u on u.id = um.university_id
       left join public.majors m on m.id = um.major_id
      order by u.name, m.name nulls last
      limit 30`
  );

  await query(
    'RMIT program candidates',
    `select um.id as program_id, u.id as university_id, m.id as major_id, u.name as university_name,
            m.name as major_name, um.program_name, um.status, um.source_url, um.verification_status
       from public.university_majors um
       join public.universities u on u.id = um.university_id
       left join public.majors m on m.id = um.major_id
      where u.name ilike '%RMIT%'
      order by m.name nulls last`
  );
} finally {
  await client.end();
}
