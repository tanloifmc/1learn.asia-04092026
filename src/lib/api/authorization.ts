import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/auth/current-account";

export async function getContentManagerForApi() {
  const account = await getCurrentAccount();
  const isContentManager = account?.roles.some((role) => ["editor", "admin", "super_admin"].includes(role));

  if (!account || !isContentManager) {
    return null;
  }

  return account;
}

export async function getAdministratorForApi() {
  const account = await getCurrentAccount();
  const isAdministrator = account?.roles.some((role) => role === "admin" || role === "super_admin");

  if (!account || !isAdministrator) {
    return null;
  }

  return account;
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
