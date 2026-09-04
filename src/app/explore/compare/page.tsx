import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const ids = resolvedParams.ids ? resolvedParams.ids.split(",") : [];

  let careers: any[] = [];
  let educationPaths: any[] = [];
  
  if (ids.length > 0) {
    const { data: c } = await supabase
      .from("careers")
      .select("id, name, work_environment")
      .in("id", ids);
    careers = c ?? [];

    const { data: e } = await supabase
      .from("career_education_paths")
      .select("career_id, field_of_study")
      .in("career_id", ids);
    educationPaths = e ?? [];
  }

  // 3. Fetch match scores
  const { data: matchRun } = await supabase
    .from("match_runs")
    .select("id")
    .eq("student_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let matches: any[] = [];
  if (matchRun && ids.length > 0) {
    const { data: m } = await supabase
      .from("career_matches")
      .select("career_id, match_score, gaps")
      .eq("run_id", matchRun.id)
      .in("career_id", ids);
    matches = m ?? [];
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER */}
      <header className="bg-[#0E1B3D] pt-32 pb-16 px-6 text-center text-white rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <Link href="/explore" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Quay lại Bản đồ nghề nghiệp
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4">Không gian so sánh</h1>
          <p className="text-white/60 text-lg md:text-xl font-light">Đối chiếu các khía cạnh để tìm ra định hướng phù hợp nhất với bản thân.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        {ids.length === 0 ? (
          <div className="bg-white rounded-[32px] p-16 text-center border border-[#0E1B3D]/10 shadow-sm max-w-2xl mx-auto">
            <h3 className="font-serif text-2xl text-[#0E1B3D] mb-4">Chưa có dữ liệu</h3>
            <p className="text-[#0E1B3D]/60 mb-8">Bạn cần chọn ít nhất 1 nghề nghiệp từ trang Khám phá để bắt đầu so sánh.</p>
            <Link href="/explore" className="inline-flex px-8 py-4 rounded-full bg-[#0E1B3D] text-white font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors">
              Trở lại Khám phá
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-[800px]">
                <thead>
                  <tr>
                    <th className="p-6 border-b border-[#0E1B3D]/10 bg-white/50 backdrop-blur-md sticky left-0 z-10 w-48 font-bold text-[#0E1B3D]/50 uppercase text-xs tracking-[0.15em]">
                      Tiêu chí so sánh
                    </th>
                    {careers.map((c: any) => (
                      <th key={c.id} className="p-4 md:p-6 border-b border-[#0E1B3D]/10 min-w-[280px] md:min-w-[320px] align-bottom">
                        <h3 className="font-serif text-2xl md:text-3xl text-[#0E1B3D]">{c.name}</h3>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0E1B3D]/5">
                  {/* Độ phù hợp */}
                  <tr className="hover:bg-[#0E1B3D]/[0.02] transition-colors">
                    <td className="p-6 bg-white sticky left-0 font-medium text-[#0E1B3D]">Độ phù hợp (AI Match)</td>
                    {careers.map((c: any) => {
                      const m = matches.find((x: any) => x.career_id === c.id);
                      return (
                        <td key={c.id} className="p-6">
                          {m ? (
                            <div>
                              <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-serif text-[#B89862] leading-none">{Math.round(m.match_score)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#0E1B3D]/5 rounded-full overflow-hidden">
                                <div className="bg-[#B89862] h-full rounded-full" style={{ width: `${m.match_score}%` }}></div>
                              </div>
                            </div>
                          ) : <span className="text-[#0E1B3D]/40 italic">Chưa có kết quả</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Môi trường */}
                  <tr className="hover:bg-[#0E1B3D]/[0.02] transition-colors">
                    <td className="p-6 bg-white sticky left-0 font-medium text-[#0E1B3D]">Môi trường làm việc</td>
                    {careers.map((c: any) => (
                      <td key={c.id} className="p-6 align-top">
                        <p className="text-[#0E1B3D]/70 leading-relaxed text-sm">
                          {c.work_environment || <span className="text-[#0E1B3D]/40 italic">Hệ thống đang cập nhật dữ liệu...</span>}
                        </p>
                      </td>
                    ))}
                  </tr>

                  {/* Ngành học chính */}
                  <tr className="hover:bg-[#0E1B3D]/[0.02] transition-colors">
                    <td className="p-6 bg-white sticky left-0 font-medium text-[#0E1B3D]">Ngành học liên quan</td>
                    {careers.map((c: any) => {
                      const paths = educationPaths.filter((x: any) => x.career_id === c.id);
                      return (
                        <td key={c.id} className="p-6 align-top">
                          {paths.length > 0 ? (
                            <ul className="space-y-3">
                              {paths.map((p: any, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-[#0E1B3D]/80 bg-[#0E1B3D]/5 px-4 py-3 rounded-xl">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#B89862] mt-1.5 flex-shrink-0"></div>
                                  <span>{p.field_of_study}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <span className="text-[#0E1B3D]/40 text-sm italic">Không có dữ liệu</span>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cần phát triển */}
                  <tr className="hover:bg-[#0E1B3D]/[0.02] transition-colors">
                    <td className="p-6 bg-white sticky left-0 font-medium text-[#0E1B3D]">Phân tích Điểm yếu</td>
                    {careers.map((c: any) => {
                      const m = matches.find((x: any) => x.career_id === c.id);
                      const hasGaps = m && m.gaps && Object.keys(m.gaps).length > 0;
                      return (
                        <td key={c.id} className="p-6 align-top">
                          {hasGaps ? (
                            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-800 text-sm">
                              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-orange-500" />
                              <p>Hồ sơ năng lực của bạn còn thiếu sót so với yêu cầu. Vui lòng xem chi tiết trong báo cáo chuyên sâu.</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 text-[#B89862] text-sm bg-[#B89862]/10 p-4 rounded-2xl">
                              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                              <span className="font-medium">Năng lực hoàn toàn đáp ứng yêu cầu</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Action row */}
                  <tr>
                    <td className="p-6 bg-white sticky left-0 border-none"></td>
                    {careers.map((c: any) => (
                      <td key={c.id} className="p-6 text-center border-none">
                        <Link href={`/goal?careerId=${c.id}`} className="block w-full px-6 py-4 border-2 border-[#0E1B3D] text-[#0E1B3D] font-bold rounded-full hover:bg-[#0E1B3D] hover:text-white transition-all uppercase tracking-wider text-sm">
                          Chọn làm Mục tiêu
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
