"use server";

import { trackServerEvent } from "@/lib/analytics/server";

export async function trackRegistrationServerAction(role: string, method: string) {
  await trackServerEvent("REGISTER", { provider: method, role } as any);
}
