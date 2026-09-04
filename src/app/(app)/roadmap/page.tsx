import { getActiveRoadmap } from "@/features/roadmap/actions";
import { RoadmapClientView } from "./roadmap-client-view";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/features/account/current-account";

export const metadata = {
  title: "Lộ trình của tôi - 1learn.asia",
};

export default async function RoadmapPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const { data: roadmap, error } = await getActiveRoadmap();

  if (error || !roadmap) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center p-6">
        <div className="bg-white p-6 md:p-12 max-w-2xl mx-auto text-center rounded-[40px] border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)]">
          <div className="w-20 h-20 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-[#0E1B3D]/30 font-serif text-3xl">?</span>
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4 text-[#0E1B3D]">Chưa có Lộ trình</h1>
          <p className="text-[#0E1B3D]/60 mb-10 max-w-md mx-auto text-lg leading-relaxed">
            {error || "Lộ trình giúp bạn lên kế hoạch từng bước để đạt được mục tiêu học tập và nghề nghiệp của mình."}
          </p>
          <Link 
            href="/goal"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors shadow-md"
          >
            Tạo lộ trình ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#0E1B3D] pt-32 pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -ml-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4 bg-white/5 backdrop-blur-md">
            Hành trình của tôi
          </div>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-6">Lộ trình Mục tiêu</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
            Mục tiêu hiện tại của bạn là hướng tới <strong className="text-[#B89862]">{roadmap.target_career_id ? "Nghề nghiệp" : "Đại học"}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        <RoadmapClientView initialRoadmap={roadmap} />
      </div>
    </div>
  );
}
