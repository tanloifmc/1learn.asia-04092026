import { searchCareers } from "@/features/career/actions/explorer";
import Link from "next/link";
import { Compass, Search, Filter, Briefcase, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Khám phá Nghề nghiệp | 1learn.asia",
};

export default async function CareersExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; skill?: string; page?: string }>;
}) {
  const { q = "", skill = "", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10);

  const { data: careers, count } = await searchCareers({ q, skill, page, limit: 12 });

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HERO SECTION */}
      <section className="bg-[#0E1B3D] pt-32 pb-40 md:pt-40 md:pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B89862]/20 rounded-full blur-[120px] -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] -ml-20 -mb-20"></div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-6 bg-white/5 backdrop-blur-md">
            Career Catalog
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Thư viện <span className="italic text-[#B89862]">Nghề nghiệp</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-2xl mx-auto">
            Hơn 100+ ngành nghề đang chờ bạn khám phá. Tìm hiểu xu hướng thị trường, mức lương và lộ trình thăng tiến chi tiết.
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[24px] p-4 md:p-6 shadow-[0_20px_50px_rgba(14,27,61,0.05)] border border-[#0E1B3D]/10 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <form action="/careers" method="GET" className="w-full">
              <input 
                type="text" 
                name="q"
                defaultValue={q}
                placeholder="Tìm kiếm nghề nghiệp (VD: Kỹ sư phần mềm...)" 
                className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] placeholder-[#0E1B3D]/40 focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all font-medium"
              />
              {skill && <input type="hidden" name="skill" value={skill} />}
            </form>
          </div>
          
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0E1B3D]/40" />
            <form action="/careers" method="GET" className="w-full">
              <input 
                type="text" 
                name="skill"
                defaultValue={skill}
                placeholder="Lọc theo kỹ năng (VD: code)" 
                className="w-full bg-[#0E1B3D]/5 border-none rounded-xl py-3 pl-12 pr-4 text-[#0E1B3D] placeholder-[#0E1B3D]/40 focus:ring-2 focus:ring-[#B89862]/50 outline-none transition-all font-medium"
              />
              {q && <input type="hidden" name="q" value={q} />}
            </form>
          </div>

          {(q || skill) && (
            <Link 
              href="/careers" 
              className="text-sm font-bold text-red-500 hover:text-red-700 whitespace-nowrap px-4 py-2 bg-red-50 rounded-lg transition-colors"
            >
              Xóa bộ lọc
            </Link>
          )}
        </div>
      </section>

      {/* RESULTS LIST */}
      <section className="max-w-6xl mx-auto px-6 mt-12">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-[#0E1B3D]/60 font-medium">
            Tìm thấy <strong className="text-[#0E1B3D]">{count}</strong> nghề nghiệp
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {careers?.map((career) => (
            <Link key={career.id} href={`/careers/${career.slug}`} className="group block h-full">
              <div className="bg-white rounded-[24px] p-6 h-full border border-[#0E1B3D]/10 hover:border-[#B89862]/50 hover:shadow-[0_20px_50px_rgba(14,27,61,0.08)] transition-all duration-300 flex flex-col relative overflow-hidden">
                {/* Decorative Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B89862]/5 rounded-full blur-[20px] -mr-16 -mt-16 group-hover:bg-[#B89862]/10 transition-colors"></div>

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-[#0E1B3D] flex items-center justify-center text-[#B89862] shadow-md group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  {career.riasec_primary && (
                    <span className="px-3 py-1 bg-[#0E1B3D]/5 text-[#0E1B3D] rounded-full text-xs font-bold uppercase tracking-wider">
                      {career.riasec_primary}
                    </span>
                  )}
                </div>
                
                <h3 className="font-serif text-2xl text-[#0E1B3D] mb-3 group-hover:text-[#B89862] transition-colors relative z-10">
                  {career.name}
                </h3>
                
                <p className="text-[#0E1B3D]/60 text-sm line-clamp-3 mb-6 flex-1 relative z-10">
                  {career.description || "Chưa có thông tin chi tiết."}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#0E1B3D]/5 relative z-10">
                  <div className="flex items-center gap-2">
                    {career.market_data?.salary ? (
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                        ~{(career.market_data.salary.max / 1000000).toFixed(0)}tr / tháng
                      </span>
                    ) : (
                      <span className="text-xs text-[#0E1B3D]/40 italic">Đang cập nhật lương</span>
                    )}
                  </div>
                  
                  <span className="w-8 h-8 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center group-hover:bg-[#0E1B3D] group-hover:text-[#B89862] transition-colors text-[#0E1B3D]/40">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {(!careers || careers.length === 0) && (
          <div className="text-center py-32 bg-white rounded-[32px] border border-[#0E1B3D]/10">
            <Compass className="w-16 h-16 text-[#0E1B3D]/20 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-[#0E1B3D] mb-2">Không tìm thấy kết quả</h3>
            <p className="text-[#0E1B3D]/60 mb-6">Thử thay đổi từ khóa hoặc xóa bớt bộ lọc để tìm kiếm lại.</p>
            <Link href="/careers" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors shadow-md">
              Xóa bộ lọc
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
