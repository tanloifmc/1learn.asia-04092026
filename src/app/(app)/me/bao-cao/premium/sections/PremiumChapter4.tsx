import { Flag, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Chapter4({
  narratives
}: {
  narratives: any;
}) {
  if (!narratives || !narratives.actionPlan) return null;

  const { actionPlan } = narratives;

  return (
    <div className="space-y-12 mt-16 border-t border-[#0E1B3D]/10 pt-16">
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-emerald-100 text-emerald-800 mb-6">
          Chương 4 · Hành Động
        </div>
        <h2 className="text-3xl font-serif text-[#0E1B3D] mb-8">
          Lộ Trình <span className="text-[#B89862] italic">Đề Xuất</span>
        </h2>

        <div className="relative pl-6 md:pl-8 border-l-2 border-emerald-100 space-y-10">
          {actionPlan.map((step: any, i: number) => (
            <div key={i} className="relative">
              <div className="absolute -left-[35px] md:-left-[43px] w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#0E1B3D]/10 shadow-sm">
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-2">
                  Bước {i + 1}
                </div>
                <h3 className="font-semibold text-lg text-[#0E1B3D] mb-2">{step.milestone}</h3>
                <p className="text-[#0E1B3D]/70 text-sm">{step.task}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/roadmap"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#1a2e63] transition-colors shadow-lg hover:shadow-xl group"
          >
            Bắt đầu Lập Mục Tiêu Cụ Thể
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-[#0E1B3D]/50 text-xs mt-4">Hệ thống sẽ đồng hành cùng bạn trên từng chặng đường.</p>
        </div>
      </section>
    </div>
  );
}
