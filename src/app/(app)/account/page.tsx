import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { ImageUpload } from "@/components/media/image-upload";
import { PreferenceForm } from "@/components/account/preference-form";
import { PasswordForm } from "@/components/account/password-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SessionManager } from "@/components/account/session-manager";
import { getCurrentAccount } from "@/features/account/current-account";

export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <div>
        <span className="inline-block px-3 py-1 bg-[#B89862]/10 text-[#B89862] font-bold text-xs uppercase tracking-widest rounded-full mb-4">
          Tài khoản
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-[#0E1B3D] mb-4">Cài đặt cá nhân</h1>
        <p className="text-[#0E1B3D]/70 text-lg">Quản lý thông tin hồ sơ, bảo mật và tùy chọn hệ thống của bạn.</p>
      </div>

      <div className="space-y-6">
        <ProfileForm
          displayName={account.profile?.display_name ?? ""}
          phone={account.profile?.phone ?? ""}
          locale={account.profile?.locale ?? "vi"}
          timezone={account.profile?.timezone ?? "Asia/Ho_Chi_Minh"}
        />

        {/* Note: In a real app we'd style ImageUpload too, but putting it in a card for now */}
        <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-[#0E1B3D]/5">
          <h2 className="font-serif text-2xl text-[#0E1B3D] mb-6">Ảnh đại diện</h2>
          <ImageUpload 
            kind="avatar" 
            label="Chọn ảnh đại diện" 
            defaultImageUrl={account.profile?.avatar_url ?? undefined} 
          />
        </div>

        <PreferenceForm />
        
        <PasswordForm />
        
        <SessionManager />
      </div>

      <div className="pt-8 border-t border-[#0E1B3D]/10">
        <div className="bg-red-50 rounded-[24px] p-6 md:p-8 border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-2xl text-red-900 mb-2">Đăng xuất khỏi hệ thống</h2>
            <p className="text-red-800/80">Bạn sẽ cần đăng nhập lại để truy cập vào tài khoản.</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
