"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BrainCircuit, Sparkles, ServerCrash } from "lucide-react";
import { resumeReportGenerationAction } from "@/features/career/actions/resume-report-generation";

export function ReportGeneratorState({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    let isMounted = true;
    
    // Cycle loading messages
    const interval = setInterval(() => {
      setStep(s => (s >= 3 ? 3 : s + 1));
    }, 4000);

    async function generate() {
      try {
        const res = await resumeReportGenerationAction(resultId);
        if (isMounted) {
          if (res.success) {
            router.refresh();
          } else {
            setError(res.error || "Có lỗi xảy ra khi tạo báo cáo.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Lỗi kết nối. Vui lòng tải lại trang.");
        }
      }
    }

    generate();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [resultId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ServerCrash className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="font-serif text-3xl text-[#0E1B3D] mb-4">Lỗi tạo báo cáo</h2>
        <p className="text-red-600 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1B3D] via-[#1A2D5A] to-[#0E1B3D] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-[#B89862]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#B89862] border-r-[#B89862] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            {step === 1 && <BrainCircuit className="w-10 h-10 text-white animate-pulse" />}
            {step === 2 && <Sparkles className="w-10 h-10 text-[#B89862] animate-pulse" />}
            {step === 3 && <Loader2 className="w-10 h-10 text-white animate-spin" />}
          </div>
        </div>
        
        <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
          Hệ thống đang phân tích...
        </h2>
        
        <div className="h-8 relative overflow-hidden w-full max-w-xs">
          <div className={`absolute inset-0 transition-all duration-500 ${step === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <p className="text-[#B89862] text-sm md:text-base font-medium">Đang tính toán kết quả khảo sát...</p>
          </div>
          <div className={`absolute inset-0 transition-all duration-500 ${step === 2 ? 'opacity-100 translate-y-0' : step < 2 ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'}`}>
            <p className="text-[#B89862] text-sm md:text-base font-medium">Đang kết nối AI định hướng nghề nghiệp...</p>
          </div>
          <div className={`absolute inset-0 transition-all duration-500 ${step === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-[#B89862] text-sm md:text-base font-medium">Đang thiết kế báo cáo cho bạn...</p>
          </div>
        </div>
        
        <p className="text-white/40 mt-8 text-xs max-w-sm">
          Tiến trình này có thể mất tới 10-20 giây để AI có thể đưa ra nhận định cá nhân hóa chính xác nhất. Vui lòng không đóng trang.
        </p>
      </div>
    </div>
  );
}
