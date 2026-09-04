import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, ChevronRight,
  GraduationCap, MapPin, Star, Target, TrendingUp, Zap,
  CheckCircle2, Circle, Award, Briefcase, Sparkles, Shield, Calendar
} from "lucide-react";
import { getFullReportData } from "@/features/career/actions/get-report-data";
import { getPremiumReportData } from "@/features/career/actions/get-premium-report-data";
import { generateReportSnapshot } from "@/features/career/actions/generate-report-snapshot";
import { SetGoalButton } from "./set-goal-button";
import { Chapter1 } from "./sections/PremiumChapter1";
import { Chapter2 } from "./sections/PremiumChapter2";
import { Chapter4 } from "./sections/PremiumChapter4";

// ─── Layout helpers ────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_4px_24px_rgba(14,27,61,0.07)] border border-[#0E1B3D]/8 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionBadge({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "gold" | "green" | "blue" }) {
  const styles: Record<string, string> = {
    purple: "bg-[#4A2545]/10 text-[#4A2545]",
    gold: "bg-[#B89862]/10 text-[#B89862]",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase ${styles[color]}`}>
      {children}
    </span>
  );
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#0E1B3D" strokeWidth="5" fill="none" opacity={0.08} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="url(#pg)" strokeWidth="5" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="pg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A2545" />
          <stop offset="100%" stopColor="#B89862" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const metadata = {
  title: "Báo cáo Premium — Hồ sơ Định hướng Toàn diện | 1learn.asia",
};

export default async function PremiumReportPage() {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("membership_subscriptions")
    .select("id, ends_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .gte("ends_at", new Date().toISOString())
    .limit(1)
    .single();

  if (!sub) {
    redirect("/membership");
  }

  let { data: reportDoc } = await supabase
    .from("student_reports")
    .select("id, assessment_result_id, report_data, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportDoc || !reportDoc.report_data) redirect("/me/bao-cao");

  // If user upgraded to premium but only has free snapshot OR missing narratives, upgrade it now!
  if (!reportDoc.report_data.premium || !reportDoc.report_data.premium.narratives) {
    await generateReportSnapshot(user.id, reportDoc.assessment_result_id);
    // Refetch
    const { data: refetched } = await supabase
      .from("student_reports")
      .select("id, assessment_result_id, report_data, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (refetched) reportDoc = refetched;
  }

  if (!reportDoc.report_data.premium) redirect("/me/bao-cao");

  type BaseReportType = NonNullable<Awaited<ReturnType<typeof getFullReportData>>>;
  type PremiumReportType = NonNullable<Awaited<ReturnType<typeof getPremiumReportData>>>;

  const baseReport = reportDoc.report_data.base as BaseReportType;
  const premiumData = reportDoc.report_data.premium as PremiumReportType;
  const completedDate = reportDoc.created_at ? new Date(reportDoc.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;

  const { hollandCode, hollandNames, aiNarrative, bigFive, workValues, topStrengths, studentInfo } = baseReport;

  const careerChain = premiumData?.careerChain || [];
  const gapAnalysis = premiumData?.gapAnalysis || [];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-28">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950 pt-28 pb-36 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-80px] right-[-80px] w-[450px] h-[450px] bg-emerald-400/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-[-60px] w-[350px] h-[350px] bg-teal-400/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <Link href="/me/bao-cao" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại Hồ sơ cơ bản
          </Link>

          <div className="mb-8 relative mt-4">
            {/* Ribbon / Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B89862]/20 border border-[#B89862]/30 mb-8 backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-[#B89862]" />
              <span className="text-[#B89862] text-xs font-bold tracking-widest uppercase">Báo cáo Định hướng Toàn diện · Premium</span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-y border-[#B89862]/20 py-10">
              {/* Left: Certificate Text & Student Info */}
              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-5xl text-white mb-3 leading-tight">
                  Báo Cáo Định Hướng Nghề Nghiệp
                </h1>
                <p className="text-[#B89862] text-sm md:text-base tracking-widest uppercase font-bold mb-10">
                  Hồ Sơ Cá Nhân Hóa Toàn Diện
                </p>

                <div className="flex items-center gap-6">
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl text-white flex-shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#B89862]/30 relative overflow-hidden"
                    style={{ backgroundColor: studentInfo.avatarColor }}
                  >
                    {studentInfo.avatarUrl ? (
                      <Image src={studentInfo.avatarUrl} alt="Avatar" fill className="object-cover" sizes="80px" />
                    ) : (
                      studentInfo.initials || "?"
                    )}
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold mb-1.5">Học sinh</p>
                    <p className="text-white font-serif text-2xl md:text-3xl leading-none mb-3">{studentInfo.displayName}</p>
                    <div className="flex flex-wrap items-center gap-4 md:gap-6 text-white/60 text-xs md:text-sm">
                      {studentInfo.grade && (
                        <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Lớp {studentInfo.grade}</span>
                      )}
                      {studentInfo.region && (
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {studentInfo.region}</span>
                      )}
                      {completedDate && (
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#B89862]" /> <span className="text-[#B89862] font-medium">{completedDate}</span></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Holland Code Badge */}
              <div className="bg-[#B89862]/5 backdrop-blur-xl border border-[#B89862]/20 rounded-[2rem] p-8 text-center min-w-[200px] flex-shrink-0 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#B89862]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="font-serif text-6xl md:text-7xl text-[#B89862] mb-3 leading-none drop-shadow-md">{hollandCode}</div>
                <div className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold">Mã Holland</div>
                <div className="text-sm text-white/90 mt-2 font-medium">{hollandNames}</div>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-white/80 text-base md:text-lg max-w-3xl leading-relaxed font-serif italic border-l-4 border-[#B89862]/60 pl-6 py-2">
                "{aiNarrative.profileSummary}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-20 space-y-8">

        {premiumData?.narratives && (
          <div className="mb-16">
            <Chapter1 
              narratives={premiumData.narratives}
              riasec={baseReport.riasec}
              bigFive={baseReport.bigFive}
              workValues={baseReport.workValues}
            />
            <Chapter2 
              narratives={premiumData.narratives}
              topStrengths={baseReport.topStrengths}
              developmentAreas={baseReport.developmentAreas}
            />
          </div>
        )}

        {/* ── CAREER → MAJOR → UNIVERSITY CHAIN ──────────────────────── */}
        {careerChain.length > 0 ? (
          <div>
            <div className="mb-6">
              <SectionBadge color="purple">Định hướng nghề nghiệp & Học tập</SectionBadge>
              <h2 className="font-serif text-2xl md:text-3xl text-[#0E1B3D] mt-3 mb-1">
                Lộ trình: Nghề nghiệp → Ngành học → Trường Đại học
              </h2>
              <p className="text-[#0E1B3D]/50 text-sm">
                Hệ thống đối chiếu hồ sơ của bạn với dữ liệu tuyển sinh thực tế từ Bộ Giáo dục & Đào tạo
              </p>
            </div>

            <div className="space-y-6">
              {careerChain.map((career, ci) => (
                <Card key={career.careerId} className="overflow-visible">
                  {/* Career header */}
                  <div className={`p-6 md:p-8 ${ci === 0 ? "bg-gradient-to-r from-[#1A0A1E] to-[#4A2545]" : "bg-gradient-to-r from-[#0E1B3D] to-[#1A2D5A]"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {/* Score ring */}
                        <div className="relative flex-shrink-0">
                          <ScoreRing score={career.matchScore} size={60} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white font-black text-sm">{career.matchScore}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-serif text-xl">{career.careerName}</span>
                            {ci === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#B89862]/30 text-[#B89862] text-[10px] font-black uppercase tracking-wider">
                                Khuyến nghị #1
                              </span>
                            )}
                          </div>
                          {career.category && (
                            <span className="text-white/50 text-xs">{career.category}</span>
                          )}
                        </div>
                      </div>

                      {/* Set as Goal button */}
                      <SetGoalButton careerId={career.careerId} careerName={career.careerName} />
                    </div>

                    {career.description && (
                      <p className="text-white/60 text-sm mt-4 leading-relaxed line-clamp-2">{career.description}</p>
                    )}

                    {premiumData?.narratives?.careerReasons?.[career.careerId] && (
                      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl flex gap-3 items-start">
                        <Sparkles className="w-4 h-4 text-[#B89862] flex-shrink-0 mt-0.5" />
                        <p className="text-white/80 text-sm leading-relaxed">
                          {premiumData.narratives.careerReasons[career.careerId]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Majors → Universities */}
                  {career.majors.length > 0 ? (
                    <div className="p-6 md:p-8 space-y-5">
                      <div className="flex items-center gap-2 text-[#0E1B3D]/50 text-xs font-bold uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" />
                        Ngành học phù hợp với nghề này
                      </div>

                      {career.majors.map((major, mi) => (
                        <div key={major.majorCode} className={`rounded-2xl border ${mi === 0 ? "border-[#B89862]/30 bg-[#B89862]/5" : "border-[#0E1B3D]/8 bg-[#0E1B3D]/2"} p-5`}>
                          {/* Major header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {mi === 0 && <Star className="w-4 h-4 text-[#B89862] fill-[#B89862] flex-shrink-0" />}
                                <span className="font-bold text-[#0E1B3D]">{major.majorName}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {major.fieldName && (
                                  <span className="text-xs text-[#0E1B3D]/50">{major.fieldName}</span>
                                )}
                                <span className="text-xs font-mono text-[#0E1B3D]/30">{major.majorCode}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-black text-[#B89862]">{major.relevanceScore}%</div>
                              <div className="text-[10px] text-[#0E1B3D]/40 uppercase">Phù hợp</div>
                            </div>
                          </div>

                          {/* Universities */}
                          {major.universities.length > 0 ? (
                            <div>
                              <div className="flex items-center gap-2 text-[#0E1B3D]/40 text-[10px] font-bold uppercase tracking-wider mb-3">
                                <Building2 className="w-3 h-3" /> Trường đang đào tạo ngành này
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {major.universities.map((uni) => (
                                  <Link
                                    key={uni.universityId}
                                    href={`/universities/${uni.universityId}`}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-[#0E1B3D]/8 hover:border-[#4A2545]/25 hover:bg-[#4A2545]/4 transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-xl bg-[#0E1B3D]/5 flex items-center justify-center flex-shrink-0">
                                      <GraduationCap className="w-4 h-4 text-[#0E1B3D]/50 group-hover:text-[#4A2545] transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-[#0E1B3D] text-xs truncate group-hover:text-[#4A2545] transition-colors">
                                        {uni.shortName || uni.universityName}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {uni.province && (
                                          <span className="text-[10px] text-[#0E1B3D]/40 flex items-center gap-0.5">
                                            <MapPin className="w-2.5 h-2.5" />{uni.province}
                                          </span>
                                        )}
                                        {uni.maxScore && (
                                          <span className="text-[10px] font-bold text-[#B89862]">
                                            ≤ {uni.maxScore} điểm
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-[#0E1B3D]/25 group-hover:text-[#4A2545] flex-shrink-0 transition-colors" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[#0E1B3D]/40 text-xs italic">Đang cập nhật danh sách trường.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-[#0E1B3D]/40 text-sm italic">
                      Đang cập nhật thông tin ngành học cho nghề này.
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-[#0E1B3D]/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-[#0E1B3D] mb-2">Chưa có gợi ý nghề nghiệp</h3>
            <p className="text-[#0E1B3D]/50 text-sm mb-6">Hãy hoàn thành bài khảo sát để hệ thống phân tích và gợi ý nghề nghiệp phù hợp nhất.</p>
            <Link href="/me/kham-pha" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0E1B3D] text-white font-bold text-sm hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all">
              Hoàn thành khảo sát <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        )}

        {/* ── REQUIRED SKILLS ────────────────────────────────────────────── */}
        {gapAnalysis.length > 0 && (
          <Card className="p-8 md:p-10">
            <div className="mb-6">
              <SectionBadge color="gold">Năng lực & Kỹ năng yêu cầu</SectionBadge>
              <h2 className="font-serif text-2xl text-[#0E1B3D] mt-3 mb-1 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-[#B89862]" />
                Kỹ năng cần thiết cho nghề #1
              </h2>
              <p className="text-[#0E1B3D]/50 text-sm">
                Dựa trên yêu cầu chung của <strong>{careerChain[0]?.careerName}</strong>. 
                Hệ thống đánh dấu các kỹ năng mà bạn có thiên hướng quan tâm dựa trên kết quả sở thích (để tham khảo).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gapAnalysis.map((item, i) => (
                <Link 
                  href={`/providers?skill=${encodeURIComponent(item.skill)}`}
                  key={i} 
                  className={`flex items-center gap-3 p-4 rounded-2xl border group transition-all hover:scale-[1.02] ${item.hasIt ? "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/60" : "bg-[#0E1B3D]/2 border-[#0E1B3D]/10 hover:bg-[#0E1B3D]/5"}`}
                >
                  {item.hasIt ? (
                    <Star className="w-5 h-5 text-emerald-500 fill-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#0E1B3D]/20 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={`font-semibold text-sm group-hover:underline ${item.hasIt ? "text-emerald-800" : "text-[#0E1B3D]"}`}>
                      {item.skill}
                    </span>
                    <p className={`text-[10px] mt-0.5 ${item.hasIt ? "text-emerald-600 font-medium" : "text-[#0E1B3D]/40"}`}>
                      {item.hasIt ? "Sở trường tiềm năng dựa trên sở thích" : "Yêu cầu cơ bản của nghề"}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${item.hasIt ? "text-emerald-600" : "text-[#0E1B3D]/40"}`} />
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Chapter4 narratives={premiumData?.narratives} />

        {/* ── DISCLAIMER ───────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-[#0E1B3D]/8">
          <Shield className="w-5 h-5 text-[#0E1B3D]/25 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#0E1B3D]/40 leading-relaxed">
            Báo cáo này mang tính chất <strong>gợi ý tham khảo</strong> dựa trên kết quả tự đánh giá. Thông tin về ngành học và điểm chuẩn được tổng hợp từ dữ liệu tuyển sinh công khai và có thể thay đổi theo từng năm. Hãy tham khảo thêm giáo viên, phụ huynh và thông tin chính thức từ nhà trường trước khi đưa ra quyết định.
          </p>
        </div>

      </div>
    </div>
  );
}
