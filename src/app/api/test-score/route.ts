import { NextResponse } from 'next/server';
import { calculateAndCompleteSession } from '@/features/assessment/actions/scoring';

// Bypass auth for testing script only
export async function POST(request: Request) {
  const { sessionId, userId } = await request.json();

  // Mock supabase auth.getUser for this test since calculateAndCompleteSession checks it
  // This is tricky because the action uses createClient from next/server
  // which will read cookies. Since we have no cookies, it will fail auth.

  return NextResponse.json({ error: "Need to inject auth somehow" });
}
