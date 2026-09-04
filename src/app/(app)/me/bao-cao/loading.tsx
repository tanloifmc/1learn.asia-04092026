import { Loader2, Brain, Sparkles } from "lucide-react";

export default function ReportLoading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-[#B89862]/20 blur-[50px] rounded-full" />
        <div className="w-24 h-24 bg-gradient-to-br from-[#1A0A1E] to-[#4A2545] rounded-3xl flex items-center justify-center relative z-10 shadow-2xl animate-pulse">
          <Brain className="w-12 h-12 text-[#B89862]" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce">
          <Sparkles className="w-4 h-4 text-[#B89862]" />
        </div>
      </div>
      
      <h2 className="font-serif text-3xl md:text-4xl text-[#0E1B3D] mb-4">
        Đang phân tích dữ liệu...
      </h2>
      <p className="text-[#0E1B3D]/60 text-lg max-w-md mx-auto leading-relaxed mb-8">
        Hệ thống đang tổng hợp 121 câu trả lời của bạn để viết Báo cáo Khám phá Bản thân cá nhân hóa. Quá trình này có thể mất từ 10 - 15 giây.
      </p>

      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-sm border border-[#0E1B3D]/5">
        <Loader2 className="w-5 h-5 text-[#B89862] animate-spin" />
        <span className="text-sm font-bold text-[#0E1B3D]">Vui lòng không đóng trình duyệt</span>
      </div>
    </div>
  );
}
