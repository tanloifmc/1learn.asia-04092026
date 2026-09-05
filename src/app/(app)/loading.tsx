import { Sparkles } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-[#0E1B3D]/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-[#C6A15B] rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#0E1B3D] animate-pulse" />
        </div>
      </div>
      <h3 className="text-xl font-serif font-bold text-[#0E1B3D] mb-2">Đang tải dữ liệu...</h3>
      <p className="text-sm text-[#0E1B3D]/60 max-w-[250px] text-center">
        Vui lòng đợi trong giây lát, hệ thống đang chuẩn bị nội dung cho bạn.
      </p>
    </div>
  );
}
