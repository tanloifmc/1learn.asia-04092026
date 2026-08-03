import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  locale: z.string().trim().min(2).max(12).optional(),
  timezone: z.string().trim().min(1).max(80).optional(),
});

export async function PATCH(request: Request) {
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      phone: parsed.data.phone,
      locale: parsed.data.locale,
      timezone: parsed.data.timezone,
    })
    .eq("id", claims.sub);

  if (error) {
    return NextResponse.json({ error: "Unable to update profile" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
