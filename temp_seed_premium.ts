import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // 1. Create premium plan
  const { data: plan, error: planErr } = await supabase.from('membership_plans').insert({
    code: 'PREMIUM_1Y',
    name: 'Premium 1 Năm',
    duration_days: 365,
    price_amount: 299000,
    currency: 'VND',
    description: 'Báo cáo Premium'
  }).select().single();
  
  if (planErr) {
    if (planErr.code === '23505') {
       console.log("Plan already exists");
    } else {
       console.log("Plan Err:", planErr);
       return;
    }
  }
  
  const { data: existingPlan } = await supabase.from('membership_plans').select('*').limit(1).single();

  // 2. Add subscription for user
  const userId = '1c42a451-93c2-49b7-8708-49b62df581da';
  const { data: sub, error: subErr } = await supabase.from('membership_subscriptions').insert({
    user_id: userId,
    plan_id: existingPlan.id,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
    is_active: true
  }).select().single();
  
  console.log("Sub:", subErr || sub);
}
seed();
