import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain, Briefcase, Map, Target, CheckCircle2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { RadarChart } from "@/components/ui/charts/radar-chart";

export default async function ParentChildViewPage({ params }: { params: { id: string } }) {
  const account = await getCurrentAccount();
  const parentId = account?.userId;
  if (!parentId) redirect("/login");

  const supabase = await createClient();

  // 1. Verify link & Permissions
  const { data: link } = await supabase
    .from("parent_child_links")
    .select("student_id, permissions:parent_sharing_permissions(career_profile_level, assessment_level, roadmap_level, academic_level)")
    .eq("parent_id", parentId)
    .eq("student_id", params.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!link) {
    redirect("/parent/dashboard");
  }

  const perm = link.permissions?.[0] || {};

  // 2. Fetch student profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, full_name, email")
    .eq("id", params.id)
    .maybeSingle();

  // 3. Lấy dữ liệu thật từ DB (Assessment, Goal, Roadmap)
  
  // Assessment
  let riasecScores: { name: string, score: number, color: string }[] | null = null;
  const { data: assessmentResult } = await supabase
    .from("assessment_results")
    .select("id")
    .eq("student_id", params.id)
    .eq("is_current", true)
    .maybeSingle();

  if (assessmentResult && perm.assessment_level > 0) {
    const { data: dimScores } = await supabase
      .from("assessment_result_dimensions")
      .select("score, assessment_dimensions(code, name, framework)")
      .eq("result_id", assessmentResult.id)
      .order("score", { ascending: false });

    if (dimScores && dimScores.length > 0) {
      const riasecData = dimScores.filter(d => (d.assessment_dimensions as any).framework === 'riasec');
      if (riasecData.length > 0) {
        riasecScores = riasecData.map(d => ({
          name: (d.assessment_dimensions as any).name || (d.assessment_dimensions as any).code,
          score: d.score,
          color: "#B89862"
        }));
      }
    }
  }

  // Matches
  let studentMatches: any[] = [];
  const { data: run } = await supabase
    .from('match_runs')
    .select('id')
    .eq('student_id', params.id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (run && perm.career_profile_level > 0) {
    const { data: matches } = await supabase
      .from('career_matches')
      .select(`match_score, career:career_id(id, name, career_domain_code, cover_image_url)`)
      .eq('run_id', run.id)
      .order('match_score', { ascending: false })
      .limit(4);
    if (matches) studentMatches = matches;
  }

  // Goal
  const { data: goal } = await supabase
    .from("student_goals")
    .select("careers(name)")
    .eq("student_id", params.id)
    .eq("is_primary", true)
    .eq("status", "active")
    .maybeSingle();

  // Roadmap & Tasks
  let completedTasks: any[] = [];
  if (perm.roadmap_level > 0) {
    const { data: recentActivity } = await supabase
      .from("task_completions")
      .select("created_at, roadmap_tasks(title)")
      .eq("student_id", params.id)
      .order("created_at", { ascending: false })
      .limit(3);
    if (recentActivity) completedTasks = recentActivity;
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#0E1B3D] pt-32 pb-40 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold uppercase tracking-wider mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
          
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center flex-shrink-0 text-[#0E1B3D] font-serif text-5xl shadow-xl">
              {profile?.full_name?.charAt(0) || profile?.display_name?.charAt(0) || "H"}
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-2 tracking-tight">
                Hồ sơ của {profile?.display_name || profile?.full_name || 'Con'}
              </h1>
              <p className="text-white/60 text-lg">Tôn trọng quyền riêng tư. Chỉ hiển thị thông tin con đồng ý chia sẻ.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-16 relative z-20 space-y-8">
        
        {/* ROW 1: Goal & Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CURRENT GOAL */}
          <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/10 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-[#B89862]" />
              </div>
              <h2 className="font-serif text-2xl text-[#0E1B3D]">Mục tiêu định vị</h2>
            </div>

            {goal ? (
              <div className="text-center bg-[#0E1B3D]/5 rounded-2xl p-8 border border-[#0E1B3D]/10">
                <div className="text-[#0E1B3D]/50 text-sm font-bold uppercase tracking-wider mb-2">Ngành nghề đang theo đuổi</div>
                <h3 className="font-serif text-3xl text-[#0E1B3D] mb-4">{(goal.careers as any)?.name}</h3>
                <Link href={`/careers/${(goal.careers as any)?.slug || '#'}`} className="inline-flex items-center text-sm font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors">
                  Tìm hiểu ngành này <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <div className="text-center bg-white rounded-2xl p-10 border-2 border-dashed border-[#0E1B3D]/20">
                <p className="text-[#0E1B3D]/50 text-lg">Con chưa thiết lập mục tiêu ưu tiên.</p>
              </div>
            )}
          </div>

          {/* ASSESSMENT RADAR */}
          <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#B89862]" />
              </div>
              <h2 className="font-serif text-2xl text-[#0E1B3D]">Khám phá Năng lực</h2>
            </div>
            
            {perm.assessment_level > 0 ? (
              riasecScores ? (
                <div className="h-[300px]">
                  <RadarChart 
                    data={riasecScores.map(s => ({
                      subject: s.name,
                      A: s.score,
                      fullMark: 100
                    }))}
                    color="#0E1B3D"
                    height={300}
                  />
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-center">
                  <p className="text-[#0E1B3D]/50 text-lg">Đang chờ con hoàn thành bài khảo sát RIASEC.</p>
                </div>
              )
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center">
                <p className="text-[#0E1B3D]/50 text-lg">Con thiết lập bảo mật: <strong>Không chia sẻ Bài test</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Matches & Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* CAREER MATCHES */}
          <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/10 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#B89862]" />
              </div>
              <h2 className="font-serif text-2xl text-[#0E1B3D]">Ngành nghề phù hợp nhất</h2>
            </div>

            {perm.career_profile_level > 0 ? (
              studentMatches.length > 0 ? (
                <div className="space-y-4">
                  {studentMatches.map((match: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0E1B3D]/5 border border-[#0E1B3D]/10">
                      <div className="w-16 h-16 bg-white rounded-xl overflow-hidden relative flex-shrink-0 shadow-sm">
                        {match.career.cover_image_url ? (
                          <Image src={match.career.cover_image_url} alt={match.career.name} fill className="object-cover" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-[#0E1B3D]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xl text-[#0E1B3D] truncate">{match.career.name}</h4>
                        <p className="text-sm text-[#0E1B3D]/60 truncate">{match.career.career_domain_code || "Ngành nghề chung"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-[#B89862]">{Math.round(match.match_score)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-[#0E1B3D]/10 rounded-2xl">
                  <p className="text-[#0E1B3D]/50 text-lg">Hệ thống AI đang đợi dữ liệu khảo sát từ con.</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-[#0E1B3D]/50 text-lg">Con thiết lập bảo mật: <strong>Không chia sẻ Gợi ý Nghề nghiệp</strong></p>
              </div>
            )}
          </div>

          {/* ROADMAP PROGRESS */}
          <div className="bg-[#0E1B3D] rounded-[32px] p-8 md:p-10 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <Map className="w-5 h-5 text-[#B89862]" />
              </div>
              <h2 className="font-serif text-2xl text-white">Hoạt động Lộ trình</h2>
            </div>

            {perm.roadmap_level > 0 ? (
              completedTasks.length > 0 ? (
                <div className="space-y-6">
                  {completedTasks.map((t: any, i: number) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg mb-1">{t.roadmap_tasks?.title}</p>
                        <p className="text-white/50 text-sm">{new Date(t.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/50 text-lg">Con chưa có hoạt động nào trong Lộ trình gần đây.</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <p className="text-white/50 text-lg">Con thiết lập bảo mật: <strong>Không chia sẻ Tiến độ Lộ trình</strong></p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
