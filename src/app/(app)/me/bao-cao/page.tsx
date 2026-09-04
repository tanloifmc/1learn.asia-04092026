import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Brain, Briefcase, GraduationCap, Sparkles,
  TrendingUp, Lock, Target, ChevronRight, Star, BarChart2,
  Compass, Zap, Award, BookOpen, CheckCircle, XCircle,
  MapPin, Calendar, Shield
} from "lucide-react";
import { RadarChart } from "@/components/ui/charts/radar-chart";
import { getFullReportData } from "@/features/career/actions/get-report-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl shadow-[0_4px_24px_rgba(14,27,61,0.06)] border border-[#0E1B3D]/8 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children, color = "gold" }: { children: React.ReactNode; color?: "gold" | "purple" | "green" | "blue" }) {
  const styles = {
    gold: "bg-[#B89862]/10 text-[#B89862]",
    purple: "bg-[#4A2545]/10 text-[#4A2545]",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <div className={`inline-flex items-center px-3 py-1.5 rounded-full mb-4 ${styles[color]}`}>
      <span className="text-[10px] font-black tracking-[0.15em] uppercase">{children}</span>
    </div>
  );
}

function ScoreBar({ score, color = "#4A2545", label, description }: {
  score: number; color?: string; label?: string; description?: string | null;
}) {
  const pct = Math.min(Math.max(score, 0), 100);
  const tier = pct >= 75 ? "Nổi bật" : pct >= 55 ? "Tốt" : pct >= 40 ? "Trung bình" : "Cần phát triển";
  const tierColor = pct >= 75 ? "text-emerald-600" : pct >= 55 ? "text-blue-600" : pct >= 40 ? "text-amber-600" : "text-rose-500";
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[#0E1B3D]">{label}</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${tierColor}`}>{tier}</span>
            <span className="text-sm font-bold text-[#0E1B3D]">{pct}</span>
          </div>
        </div>
      )}
      <div className="h-2.5 w-full bg-[#0E1B3D]/6 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {description && <p className="text-[10px] text-[#0E1B3D]/40 line-clamp-1">{description}</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-[#F0F4FF] flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-[40px] p-6 md:p-12 text-center border border-[#0E1B3D]/8 shadow-2xl">
        <div className="w-20 h-20 bg-gradient-to-br from-[#4A2545] to-[#713E67] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h2 className="font-serif text-3xl mb-3 text-[#0E1B3D]">Báo cáo đang chờ bạn</h2>
        <p className="text-[#0E1B3D]/60 mb-8 leading-relaxed">
          Hoàn thành bài khảo sát 121 câu để hệ thống phác họa hồ sơ năng lực và định hướng nghề nghiệp phù hợp nhất cho bạn.
        </p>
        <Link href="/me/kham-pha" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold bg-[#4A2545] text-white hover:bg-[#B89862] hover:text-[#4A2545] transition-all shadow-md">
          Bắt đầu khảo sát <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Feature comparison data ──────────────────────────────────────────────────

const FEATURES = [
  { label: "Hồ sơ Holland (RIASEC) đầy đủ", free: true, premium: true },
  { label: "Phân tích Tính cách (Big Five)", free: true, premium: true },
  { label: "Top 3 nghề nghiệp gợi ý", free: true, premium: true },
  { label: "Giá trị nghề nghiệp cốt lõi", free: true, premium: true },
  { label: "AI Narrative cá nhân hóa đầy đủ", free: false, premium: true },
  { label: "Gợi ý các ngành học phù hợp", free: false, premium: true },
  { label: "Tham khảo thông tin trường Đại học", free: false, premium: true },
  { label: "Gap Analysis kỹ năng theo nghề", free: false, premium: true },
  { label: "Lộ trình học tập cụ thể theo năm", free: false, premium: true },
  { label: "Quản lý & theo dõi mục tiêu", free: false, premium: true },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Hồ sơ Bản thân - 1learn.asia",
  description: "Báo cáo phân tích năng lực và định hướng nghề nghiệp cá nhân hóa.",
};

export default async function ReportPage() {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: reportDoc } = await supabase
    .from("student_reports")
    .select("report_data, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reportDoc || !reportDoc.report_data || !reportDoc.report_data.base) return <EmptyState />;

  type ReportType = NonNullable<Awaited<ReturnType<typeof getFullReportData>>>;
  const report = reportDoc.report_data.base as ReportType;
  const createdAt = reportDoc.created_at;

  const {
    riasec, bigFive, workValues, topStrengths, developmentAreas,
    hollandCode, hollandNames, aiNarrative, careerMatches,
    confidence, studentInfo,
  } = report;

  const confidencePct = Math.round((confidence || 0) * 100);
  const completedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-emerald-950 pt-28 pb-36 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="mb-8 relative">
            {/* Ribbon / Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#B89862]" />
              <span className="text-white/90 text-xs font-bold tracking-widest uppercase">Báo cáo Khám phá Bản thân · Miễn phí</span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-y border-white/10 py-10">
              {/* Left: Certificate Text & Student Info */}
              <div className="flex-1">
                <h1 className="font-serif text-3xl md:text-5xl text-white mb-3 leading-tight">
                  Báo Cáo Định Hướng Nghề Nghiệp
                </h1>
                <p className="text-[#B89862] text-sm md:text-base tracking-widest uppercase font-bold mb-10">
                  Hồ Sơ Cá Nhân Hóa
                </p>

                <div className="flex items-center gap-6">
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl text-white flex-shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/20 relative overflow-hidden"
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
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {completedDate}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Holland Code Badge */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 text-center min-w-[200px] flex-shrink-0 relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="font-serif text-5xl md:text-6xl md:text-7xl text-[#B89862] mb-3 leading-none drop-shadow-md">{hollandCode}</div>
                <div className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">Mã Holland</div>
                <div className="text-sm text-white/80 mt-2 font-medium">{hollandNames}</div>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-white/70 text-base md:text-lg max-w-3xl leading-relaxed font-serif italic border-l-4 border-[#B89862]/50 pl-6 py-2">
                "{aiNarrative.profileSummary}"
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 space-y-6">

        {/* ── AI NARRATIVE ───────────────────────────────────────────── */}
        <Card className="p-6 md:p-10 bg-gradient-to-br from-white to-[#FFF8F2]">
          <div className="flex items-start justify-between mb-5">
            <SectionLabel color="gold">Câu chuyện về bạn</SectionLabel>

          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-[#0E1B3D] mb-6 leading-tight">{aiNarrative.headline}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span className="font-bold text-emerald-700 text-xs uppercase tracking-wide">Điểm mạnh nổi bật</span>
              </div>
              <p className="text-emerald-900 text-sm leading-relaxed">{aiNarrative.strengthNarrative}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-700 text-xs uppercase tracking-wide">Vùng phát triển</span>
              </div>
              <p className="text-amber-900 text-sm leading-relaxed">{aiNarrative.growthNarrative}</p>
            </div>
          </div>
          <div className="bg-[#4A2545]/5 border border-[#4A2545]/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-[#4A2545]" />
              <span className="font-bold text-[#4A2545] text-xs uppercase tracking-wide">Gợi ý nghề nghiệp</span>
            </div>
            <p className="text-[#0E1B3D] text-sm leading-relaxed">{aiNarrative.careerNarrative}</p>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 mt-5 p-4 bg-[#0E1B3D]/3 rounded-xl">
            <Shield className="w-4 h-4 text-[#0E1B3D]/40 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#0E1B3D]/40 leading-relaxed">
              Báo cáo này mang tính chất <strong>gợi ý tham khảo</strong> dựa trên kết quả tự đánh giá. Mỗi cá nhân có thể có nhiều tiềm năng hơn những gì phản ánh qua một bài khảo sát.
            </p>
          </div>
        </Card>

        {/* ── RIASEC + BIG FIVE ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8">
            <SectionLabel color="purple">Sở thích nghề nghiệp</SectionLabel>
            <h2 className="font-serif text-xl font-bold text-[#0E1B3D] mb-1 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#B89862]" /> Mô hình Holland (RIASEC)
            </h2>
            <p className="text-[#0E1B3D]/50 text-xs mb-5">Xu hướng môi trường làm việc phù hợp với bạn</p>
            {riasec.length > 0 && (
              <div className="h-[200px] mb-5">
                <RadarChart data={riasec.map(s => ({ subject: s.name, A: s.score, fullMark: 100 }))} color="#4A2545" height={200} />
              </div>
            )}
            <div className="space-y-3">
              {riasec.slice(0, 3).map((r, i) => {
                const cols = ["#4A2545", "#713E67", "#B89862"];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0" style={{ backgroundColor: cols[i] }}>
                      {r.code.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <ScoreBar score={r.score} color={cols[i]} label={r.name} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <SectionLabel color="purple">Tính cách</SectionLabel>
            <h2 className="font-serif text-xl font-bold text-[#0E1B3D] mb-1 flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#B89862]" /> Big Five Personality
            </h2>
            <p className="text-[#0E1B3D]/50 text-xs mb-5">5 chiều tính cách được nghiên cứu khoa học rộng rãi nhất</p>
            <div className="space-y-4">
              {bigFive.map((d, i) => {
                const cols = ["#4A2545", "#713E67", "#B89862", "#6B5B45", "#8B7355"];
                return <ScoreBar key={i} score={d.score} color={cols[i % cols.length]} label={d.name} description={d.description} />;
              })}
            </div>
          </Card>
        </div>

        {/* ── WORK VALUES ─────────────────────────────────────────────── */}
        {workValues.length > 0 && (
          <Card className="p-6 md:p-8">
            <SectionLabel color="green">Giá trị nghề nghiệp</SectionLabel>
            <h2 className="font-serif text-xl font-bold text-[#0E1B3D] mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#B89862]" /> Điều bạn tìm kiếm trong công việc
            </h2>
            <p className="text-[#0E1B3D]/50 text-xs mb-6">Khi làm việc phù hợp với giá trị cốt lõi, sự thỏa mãn nghề nghiệp tăng đáng kể</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workValues.slice(0, 6).map((wv, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${i < 3 ? "bg-[#4A2545]/5 border-[#4A2545]/15" : "bg-[#0E1B3D]/3 border-[#0E1B3D]/8"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#0E1B3D]">{wv.name}</span>
                    {i < 3 && <span className="text-[10px] font-black uppercase tracking-wider text-[#B89862] bg-[#B89862]/10 px-2 py-0.5 rounded-full">Top {i + 1}</span>}
                  </div>
                  <ScoreBar score={wv.score} color={i < 3 ? "#4A2545" : "#B89862"} />
                  {wv.description && <p className="text-[10px] text-[#0E1B3D]/50 mt-1.5 line-clamp-2">{wv.description}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── STRENGTHS vs DEVELOPMENT ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8">
            <SectionLabel color="green">Điểm mạnh</SectionLabel>
            <h2 className="font-serif text-xl font-bold text-[#0E1B3D] mb-5 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" /> Năng lực nổi bật
            </h2>
            {topStrengths.length > 0 ? (
              <div className="space-y-4">
                {topStrengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-700 font-black text-[10px]">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#0E1B3D]">{s.name}</span>
                        <span className="text-sm font-black text-emerald-600">{s.score}</span>
                      </div>
                      {s.description && <p className="text-[11px] text-[#0E1B3D]/50 line-clamp-2">{s.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#0E1B3D]/40 italic text-sm">Hoàn thành toàn bộ khảo sát để xem điểm mạnh.</p>
            )}
          </Card>

          <Card className="p-6 md:p-8">
            <SectionLabel>Phát triển</SectionLabel>
            <h2 className="font-serif text-xl font-bold text-[#0E1B3D] mb-5 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-500" /> Vùng cần đầu tư thêm
            </h2>
            {developmentAreas.length > 0 ? (
              <div className="space-y-4">
                {developmentAreas.map((d, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-[#0E1B3D]">{d.name}</span>
                        <span className="text-sm font-black text-amber-600">{d.score}</span>
                      </div>
                      <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${d.score}%` }} />
                      </div>
                      {d.description && <p className="text-[11px] text-[#0E1B3D]/50 mt-1.5 line-clamp-2">{d.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-2xl p-5 text-center">
                <p className="text-emerald-700 font-semibold text-sm">🎉 Không có vùng yếu đáng kể!</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── CAREER MATCHES (Preview — Top 3 only) ──────────────────── */}
        {careerMatches.length > 0 && (
          <Card className="p-6 md:p-10">
            <SectionLabel color="purple">Gợi ý nghề nghiệp</SectionLabel>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0E1B3D] flex items-center gap-2 mb-1">
                  <Briefcase className="w-6 h-6 text-[#B89862]" /> Nghề nghiệp có thể phù hợp
                </h2>
                <p className="text-[#0E1B3D]/50 text-sm">Dựa trên hồ sơ RIASEC · Tính cách · Giá trị nghề nghiệp</p>
              </div>
            </div>
            <div className="space-y-3 mb-4">
              {careerMatches.slice(0, 3).map((match, i) => (
                <Link key={match.careerId} href={`/careers/${match.careerId}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-[#0E1B3D]/8 hover:border-[#4A2545]/30 hover:bg-[#4A2545]/3 transition-all group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${i === 0 ? "bg-[#4A2545] text-white" : i === 1 ? "bg-[#4A2545]/10 text-[#4A2545]" : "bg-[#0E1B3D]/5 text-[#0E1B3D]/40"}`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[#0E1B3D] group-hover:text-[#4A2545] transition-colors truncate">{match.careerName}</span>
                      {match.category && <span className="text-[10px] font-bold px-2 py-0.5 bg-[#B89862]/10 text-[#B89862] rounded-full flex-shrink-0">{match.category}</span>}
                    </div>
                    {match.salaryMin && match.salaryMax && (
                      <p className="text-xs text-[#0E1B3D]/50">{(match.salaryMin / 1e6).toFixed(0)}–{(match.salaryMax / 1e6).toFixed(0)} triệu/tháng</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden md:block w-24">
                      <div className="flex justify-between text-[10px] text-[#0E1B3D]/40 mb-1">
                        <span>Phù hợp</span>
                        <span className="font-bold text-[#4A2545]">{match.matchScore}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0E1B3D]/8 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#4A2545] to-[#B89862] rounded-full" style={{ width: `${match.matchScore}%` }} />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#0E1B3D]/30 group-hover:text-[#4A2545] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
            {careerMatches.length > 3 && (
              <p className="text-center text-[#0E1B3D]/40 text-xs">
                + {careerMatches.length - 3} nghề khác trong <Link href="/me/bao-cao/premium" className="text-[#B89862] font-bold hover:underline">Báo cáo Premium</Link>
              </p>
            )}
          </Card>
        )}

        {/* ── PREMIUM UPGRADE CTA ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1B3D] via-[#1A2D5A] to-[#0E1B3D] p-6 md:p-12">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-60px] right-[-60px] w-[300px] h-[300px] bg-[#B89862]/10 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B89862]/20 border border-[#B89862]/30 mb-6">
              <Lock className="w-4 h-4 text-[#B89862]" />
              <span className="text-[#B89862] text-xs font-bold tracking-widest uppercase">Nâng cấp Premium</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-3 leading-tight">
                  Mở khóa Hồ sơ<br />
                  <span className="text-[#B89862]">Định hướng Toàn diện</span>
                </h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  Từ hồ sơ của bạn, hệ thống sẽ gợi ý nhóm ngành học, trường đại học tiêu biểu, và định hướng lộ trình phù hợp — tất cả được cá nhân hóa cho {studentInfo.displayName}.
                </p>
                {completedDate && (
                  <div className="flex items-center gap-2 mt-4 text-white/80 text-sm">
                    <Calendar className="w-4 h-4 text-[#B89862]" />
                    <span>Ngày tạo báo cáo: {completedDate}</span>
                  </div>
                )}
                <Link href="/me/bao-cao/premium"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold bg-[#B89862] text-[#1A0A1E] hover:bg-white transition-all shadow-xl text-base">
                  Xem Báo cáo Premium <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Feature comparison */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 md:grid-cols-3 text-[10px] md:text-xs font-bold uppercase tracking-wider border-b border-white/10">
                  <div className="p-3 text-white/50">Tính năng</div>
                  <div className="p-3 text-center text-white/50 w-12 md:w-auto">Free</div>
                  <div className="p-3 text-center text-[#B89862] w-16 md:w-auto">Premium</div>
                </div>
                {FEATURES.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 md:grid-cols-3 border-b border-white/5 last:border-0 text-sm">
                    <div className="p-3 text-white/70 text-xs leading-snug">{f.label}</div>
                    <div className="p-3 flex items-center justify-center w-12 md:w-auto">
                      {f.free
                        ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                        : <XCircle className="w-4 h-4 text-white/20" />}
                    </div>
                    <div className="p-3 flex items-center justify-center w-16 md:w-auto">
                      <CheckCircle className="w-4 h-4 text-[#B89862]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
