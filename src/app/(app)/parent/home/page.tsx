import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { getJourneyProgress } from "@/features/metrics/journey-progress";
import { getGoalReadiness } from "@/features/metrics/goal-readiness";
import { Link2, Sparkles, Target, Route } from "lucide-react";

export default async function ParentHomePage() {
  const account = await getCurrentAccount();
  const parentId = account?.userId;
  if (!parentId) redirect("/login");

  const supabase = await createClient();

  // Fetch linked students
  const { data: links } = await supabase
    .from("parent_child_links")
    .select("student_id")
    .eq("parent_id", parentId)
    .eq("status", "accepted");

  const studentIds = links?.map(l => l.student_id) ?? [];
  if (studentIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-24">
        <div className="border border-dashed border-navy/20 p-16 text-center bg-white/50 rounded-[40px] shadow-sm">
          <div className="w-20 h-20 bg-soft-beige rounded-full flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-serif text-4xl text-navy mb-4">Chưa liên kết tài khoản</h2>
          <p className="text-navy/60 mb-8 max-w-md mx-auto text-lg font-light">Xin hãy lấy mã liên kết từ tài khoản của con để đồng hành cùng con.</p>
          <button className="px-8 py-4 rounded-full text-base font-bold bg-[#B89862] text-white hover:bg-[#A38555] transition-all shadow-md">Thêm mã liên kết</button>
        </div>
      </div>
    );
  }

  // We take the first linked student for this mini-flow summary
  const studentId = studentIds[0];
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", studentId)
    .maybeSingle();

  // 1. Fetch Primary Goal for the student
  const goalReadiness = await getGoalReadiness(studentId);
  const { data: goal } = await supabase
    .from("student_goals")
    .select("career_id, careers(name), university_id, universities(name)")
    .eq("student_id", studentId)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();

  // 2. Fetch Journey Progress
  const journey = await getJourneyProgress(studentId);

  return (
    <div className="space-y-16 pb-12">
      <header className="mb-12">
        <h1 className="font-serif text-4xl md:text-5xl md:text-6xl text-navy mb-4 tracking-tight">Tổng quan hành trình của {profile?.display_name || 'Con'}.</h1>
        <p className="text-xl text-navy/60 font-light max-w-3xl">
          Phụ huynh chỉ có quyền xem (Read-only) để đồng hành, theo dõi tiến độ và hỗ trợ con khi cần thiết. Mọi quyết định vẫn nằm ở con.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Goal Card */}
        <div className="bg-white rounded-[40px] p-6  border border-navy/5 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-soft-beige blur-[80px] rounded-full opacity-50 -mr-10 -mt-10"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-8 bg-background text-gold px-4 py-2 rounded-full font-bold text-xs tracking-[0.15em] uppercase border border-gold/20">
              <Target className="w-4 h-4" /> Mục tiêu hiện tại
            </div>
            
            {goal ? (
              <div className="space-y-8">
                <div>
                  <h3 className="font-serif text-4xl font-medium text-navy mb-2">{(goal.careers as any)?.name}</h3>
                  <p className="text-navy/60 font-medium text-lg">{(goal.universities as any)?.name || 'Chưa chọn trường'}</p>
                </div>
                
                <div className="bg-background p-6 rounded-2xl border border-navy/5">
                  <div className="flex justify-between text-sm font-bold text-navy/60 uppercase tracking-widest mb-4">
                    <span>Độ sẵn sàng</span>
                    <span className="text-gold">{goalReadiness.score ?? 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-navy/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${goalReadiness.score ?? 0}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-navy/20 rounded-3xl bg-background/50">
                <p className="text-navy/50 text-lg font-light italic">Con chưa thiết lập mục tiêu nghề nghiệp ưu tiên.</p>
              </div>
            )}
          </div>
        </div>

        {/* Journey Card */}
        <div className="bg-navy rounded-[40px] p-6  shadow-xl relative overflow-hidden text-white group hover:-translate-y-1 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white blur-[80px] rounded-full opacity-10 -mr-10 -mt-10"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-8 bg-white/10 text-white px-4 py-2 rounded-full font-bold text-xs tracking-[0.15em] uppercase border border-white/10">
              <Route className="w-4 h-4" /> Tiến độ lộ trình
            </div>
            
            {journey ? (
              <div className="space-y-8">
                <div>
                  <h3 className="font-serif text-4xl font-medium mb-2">{journey.currentMilestone?.title || 'Chưa bắt đầu chặng nào'}</h3>
                  <div className="flex items-end gap-3 text-white/60 mb-2">
                    <span className="text-3xl font-bold text-gold">{journey.completedTasks}</span>
                    <span className="text-xl pb-0.5">/ {journey.totalTasks} nhiệm vụ</span>
                  </div>
                </div>
                
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex justify-between text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
                    <span>Tiến độ tổng</span>
                    <span className="text-gold">{journey.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${journey.progress}%` }}></div>
                  </div>
                </div>
                
                {journey.priorityTask && (
                  <div className="p-5 rounded-2xl bg-white text-navy shadow-lg">
                    <p className="text-xs font-bold text-navy/50 uppercase tracking-widest mb-2">Nhiệm vụ ưu tiên hiện tại</p>
                    <p className="text-lg font-bold">{journey.priorityTask.title}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-white/20 rounded-3xl bg-white/5">
                <p className="text-white/50 text-lg font-light italic">Chưa có lộ trình hành động. Lộ trình sẽ được tạo sau khi con chọn Mục tiêu.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#FAF6F0] rounded-[40px] p-6  relative overflow-hidden flex flex-col md:flex-row gap-10 items-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#C6A15B]">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-serif text-3xl md:text-4xl text-navy mb-6">Bạn có thể hỗ trợ con như thế nào?</h2>
          <ul className="space-y-4 text-lg text-navy/70 font-light">
            <li className="flex gap-4">
              <span className="text-gold font-bold mt-1">•</span>
              <span><strong className="font-semibold text-navy">Khuyến khích cập nhật điểm số:</strong> Hệ thống cần điểm số chính xác để dự đoán khả năng đỗ Đại học.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-gold font-bold mt-1">•</span>
              <span><strong className="font-semibold text-navy">Thảo luận thay vì áp đặt:</strong> Tham khảo các ngành nghề có độ phù hợp cao trong Báo cáo cá nhân của con.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-gold font-bold mt-1">•</span>
              <span><strong className="font-semibold text-navy">Giữ vai trò cố vấn:</strong> Để con làm chủ Hành trình. Bạn theo dõi để cung cấp nguồn lực (tài chính, tinh thần) khi con gặp nhiệm vụ khó.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
