import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/features/account/current-account";

export type AdminRole = "editor" | "admin" | "super_admin";

export async function requireContentManager() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/login");
  }

  const isContentManager = account.roles.some((role) =>
    (["editor", "admin", "super_admin"] as AdminRole[]).includes(role as AdminRole),
  );

  if (!isContentManager) {
    redirect("/dashboard");
  }

  return account;
}

export async function requireAdministrator() {
  const account = await getCurrentAccount();

  if (!account) {
    redirect("/login");
  }

  const isAdministrator = account.roles.some((role) => role === "admin" || role === "super_admin");
  if (!isAdministrator) {
    redirect("/dashboard");
  }

  return account;
}
