import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { MatchTrigger } from "./match-trigger";
import Link from "next/link";
import { RoadmapTriggerButton } from "@/components/roadmap/roadmap-trigger-button";

export const metadata = {
  title: "Nghề nghiệp phù hợp | 1learn.asia",
};

export default async function CareerMatchesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const supabase = await createClient();

  // Find the latest match run
  const { data: latestRun } = await supabase
    .from("match_runs")
    .select("*")
    .eq("student_id", account.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRun || latestRun.status === 'insufficient_data') {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Đề xuất Nghề nghiệp
          </h1>
          <p className="text-lg text-zinc-400">
            Bạn chưa có kết quả phân tích nghề nghiệp phù hợp, hoặc hồ sơ chưa đủ dữ liệu.
          </p>
        </div>
        <MatchTrigger studentId={account.userId} />
      </div>
    );
  }

  // Fetch matches with career details
  const { data: matches } = await supabase
    .from("career_matches")
    .select(`
      *,
      careers (
        id,
        code,
        name,
        description,
        job_family
      )
    `)
    .eq("run_id", latestRun.id)
    .order("rank", { ascending: true })
    .limit(20);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Nghề nghiệp phù hợp nhất
          </h1>
          <p className="text-zinc-400">
            Độ tin cậy: <span className="text-white font-medium capitalize">{latestRun.overall_confidence_level}</span> (Dựa trên {Math.round(latestRun.evidence_coverage * 100)}% dữ liệu hồ sơ)
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <MatchTrigger studentId={account.userId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches?.map((match) => {
          const career = match.careers as any;
          if (!career) return null;
          
          return (
            <div key={match.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md mb-2 inline-block">
                    Hạng #{match.rank}
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    <Link href={`/careers/${career.code}`} className="hover:text-blue-400 transition-colors">
                      {career.name}
                    </Link>
                  </h2>
                  <p className="text-zinc-400 text-sm">{career.job_family}</p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-black text-green-400">
                    {match.match_score}%
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Độ phù hợp</div>
                </div>
              </div>
              
              <p className="text-zinc-300 text-sm mb-6 line-clamp-3 flex-grow">
                {career.description}
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6 border-t border-zinc-800 pt-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{match.riasec_score || '--'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Sở thích</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{match.ability_score || '--'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Năng lực</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{match.value_score || '--'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Giá trị</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{match.academic_score || '--'}</div>
                  <div className="text-[10px] text-zinc-500 uppercase">Học thuật</div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 mt-auto flex justify-between items-center">
                <Link 
                  href={`/careers/${career.code}`}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  Xem chi tiết nghề nghiệp →
                </Link>
                <RoadmapTriggerButton 
                  studentId={account.userId} 
                  targetType="career" 
                  targetId={career.id} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
