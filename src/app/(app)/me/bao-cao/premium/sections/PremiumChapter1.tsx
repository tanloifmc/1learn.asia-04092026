import { Star, Shield, TrendingUp, Compass, Heart, Zap, CheckCircle2 } from "lucide-react";

export function Chapter1({
  narratives,
  riasec,
  bigFive,
  workValues
}: {
  narratives: any;
  riasec: any[];
  bigFive: any[];
  workValues: any[];
}) {
  if (!narratives) return null;

  const { executiveSummary, workingStyle } = narratives;

  return (
    <div className="space-y-12">
      {/* 01 & 02: Executive Summary & Identity */}
      <section>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.15em] uppercase bg-[#4A2545]/10 text-[#4A2545] mb-6">
          Chương 1 · Thấu Hiểu Bản Thân
        </div>
        <h2 className="text-3xl font-serif text-[#0E1B3D] mb-8">
          Tóm Tắt Tổng Quan <span className="text-[#B89862] italic">&</span> Chân Dung Của Bạn
        </h2>

        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(14,27,61,0.07)] border border-[#0E1B3D]/8 overflow-hidden">
          <div className="p-8 md:p-10 border-b border-[#0E1B3D]/5">
            <h3 className="font-semibold text-lg text-[#0E1B3D] mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#B89862]" /> Chân dung Nghề nghiệp (Identity)
            </h3>
            <p className="text-[#0E1B3D]/70 leading-relaxed text-[15px]">
              {executiveSummary?.identityNarrative}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10 border-r border-[#0E1B3D]/5 bg-[#B89862]/[0.02]">
              <h3 className="font-semibold text-sm text-[#0E1B3D] mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Star className="w-4 h-4 text-[#B89862]" /> Điều nổi bật nhất
              </h3>
              <p className="text-[#0E1B3D]/60 text-sm leading-relaxed">
                {executiveSummary?.standOuts}
              </p>
            </div>
            <div className="p-8 md:p-10 bg-emerald-50/30">
              <h3 className="font-semibold text-sm text-emerald-800 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Hướng Khám Phá
              </h3>
              <p className="text-emerald-700/80 text-sm leading-relaxed">
                {executiveSummary?.exploreDirection}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 & 04: Personality (Big Five) & Working Style */}
      <section>
        <h2 className="text-2xl font-serif text-[#0E1B3D] mb-6">
          Cách Bạn Hoạt Động <span className="text-[#B89862] italic">&</span> Tương Tác
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-[#0E1B3D]/10 shadow-[0_4px_24px_rgba(14,27,61,0.03)]">
            <h4 className="font-bold text-[#0E1B3D] text-sm mb-3">Tư Duy & Tiếp Nhận</h4>
            <p className="text-[#0E1B3D]/60 text-sm">{workingStyle?.thinking}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#0E1B3D]/10 shadow-[0_4px_24px_rgba(14,27,61,0.03)]">
            <h4 className="font-bold text-[#0E1B3D] text-sm mb-3">Tổ Chức Công Việc</h4>
            <p className="text-[#0E1B3D]/60 text-sm">{workingStyle?.organization}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-[#0E1B3D]/10 shadow-[0_4px_24px_rgba(14,27,61,0.03)]">
            <h4 className="font-bold text-[#0E1B3D] text-sm mb-3">Giao Tiếp & Tương Tác</h4>
            <p className="text-[#0E1B3D]/60 text-sm">{workingStyle?.interaction}</p>
          </div>
        </div>
      </section>

      {/* 05: Work Values */}
      <section>
        <h2 className="text-2xl font-serif text-[#0E1B3D] mb-6">
          Hệ Giá Trị Nghề Nghiệp Đầy Đủ
        </h2>
        <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/10 shadow-[0_4px_24px_rgba(14,27,61,0.05)]">
          <div className="space-y-5">
            {workValues.map((wv, i) => (
              <div key={wv.code} className="flex items-center gap-4">
                <div className="w-8 font-serif text-2xl text-[#B89862]/40 font-bold italic">
                  {(i + 1).toString().padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className={`text-sm ${i < 3 ? "font-bold text-[#0E1B3D]" : "font-medium text-[#0E1B3D]/70"}`}>{wv.name}</span>
                    <span className="font-bold text-sm text-[#0E1B3D]/40">{wv.score}</span>
                  </div>
                  <div className="w-full bg-[#0E1B3D]/5 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${i < 3 ? "bg-gradient-to-r from-[#B89862] to-[#D4B98C]" : "bg-[#0E1B3D]/20"}`}
                      style={{ width: `${wv.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
