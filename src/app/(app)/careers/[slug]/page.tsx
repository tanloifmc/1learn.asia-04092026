import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { notFound, redirect } from "next/navigation";
import { RoadmapTriggerButton } from "@/components/roadmap/roadmap-trigger-button";
import { ExplorationTracker } from "@/components/analytics/exploration-tracker";
import { Briefcase, BookOpen, GraduationCap, TrendingUp, DollarSign, Target } from "lucide-react";
import Link from "next/link";

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) {
    redirect("/login");
  }
  const { slug } = await params;
  const supabase = await createClient();

  const { data: career } = await supabase
    .from("careers")
    .select(`
      *,
      career_major_mappings (
        major_id,
        majors (
          id,
          name,
          slug,
          field
        )
      )
    `)
    .eq("code", slug)
    .single();

  if (!career) notFound();

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      <ExplorationTracker type="CAREER" targetId={career.id} slug={career.code} />

      {/* HERO SECTION */}
      <section className="bg-[#0E1B3D] pt-32 pb-40 md:pt-40 md:pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -ml-20 -mt-20"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[80px] -mr-20 -mb-20"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-6 bg-white/5 backdrop-blur-md">
            {career.job_family || "Lĩnh vực nghề nghiệp"}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            {career.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/60 font-medium">
            <span className="bg-white/10 px-3 py-1 rounded-md font-mono">{career.code}</span>
            {career.riasec_primary && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89862]"></span>
                <span className="text-[#B89862] font-bold tracking-widest">{career.riasec_primary}</span>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(14,27,61,0.05)] border border-[#0E1B3D]/10">
          
          {/* Main Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 pb-8 border-b border-[#0E1B3D]/10">
            <div>
              <p className="text-[#0E1B3D]/60 text-sm font-bold uppercase tracking-wider mb-2">Sẵn sàng để bắt đầu?</p>
              <h3 className="font-serif text-2xl text-[#0E1B3D]">Theo đuổi sự nghiệp này</h3>
            </div>
            {account && (
              <RoadmapTriggerButton 
                studentId={account.userId} 
                targetType="career" 
                targetId={career.id} 
              />
            )}
          </div>

          <div className="prose prose-lg prose-[#0E1B3D] max-w-none mb-12">
            <p className="text-xl leading-relaxed text-[#0E1B3D]/80 font-serif">
              {career.description || "Chưa có thông tin mô tả chi tiết."}
            </p>
          </div>

          {/* Quick Stats/Market Data (Mocked display for now based on data structure) */}
          {career.market_data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {career.market_data.salary && (
                <div className="bg-[#0E1B3D]/5 p-6 rounded-[24px] border border-[#0E1B3D]/10 flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0E1B3D]/50 uppercase tracking-wider mb-1">Mức lương trung bình</h4>
                    <p className="text-xl font-bold text-[#0E1B3D]">
                      ~{(career.market_data.salary.max / 1000000).toFixed(0)} triệu VNĐ
                    </p>
                  </div>
                </div>
              )}
              
              <div className="bg-[#0E1B3D]/5 p-6 rounded-[24px] border border-[#0E1B3D]/10 flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#B89862]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0E1B3D]/50 uppercase tracking-wider mb-1">Nhu cầu thị trường</h4>
                  <p className="text-xl font-bold text-[#0E1B3D]">Rất Cao</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills */}
            {career.skills && career.skills.length > 0 && (
              <div className="bg-white border border-[#0E1B3D]/10 p-8 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#0E1B3D]" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#0E1B3D]">
                    Kỹ năng chuyên môn
                  </h3>
                </div>
                <ul className="space-y-3">
                  {career.skills.map((skill: string, idx: number) => (
                    <li key={idx} className="flex items-start text-[#0E1B3D]/70 bg-[#0E1B3D]/5 p-3 rounded-xl font-medium">
                      <span className="text-[#B89862] mr-3 font-bold">•</span> {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Academic Requirements */}
            {career.academic_requirements && Object.keys(career.academic_requirements).length > 0 && (
              <div className="bg-white border border-[#0E1B3D]/10 p-8 rounded-[32px] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#0E1B3D]/5 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-[#0E1B3D]" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#0E1B3D]">
                    Yêu cầu học thuật
                  </h3>
                </div>
                <div className="space-y-6">
                  {(career.academic_requirements as any).min_degree && (
                    <div className="border-l-2 border-[#B89862] pl-4">
                      <div className="text-xs text-[#0E1B3D]/50 uppercase font-bold tracking-wider mb-1">Bằng cấp tối thiểu</div>
                      <div className="text-[#0E1B3D] font-bold text-lg capitalize">{(career.academic_requirements as any).min_degree}</div>
                    </div>
                  )}
                  {(career.academic_requirements as any).min_gpa && (
                    <div className="border-l-2 border-[#0E1B3D] pl-4">
                      <div className="text-xs text-[#0E1B3D]/50 uppercase font-bold tracking-wider mb-1">GPA Khuyến nghị</div>
                      <div className="text-[#0E1B3D] font-bold text-lg">{(career.academic_requirements as any).min_gpa}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Related Majors Section */}
          {career.career_major_mappings && career.career_major_mappings.length > 0 && (
            <div className="mt-12 pt-12 border-t border-[#0E1B3D]/10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#B89862]/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#B89862]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#0E1B3D]">
                  Ngành học đề xuất cho nghề này
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {career.career_major_mappings.map((mapping: any, idx: number) => {
                  const major = mapping.majors;
                  if (!major) return null;
                  return (
                    <Link href={`/majors/${major.slug}`} key={idx} className="block group">
                      <div className="bg-white border border-[#0E1B3D]/10 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group-hover:border-[#B89862]">
                        <span className="text-xs font-semibold px-2 py-1 bg-[#0E1B3D]/5 text-[#0E1B3D]/70 rounded-md mb-3 inline-block">
                          {major.field || 'Đa lĩnh vực'}
                        </span>
                        <h4 className="text-lg font-bold text-[#0E1B3D] mb-1 group-hover:text-[#B89862] transition-colors">
                          {major.name}
                        </h4>
                        <p className="text-sm text-[#0E1B3D]/60 mt-4 flex items-center gap-1 font-medium">
                          Tìm hiểu các trường đào tạo <span className="text-[#B89862]">→</span>
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
