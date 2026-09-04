"use client";

import { useState } from "react";
import { runMatchingEngine } from "@/features/career/actions/matching-engine";
import { useRouter } from "next/navigation";

export function MatchTrigger({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRunMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runMatchingEngine(studentId);
      if (result.success) {
        // Refresh the page to show new matches
        router.refresh();
      } else {
        setError(result.error || "Có lỗi xảy ra khi chạy thuật toán.");
      }
    } catch (err) {
      setError("Có lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto mt-12">
      <h2 className="text-2xl font-bold text-white mb-4">Khám phá nghề nghiệp phù hợp</h2>
      <p className="text-zinc-400 mb-8">
        Dựa trên hồ sơ kỹ năng, sở thích (RIASEC) và kết quả học tập của bạn, hệ thống AI sẽ phân tích và đề xuất các nghề nghiệp phù hợp nhất.
      </p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <button
        onClick={handleRunMatch}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Đang phân tích dữ liệu...</span>
          </>
        ) : (
          <span>Bắt đầu phân tích độ phù hợp</span>
        )}
      </button>
    </div>
  );
}
