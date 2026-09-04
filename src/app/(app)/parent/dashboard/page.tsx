import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Brain, Briefcase, ChevronRight, Lock, Target, Info } from "lucide-react";
import Image from "next/image";
import { RadarChart } from "@/components/ui/charts/radar-chart";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get linked students and their permissions
  const { data: links } = await supabase
    .from("parent_child_links")
    .select(`
      id,
      student_id,
      accepted_at,
      student:profiles!parent_child_links_student_id_fkey(full_name, email),
      permissions:parent_sharing_permissions(career_profile_level, assessment_level, roadmap_level, academic_level, updated_at)
    `)
    .eq("parent_id", user.id)
    .eq("status", "accepted");

  // Data mapping for first student
  let studentMatches: any[] = [];
  let studentMatchRun = null;
  let riasecScores: { name: string, score: number, color: string }[] | null = null;
  let topStrengthText = "";

  if (links && links.length > 0) {
    const studentId = links[0].student_id;
    const perm = links[0].permissions?.[0] || {};
    
    // Only fetch if they have some permission
    if (perm.career_profile_level && perm.career_profile_level > 0) {
      
      // 1. Lấy kết quả Test (Assessment Results) để hiển thị Radar
      const { data: assessmentResult } = await supabase
        .from("assessment_results")
        .select("id")
        .eq("student_id", studentId)
        .eq("is_current", true)
        .maybeSingle();

      if (assessmentResult) {
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
            topStrengthText = `Con có xu hướng nổi trội ở nhóm ${(riasecData[0].assessment_dimensions as any).name}. Đây là những người thích làm việc độc lập, có tư duy logic và chuyên môn sâu.`;
          }
        }
      }

      // 2. Lấy Match Runs (Gợi ý nghề nghiệp)
      const { data: run } = await supabase
        .from('match_runs')
        .select('*')
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (run) {
        studentMatchRun = run;
        const { data: matches } = await supabase
          .from('career_matches')
          .select(`
            match_score,
            career:career_id (
              id, name, career_domain_code, description, cover_image_url
            )
          `)
          .eq('run_id', run.id)
          .order('match_score', { ascending: false })
          .limit(3);
          
        if (matches) studentMatches = matches;
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#0E1B3D] pt-32 pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -ml-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4 bg-white/5 backdrop-blur-md">
                Parent Portal
              </div>
              <h1 className="font-serif text-4xl md:text-5xl text-white mb-2">Báo cáo Phụ huynh</h1>
              <p className="text-white/60 text-lg">Đồng hành cùng con trên chặng đường kiến tạo tương lai.</p>
            </div>
            <Link
              href="/parent/link"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B89862] text-[#0E1B3D] rounded-full font-bold hover:bg-white transition-colors"
            >
              Liên kết tài khoản con <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        {(!links || links.length === 0) ? (
          <div className="bg-white rounded-[32px] p-6 md:p-12 text-center border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.05)]">
            <div className="w-20 h-20 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#0E1B3D]/30" />
            </div>
            <h3 className="font-serif text-2xl text-[#0E1B3D] mb-4">Chưa liên kết tài khoản</h3>
            <p className="text-[#0E1B3D]/60 max-w-md mx-auto mb-8">
              Để xem báo cáo chi tiết, phụ huynh vui lòng yêu cầu mã liên kết từ tài khoản 1learn của con và nhập vào hệ thống.
            </p>
            <Link
              href="/parent/link"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors shadow-md"
            >
              Nhập mã liên kết ngay <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {links.map((link: any, index: number) => {
              const perm = link.permissions?.[0] || {};
              const isFirstStudent = index === 0; // Focus dashboard on the first student for now
              
              return (
                <div key={link.id} className="space-y-8">
                  {/* STUDENT ID CARD */}
                  <div className="bg-white rounded-[32px] p-6 md:p-10 border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-[#B89862]/5 rounded-full blur-[50px] -mr-20 -mt-20"></div>
                    
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-[#0E1B3D] rounded-full flex items-center justify-center flex-shrink-0 text-white font-serif text-4xl border-4 border-white shadow-lg z-10">
                      {link.student?.full_name?.charAt(0) || "H"}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <h2 className="font-serif text-3xl md:text-4xl text-[#0E1B3D]">{link.student?.full_name || "Học sinh"}</h2>
                        <Link href={`/parent/child/${link.student_id}`} className="inline-flex items-center text-sm font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors uppercase tracking-wider">
                          Xem hồ sơ đầy đủ <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                      <p className="text-[#0E1B3D]/60 text-lg mb-6">{link.student?.email}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-[#0E1B3D]/5 pt-6">
                        <div>
                          <div className="text-xs font-bold text-[#0E1B3D]/40 uppercase tracking-wider mb-1">Nghề nghiệp</div>
                          <div className="font-medium text-[#0E1B3D]">{getPermissionText(perm.career_profile_level)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0E1B3D]/40 uppercase tracking-wider mb-1">Bài test</div>
                          <div className="font-medium text-[#0E1B3D]">{getPermissionText(perm.assessment_level)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0E1B3D]/40 uppercase tracking-wider mb-1">Lộ trình</div>
                          <div className="font-medium text-[#0E1B3D]">{getPermissionText(perm.roadmap_level)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0E1B3D]/40 uppercase tracking-wider mb-1">Học bạ</div>
                          <div className="font-medium text-[#0E1B3D]">{getPermissionText(perm.academic_level)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DATA VISUALIZATION AREA (Only show if permitted) */}
                  {isFirstStudent && perm.career_profile_level > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* PERSONALITY/ABILITY CHART */}
                      <div className="lg:col-span-5 bg-white rounded-[32px] p-6 md:p-8 border border-[#0E1B3D]/10 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
                            <Brain className="w-5 h-5 text-[#B89862]" />
                          </div>
                          <h3 className="font-serif text-2xl text-[#0E1B3D]">Hồ sơ năng lực</h3>
                        </div>

                        {riasecScores ? (
                          <div className="space-y-6">
                            <div className="h-[280px] -mt-4">
                              <RadarChart 
                                data={riasecScores.map(s => ({
                                  subject: s.name,
                                  A: s.score,
                                  fullMark: 100
                                }))}
                                color="#B89862"
                                height={280}
                              />
                            </div>
                            <div className="mt-8 p-4 bg-[#B89862]/10 rounded-2xl border border-[#B89862]/20">
                              <p className="text-sm text-[#0E1B3D]/80 leading-relaxed">
                                <span className="font-bold text-[#B89862]">Phân tích:</span> {topStrengthText}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-[#0E1B3D]/50 mb-4">Con chưa hoàn thành bài khảo sát nào.</p>
                          </div>
                        )}
                      </div>

                      {/* RECOMMENDED CAREERS */}
                      <div className="lg:col-span-7 bg-white rounded-[32px] p-6 md:p-8 border border-[#0E1B3D]/10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
                              <Target className="w-5 h-5 text-[#B89862]" />
                            </div>
                            <h3 className="font-serif text-2xl text-[#0E1B3D]">Nghề nghiệp gợi ý</h3>
                          </div>
                          <Link href={`/parent/child/${link.student_id}`} className="text-sm font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors uppercase tracking-wider">
                            Xem tất cả
                          </Link>
                        </div>

                        {studentMatches.length > 0 ? (
                          <div className="space-y-4">
                            {studentMatches.map((match: any, idx: number) => (
                              <div key={idx} className="group flex items-center gap-4 p-4 rounded-2xl border border-[#0E1B3D]/5 hover:border-[#B89862]/30 hover:bg-[#B89862]/5 transition-all cursor-pointer">
                                <div className="w-16 h-16 bg-[#0E1B3D]/5 rounded-xl overflow-hidden relative flex-shrink-0">
                                  {match.career.cover_image_url ? (
                                    <Image src={match.career.cover_image_url} alt={match.career.name} fill className="object-cover" />
                                  ) : (
                                    <Briefcase className="w-6 h-6 text-[#0E1B3D]/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-serif text-lg text-[#0E1B3D] truncate group-hover:text-[#B89862] transition-colors">{match.career.name}</h4>
                                  <p className="text-sm text-[#0E1B3D]/60 truncate">{match.career.career_domain_code || "Ngành nghề chung"}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xl font-bold text-[#0E1B3D]">{Math.round(match.match_score)}%</div>
                                  <div className="text-xs text-[#0E1B3D]/50 uppercase">Phù hợp</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-20 border-2 border-dashed border-[#0E1B3D]/10 rounded-2xl">
                            <p className="text-[#0E1B3D]/50">Chưa có dữ liệu gợi ý. Hệ thống đang đợi kết quả khảo sát.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* GUIDING PRINCIPLES */}
        <div className="mt-12 bg-white border border-[#B89862]/20 rounded-3xl p-6 md:p-8 flex items-start gap-4 shadow-sm">
          <Info className="w-6 h-6 text-[#B89862] flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-serif text-xl text-[#0E1B3D] mb-2">Nguyên tắc đồng hành: Hỗ trợ, không kiểm soát</h4>
            <p className="text-[#0E1B3D]/70 leading-relaxed">
              Vai trò của bạn với tư cách phụ huynh là hỗ trợ hành trình khám phá nghề nghiệp của con. Học sinh hoàn toàn kiểm soát dữ liệu họ muốn chia sẻ. Hãy tôn trọng quyền riêng tư của con và sử dụng thông tin được chia sẻ để có những cuộc trò chuyện ý nghĩa, gợi mở hướng đi thay vì áp đặt lựa chọn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPermissionText(level?: number) {
  switch (level) {
    case 2:
      return "Chi tiết đầy đủ";
    case 1:
      return "Chỉ tóm tắt";
    default:
      return "Không chia sẻ";
  }
}
