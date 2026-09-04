import { Sparkles, ShieldCheck, Target, Lightbulb, Rocket, Zap } from "lucide-react";

export function Chapter2({
  narratives,
  topStrengths,
  developmentAreas
}: {
  narratives: any;
  topStrengths: any[];
  developmentAreas: any[];
}) {
  if (!narratives) return null;

  const { crossDimensionInsights } = narratives;

  // Group strengths logically (mocked groups based on traits for now)
  const groupedStrengths = [
    { title: "Nhận thức & Tư duy", icon: <Lightbulb className="w-5 h-5" />, items: topStrengths.slice(0, 2) },
    { title: "Tương tác & Làm việc", icon: <Target className="w-5 h-5" />, items: topStrengths.slice(2, 4) }
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-12 mt-16">
      {/* 06: Cross-Dimension Insights (WOW Section) */}
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-[#B89862]/10 text-[#B89862] mb-6">
          Chương 2 · Mô Thức Điển Hình Của Bạn
        </div>
        <h2 className="text-3xl font-serif text-[#0E1B3D] mb-8">
          Điểm Giao Thoa <span className="text-[#B89862] italic">Đặc Biệt</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {crossDimensionInsights?.map((insight: any, i: number) => (
            <div key={i} className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_24px_rgba(14,27,61,0.05)] border border-[#B89862]/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="w-24 h-24 text-[#B89862]" />
              </div>
              <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-widest font-bold text-[#B89862] mb-2">{insight.formula}</div>
                <h3 className="font-serif text-xl text-[#0E1B3D] mb-4">{insight.title}</h3>
                <p className="text-[#0E1B3D]/70 text-sm leading-relaxed">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 07: Strengths Map */}
      <section>
        <h2 className="text-2xl font-serif text-[#0E1B3D] mb-6">
          Bản Đồ Điểm Mạnh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedStrengths.map((group, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 md:p-8 border border-[#0E1B3D]/10">
              <h3 className="flex items-center gap-2 font-bold text-sm text-[#0E1B3D] mb-6 uppercase tracking-wider">
                {group.icon} {group.title}
              </h3>
              <div className="space-y-4">
                {group.items.map((s: any, j: number) => (
                  <div key={j} className="flex flex-col border-b border-[#0E1B3D]/5 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[#0E1B3D] text-sm">{s.name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">NỔI BẬT</span>
                    </div>
                    <p className="text-xs text-[#0E1B3D]/60">{s.description || "Năng lực mạnh mẽ giúp bạn vượt qua thử thách."}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 08: Development Areas */}
      {developmentAreas && developmentAreas.length > 0 && (
        <section>
          <h2 className="text-2xl font-serif text-[#0E1B3D] mb-6">
            Vùng Cần Lưu Ý & Phát Triển
          </h2>
          <div className="bg-[#4A2545]/5 rounded-3xl p-6 md:p-8 border border-[#4A2545]/10">
            <div className="space-y-4">
              {developmentAreas.slice(0, 3).map((d: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#4A2545]/10">
                    <Zap className="w-4 h-4 text-[#4A2545]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#4A2545] mb-1">{d.name}</h4>
                    <p className="text-xs text-[#0E1B3D]/70">{d.description || "Hãy chú ý đến khuynh hướng này trong các môi trường áp lực cao."}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
