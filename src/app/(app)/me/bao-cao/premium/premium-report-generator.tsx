"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { resumeReportGenerationAction } from "@/features/career/actions/resume-report-generation";

export function PremiumReportGenerator({ assessmentResultId }: { assessmentResultId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    setError(null);
    startTransition(async () => {
      const result = await resumeReportGenerationAction(assessmentResultId);
      if (!result.success) {
        setError(result.error || "Không thể tạo báo cáo Premium. Vui lòng thử lại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#0E1B3D]/10 bg-white p-8 text-center shadow-[0_4px_24px_rgba(14,27,61,0.07)] md:p-12">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#B89862]/15">
          <Sparkles className="size-7 text-[#B89862]" />
        </div>
        <h1 className="font-serif text-2xl text-[#0E1B3D]">Tạo Báo cáo Premium</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#0E1B3D]/60">
          Chúng tôi sẽ tạo một bản snapshot từ kết quả khảo sát hiện tại của bạn. Thao tác này chỉ dùng dữ liệu đã được xác minh trong hệ thống.
        </p>
        <button
          type="button"
          onClick={generate}
          disabled={isPending}
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0E1B3D] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4A2545] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isPending ? "Đang tạo báo cáo…" : "Tạo báo cáo Premium"}
        </button>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
