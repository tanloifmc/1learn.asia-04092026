import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/current-account";

export async function GET() {
  const account = await getCurrentAccount();
  if (!account) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  return NextResponse.json(account);
}
