import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Building2, Target, Briefcase,
  MapPin, CalendarDays, CheckCircle2, Circle, TrendingUp,
  ChevronRight, Sparkles, Flag, Clock, BarChart3
} from "lucide-react";

export const metadata = {
  title: "Mục tiêu của tôi - 1learn.asia",
  description: "Quản lý mục tiêu học tập và nghề nghiệp cá nhân hóa.",
};

function ReadinessMeter({ score }: { score: number }) {
  const pct = Math.min(Math.max(score || 0, 0), 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#B89862";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="rotate-[-90deg] w-full h-full" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#0E1B3D" strokeWidth="10" opacity={0.08} />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-[#0E1B3D]" style={{ color }}>{pct}</span>
          <span className="text-xs text-[#0E1B3D]/40 font-bold">%</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-bold text-[#0E1B3D]/60 uppercase tracking-wider">Sẵn sàng</p>
    </div>
  );
}

export default async function GoalPage() {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();

  // 1. Fetch primary goal with full career→major→university chain
  const { data: goal } = await supabase
    .from("student_goals")
    .select(`
      id, target_year, readiness_score, created_at,
      careers(id, name, category, description),
      majors(id, name, code),
      universities(id, name, short_name, province, type)
    `)
    .eq("student_id", user.id)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();

  // 2. Fetch roadmap milestones if goal exists
  let milestones: any[] = [];
  if (goal) {
    const { data: roadmap } = await supabase
      .from("student_roadmaps")
      .select("id")
      .eq("student_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (roadmap) {
      const { data: ms } = await supabase
        .from("roadmap_milestones")
        .select("id, title, description, target_date, status, milestone_type, phase")
        .eq("roadmap_id", roadmap.id)
        .order("target_date", { ascending: true })
        .limit(20);
      milestones = ms || [];
    }
  }

  const completedCount = milestones.filter(m => m.status === "completed").length;
  const totalCount = milestones.length;
  const milestoneProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const readinessScore = goal?.readiness_score ?? milestoneProgress;

  // ── No goal state ──────────────────────────────────────────────────────────
  if (!goal) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-[40px] p-12 text-center border border-[#0E1B3D]/8 shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-[#4A2545] to-[#713E67] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-serif text-3xl mb-3 text-[#0E1B3D]">Chưa có mục tiêu</h2>
          <p className="text-[#0E1B3D]/60 mb-8 leading-relaxed">
            Hoàn thành khảo sát và xem Báo cáo Premium để chọn nghề nghiệp, ngành học và trường đại học làm mục tiêu của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/me/bao-cao/premium"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-[#4A2545] text-white hover:bg-[#B89862] hover:text-[#4A2545] transition-all shadow-md text-sm">
              <Sparkles className="w-4 h-4" /> Xem Báo cáo Premium
            </Link>
            <Link href="/me/bao-cao"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border border-[#0E1B3D]/15 text-[#0E1B3D] hover:bg-[#0E1B3D] hover:text-white transition-all text-sm">
              Báo cáo miễn phí <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const career = goal.careers as any;
  const major = goal.majors as any;
  const university = goal.universities as any;
  const targetYear = goal.target_year || (new Date().getFullYear() + 4);
  const yearsLeft = targetYear - new Date().getFullYear();

  // Group milestones by phase
  const byPhase = milestones.reduce((acc: Record<string, any[]>, m) => {
    const phase = m.phase || "Khác";
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0E1B3D] to-[#1A2D5A] pt-28 pb-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-60px] right-[-80px] w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B89862]/20 border border-[#B89862]/30 mb-6">
            <Flag className="w-4 h-4 text-[#B89862]" />
            <span className="text-[#B89862] text-xs font-bold tracking-widest uppercase">Mục tiêu chính · Đang theo dõi</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4 leading-tight">
            {career?.name || "Mục tiêu nghề nghiệp"}
          </h1>
          {career?.category && (
            <span className="inline-block px-3 py-1 bg-[#B89862]/20 text-[#B89862] rounded-full text-xs font-bold mb-4">{career.category}</span>
          )}
          <p className="text-white/60 max-w-2xl leading-relaxed">{career?.description || "Mục tiêu nghề nghiệp đã được thiết lập."}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-20 space-y-6">

        {/* ── GOAL CHAIN CARDS ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Career */}
          <div className="bg-gradient-to-br from-[#4A2545] to-[#713E67] rounded-3xl p-6 text-white shadow-xl">
            <Briefcase className="w-6 h-6 text-[#B89862] mb-4" />
            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Nghề nghiệp mục tiêu</p>
            <p className="font-bold text-lg leading-tight">{career?.name || "—"}</p>
          </div>

          {/* Major */}
          <div className="bg-white rounded-3xl p-6 border border-[#0E1B3D]/8 shadow-md">
            <BookOpen className="w-6 h-6 text-[#B89862] mb-4" />
            <p className="text-[#0E1B3D]/50 text-xs font-bold uppercase tracking-wider mb-1">Ngành học</p>
            <p className="font-bold text-[#0E1B3D] leading-tight">{major?.name || "Chưa chọn"}</p>
            {major?.code && <p className="text-[#0E1B3D]/40 text-xs mt-1 font-mono">{major.code}</p>}
          </div>

          {/* University */}
          <div className="bg-white rounded-3xl p-6 border border-[#0E1B3D]/8 shadow-md">
            <Building2 className="w-6 h-6 text-[#B89862] mb-4" />
            <p className="text-[#0E1B3D]/50 text-xs font-bold uppercase tracking-wider mb-1">Trường đại học</p>
            <p className="font-bold text-[#0E1B3D] leading-tight">{university?.name || "Chưa chọn"}</p>
            {university?.province && (
              <p className="text-[#0E1B3D]/40 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{university.province}
              </p>
            )}
          </div>
        </div>

        {/* ── READINESS + TIMELINE ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Readiness Meter */}
          <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-md flex items-center gap-8">
            <ReadinessMeter score={readinessScore} />
            <div className="flex-1">
              <h3 className="font-serif text-xl text-[#0E1B3D] mb-2">Độ sẵn sàng</h3>
              <p className="text-[#0E1B3D]/60 text-sm leading-relaxed mb-4">
                {readinessScore >= 70
                  ? "Bạn đang tiến rất tốt! Tiếp tục duy trì đà này."
                  : readinessScore >= 40
                  ? "Bạn đang đi đúng hướng. Hoàn thiện thêm các mốc còn lại."
                  : "Hãy bắt đầu với các mốc đầu tiên để xây dựng đà."}
              </p>
              <div className="text-xs text-[#0E1B3D]/40">
                {completedCount}/{totalCount} mốc hoàn thành
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-md">
            <div className="flex items-center gap-3 mb-5">
              <CalendarDays className="w-5 h-5 text-[#B89862]" />
              <h3 className="font-serif text-xl text-[#0E1B3D]">Năm mục tiêu</h3>
            </div>
            <div className="text-6xl font-black text-[#4A2545] mb-2">{targetYear}</div>
            <div className="flex items-center gap-2 text-[#0E1B3D]/50 text-sm mb-4">
              <Clock className="w-4 h-4" />
              <span>Còn <strong className="text-[#0E1B3D]">{yearsLeft} năm</strong> để chuẩn bị</span>
            </div>
            <Link href="/roadmap"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#0E1B3D] text-white font-bold text-sm hover:bg-[#4A2545] transition-all">
              Xem Lộ trình chi tiết <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── MILESTONES ─────────────────────────────────────────────── */}
        {totalCount > 0 ? (
          <div className="bg-white rounded-3xl border border-[#0E1B3D]/8 shadow-md overflow-hidden">
            <div className="p-6 md:p-8 border-b border-[#0E1B3D]/8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-xl text-[#0E1B3D] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#B89862]" /> Mốc hành động
                </h3>
                <span className="text-sm font-bold text-[#0E1B3D]/50">{completedCount}/{totalCount}</span>
              </div>
              <div className="h-2 bg-[#0E1B3D]/6 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#4A2545] to-[#B89862] rounded-full transition-all duration-700" style={{ width: `${milestoneProgress}%` }} />
              </div>
            </div>

            <div className="divide-y divide-[#0E1B3D]/5">
              {Object.entries(byPhase).map(([phase, phaseMilestones]) => (
                <div key={phase} className="p-6 md:p-8">
                  <p className="text-xs font-black uppercase tracking-widest text-[#B89862] mb-4">{phase}</p>
                  <div className="space-y-3">
                    {(phaseMilestones as any[]).map((m) => {
                      const done = m.status === "completed";
                      const date = m.target_date ? new Date(m.target_date).toLocaleDateString("vi-VN", { month: "short", year: "numeric" }) : null;
                      return (
                        <div key={m.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${done ? "bg-emerald-50 border-emerald-100" : "bg-[#0E1B3D]/2 border-[#0E1B3D]/8"}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {done
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              : <Circle className="w-5 h-5 text-[#0E1B3D]/20" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${done ? "text-emerald-700 line-through" : "text-[#0E1B3D]"}`}>{m.title}</p>
                            {m.description && <p className="text-xs text-[#0E1B3D]/50 mt-0.5 line-clamp-2">{m.description}</p>}
                          </div>
                          {date && (
                            <span className={`text-[10px] font-bold flex-shrink-0 px-2 py-1 rounded-lg ${done ? "text-emerald-600 bg-emerald-100" : "text-[#0E1B3D]/40 bg-[#0E1B3D]/5"}`}>
                              {date}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-md text-center">
            <TrendingUp className="w-10 h-10 text-[#0E1B3D]/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-[#0E1B3D] mb-2">Chưa có lộ trình</h3>
            <p className="text-[#0E1B3D]/50 text-sm mb-5">Hệ thống đang tạo lộ trình dựa trên mục tiêu của bạn.</p>
            <Link href="/roadmap" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0E1B3D] text-white font-bold text-sm hover:bg-[#4A2545] transition-all">
              Xem Lộ trình <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* ── CTA Change Goal ─────────────────────────────────────────── */}
        <div className="flex justify-center">
          <Link href="/me/bao-cao/premium"
            className="inline-flex items-center gap-2 text-[#0E1B3D]/50 hover:text-[#4A2545] text-sm transition-colors font-medium">
            <Target className="w-4 h-4" /> Đổi mục tiêu từ Báo cáo Premium
          </Link>
        </div>

      </div>
    </div>
  );
}
