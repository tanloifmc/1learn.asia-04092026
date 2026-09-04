import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PrivacySettings } from "@/components/parent/privacy-settings";

export default async function PrivacySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get current active invitation
  const { data: invitation } = await supabase
    .from("parent_link_invitations")
    .select("*")
    .eq("student_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get current parent links
  const { data: links } = await supabase
    .from("parent_child_links")
    .select(`
      *,
      permissions:parent_sharing_permissions(*),
      parent:profiles!parent_child_links_parent_id_fkey(full_name, email)
    `)
    .eq("student_id", user.id)
    .eq("status", "accepted");

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      <div className="bg-[#0E1B3D] pt-32 pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -ml-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4 bg-white/5 backdrop-blur-md">
            Security & Trust
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6">Quyền riêng tư</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
            Quản lý quyền truy cập của Phụ huynh vào hồ sơ phân tích, lộ trình và kết quả học tập của bạn. Bạn luôn nắm quyền kiểm soát dữ liệu.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        <PrivacySettings 
          studentId={user.id} 
          activeInvitation={invitation} 
          parentLinks={links || []} 
        />
      </div>
    </div>
  );
}
