import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getJourneyProgress } from "@/features/metrics/journey-progress";
import { getGoalReadiness } from "@/features/metrics/goal-readiness";
import { ArrowRight, Compass, Target, Map, Brain, Briefcase } from "lucide-react";
import { BarChart } from "@/components/ui/charts/bar-chart";
import { getFullReportData } from "@/features/career/actions/get-report-data";

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 1. Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("grade, region, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!studentProfile || !studentProfile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  // 2. Assessment & Full Report Data (for RIASEC chart)
  const fullReport = await getFullReportData(user.id);
  const riasecData = fullReport?.riasec || [];

  const { data: matchRun } = await supabase
    .from("match_runs")
    .select("id, overall_confidence_level, evidence_coverage, status")
    .eq("student_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let topMatches: Array<{ match_score: number; career: { id: string; name: string; career_domain_code: string; cover_image_url: string | null } | null }> = [];
  if (matchRun) {
    const { data: matches } = await supabase
      .from('career_matches')
      .select(`
        match_score,
        career:career_id (
          id, name, career_domain_code, cover_image_url
        )
      `)
      .eq('run_id', matchRun.id)
      .order('match_score', { ascending: false })
      .limit(2);
    if (matches) topMatches = matches as unknown as typeof topMatches;
  }

  // 3. Goal
  const goalReadiness = await getGoalReadiness(user.id);
  const readinessScore = goalReadiness.score;
  const { data: goal } = await supabase
    .from("student_goals")
    .select("career_id, careers(name), university_id, universities(short_name)")
    .eq("student_id", user.id)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();

  // 4. Journey
  const journey = await getJourneyProgress(user.id);

  return (
    <div className="relative min-h-screen bg-[#F8F6F1] pb-24 overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#B89862]/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#0E1B3D]/5 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>
      
      <div className="relative z-10 px-4 md:px-8 pt-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header & Identity */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-[#0E1B3D] mb-3 tracking-tight">Chào {profile?.display_name || 'em'}.</h1>
              <p className="text-xl text-[#0E1B3D]/60 font-light">Bản đồ tương lai của em hôm nay có gì mới?</p>
            </div>
            
            {/* Identity Pill */}
            {fullReport && (
              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-3 rounded-full border border-[#0E1B3D]/10 shadow-sm">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner overflow-hidden"
                  style={{ backgroundColor: fullReport.studentInfo.avatarColor }}
                >
                  {fullReport.studentInfo.avatarUrl ? (
                    <Image src={fullReport.studentInfo.avatarUrl} alt="Avatar" fill className="object-cover" sizes="40px" />
                  ) : (
                    fullReport.studentInfo.initials
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#0E1B3D]">{fullReport.studentInfo.displayName}</div>
                  <div className="text-sm text-[#0E1B3D]/60">
                    {fullReport.studentInfo.grade ? `Lớp ${fullReport.studentInfo.grade}` : "Học sinh"} 
                    {fullReport.studentInfo.region ? ` • ${fullReport.studentInfo.region}` : ""}
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* Hero / What Matters Now block */}
          <div>
            {!matchRun ? (
              <div className="bg-[#0E1B3D] rounded-[40px] p-6 md:p-14 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#B89862]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89862]/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-10">
                  <div className="flex-1 max-w-2xl">
                    <div className="inline-flex items-center gap-2 mb-8 bg-white/10 text-white px-4 py-2 rounded-full font-bold text-xs tracking-[0.15em] uppercase border border-white/20 backdrop-blur-md shadow-sm">
                      <Compass className="w-4 h-4 text-[#B89862]" /> Việc quan trọng nhất
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Bắt đầu khám phá bản thân</h2>
                    <p className="text-lg text-white/70 leading-relaxed font-light">Hệ thống AI của chúng tôi cần hiểu rõ về sở thích và tính cách của em qua bài kiểm tra để vẽ ra bản đồ nghề nghiệp chính xác nhất.</p>
                  </div>
                  <Link href="/me/kham-pha" className="px-8 py-4 rounded-full text-base font-bold bg-[#B89862] text-[#0E1B3D] hover:bg-white transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap w-full md:w-auto mt-6 md:mt-0">
                    Làm bài kiểm tra <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : !goal ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-6 md:p-14 border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#B89862]/10 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-[#B89862]/20 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-10">
                  <div className="flex-1 max-w-2xl">
                    <div className="inline-flex items-center gap-2 mb-8 bg-[#B89862]/10 text-[#B89862] px-4 py-2 rounded-full font-bold text-xs tracking-[0.15em] uppercase border border-[#B89862]/20 shadow-sm">
                      <Target className="w-4 h-4" /> Bước tiếp theo
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl text-[#0E1B3D] mb-4">Thiết lập mục tiêu</h2>
                    <p className="text-lg text-[#0E1B3D]/70 leading-relaxed font-light">Em đã có kết quả khám phá! Hãy xem báo cáo chi tiết và chọn cho mình một hướng đi ưu tiên để bắt đầu xây dựng lộ trình cá nhân hóa.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-0">
                    <Link href="/me/bao-cao" className="px-8 py-4 rounded-full text-base font-bold bg-white text-[#0E1B3D] border border-[#0E1B3D]/10 hover:bg-[#0E1B3D]/5 transition-all text-center shadow-sm hover:shadow">Xem báo cáo</Link>
                    <Link href="/explore" className="px-8 py-4 rounded-full text-base font-bold bg-[#0E1B3D] text-white hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                      Khám phá nghề <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-6 md:p-14 border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.05)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#B89862]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B89862]/15 blur-[100px] rounded-full -mr-40 -mt-40"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-10">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 mb-6 bg-[#0E1B3D]/5 text-[#0E1B3D] px-4 py-2 rounded-full font-bold text-xs tracking-[0.15em] uppercase border border-[#0E1B3D]/10 shadow-sm">
                      <Map className="w-4 h-4 text-[#B89862]" /> Mục tiêu hiện tại
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl text-[#0E1B3D] mb-2">{(goal.careers as unknown as { name: string } | null)?.name || "Chưa chọn nghề"}</h2>
                    <p className="text-lg text-[#0E1B3D]/60 font-serif italic">{(goal.universities as unknown as { short_name: string } | null)?.short_name || "Chưa chọn trường"}</p>
                    
                    <div className="mt-8 bg-white/50 p-4 rounded-2xl border border-[#0E1B3D]/5 backdrop-blur-sm">
                      <div className="flex justify-between text-sm mb-2 font-bold text-[#0E1B3D]">
                        <span>Mức độ sẵn sàng</span>
                        <span className="text-[#B89862] text-base">{readinessScore === null ? "Chưa đủ dữ liệu" : `${readinessScore}%`}</span>
                      </div>
                      <div className="w-full bg-[#0E1B3D]/5 h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-[#0E1B3D] to-[#B89862] h-full rounded-full transition-all duration-1000" style={{ width: `${readinessScore ?? 0}%` }}></div>
                      </div>
                      {readinessScore === null && <p className="mt-2 text-xs text-[#0E1B3D]/50">Thêm điểm học tập đã chuẩn hóa để đánh giá khả năng đáp ứng mục tiêu.</p>}
                    </div>
                  </div>
                  <Link href="/goal" className="px-8 py-4 rounded-full text-base font-bold bg-[#0E1B3D] text-white hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                    Cập nhật lộ trình <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* DASHBOARD WIDGETS GRID */}
          {matchRun && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* PROFILE SUMMARY WIDGET */}
              <div className="bg-white/70 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-[#0E1B3D]/10 hover:shadow-[0_20px_50px_rgba(14,27,61,0.08)] transition-all group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0E1B3D] to-[#2A3F70] rounded-2xl flex items-center justify-center shadow-md">
                      <Brain className="w-6 h-6 text-[#B89862]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-[#0E1B3D]">Hồ sơ năng lực</h3>
                      <p className="text-sm text-[#0E1B3D]/50 font-light">Theo mô hình Holland (RIASEC)</p>
                    </div>
                  </div>
                  <Link href="/me/bao-cao" className="text-xs font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors uppercase tracking-widest bg-[#B89862]/10 px-4 py-2 rounded-full">
                    Chi tiết
                  </Link>
                </div>

                <div className="h-[220px] -ml-6 -mb-6 mt-4">
                  {riasecData.length > 0 ? (
                    <BarChart 
                      data={riasecData.map(d => ({ name: d.name, score: d.score }))}
                      color="#0E1B3D"
                      height={220}
                      layout="vertical"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#0E1B3D]/40">
                      <p>Đang phân tích dữ liệu...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SUGGESTED CAREERS WIDGET */}
              <div className="bg-white/70 backdrop-blur-md rounded-[32px] p-6 md:p-8 border border-[#0E1B3D]/10 hover:shadow-[0_20px_50px_rgba(14,27,61,0.08)] transition-all group hover:-translate-y-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#B89862] to-[#E5CFA3] rounded-2xl flex items-center justify-center shadow-md">
                      <Briefcase className="w-6 h-6 text-[#0E1B3D]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-[#0E1B3D]">Gợi ý hàng đầu</h3>
                      <p className="text-sm text-[#0E1B3D]/50 font-light">Phù hợp nhất với hồ sơ của em</p>
                    </div>
                  </div>
                  <Link href="/explore?tab=recommended" className="text-xs font-bold text-[#0E1B3D] hover:text-[#B89862] transition-colors uppercase tracking-widest bg-[#0E1B3D]/5 px-4 py-2 rounded-full">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-4 flex-1">
                  {topMatches.map((match: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 hover:bg-white transition-all cursor-pointer border border-[#0E1B3D]/5 hover:shadow-md group/item">
                      <div className="w-16 h-16 bg-[#0E1B3D]/5 rounded-xl overflow-hidden relative flex-shrink-0 group-hover/item:scale-105 transition-transform">
                        {match.career.cover_image_url ? (
                          <Image src={match.career.cover_image_url} alt={match.career.name} fill className="object-cover" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-[#0E1B3D]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-lg text-[#0E1B3D] truncate group-hover/item:text-[#B89862] transition-colors">{match.career.name}</h4>
                        <p className="text-sm text-[#0E1B3D]/60 truncate">{match.career.career_domain_code || "Ngành nghề chung"}</p>
                      </div>
                      <div className="text-right flex-shrink-0 bg-gradient-to-br from-[#0E1B3D] to-[#2A3F70] px-4 py-2 rounded-xl shadow-inner">
                        <div className="text-sm font-bold text-white">{Math.round(match.match_score)}%</div>
                      </div>
                    </div>
                  ))}
                  
                  {topMatches.length === 0 && (
                     <div className="w-full h-full flex items-center justify-center text-[#0E1B3D]/40 min-h-[100px]">
                      <p>Chưa có dữ liệu gợi ý nghề nghiệp.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
