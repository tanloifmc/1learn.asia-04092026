import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentAccount } from "@/lib/auth/current-account";

export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Tai khoan</h1>
      <ProfileForm
        displayName={account.profile?.display_name ?? ""}
        phone={account.profile?.phone ?? ""}
        locale={account.profile?.locale ?? "vi"}
        timezone={account.profile?.timezone ?? "Asia/Ho_Chi_Minh"}
      />
      <SignOutButton />
    </main>
  );
}
