import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: results, error } = await supabase
    .from('assessment_results')
    .select('id, student_id')
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ results });
}
