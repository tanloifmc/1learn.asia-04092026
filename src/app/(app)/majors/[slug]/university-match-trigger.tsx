"use client";

import { useState } from "react";
import { runUniversityRecommendation } from "@/features/university/actions/recommendation-engine";
import { useRouter } from "next/navigation";

export function UniversityMatchTrigger({ studentId, majorId, majorSlug }: { studentId: string, majorId: string, majorSlug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRunMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runUniversityRecommendation(studentId, majorId, "THPT");
      if (result.success) {
        // Redirect to matches page for this major
        router.push(`/universities/matches?major=${majorSlug}`);
      } else {
        setError(result.error || "Có lỗi xảy ra khi phân tích điểm chuẩn.");
      }
    } catch (err) {
      setError("Có lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="text-red-400 text-sm mb-2 font-medium">
          {error}
        </div>
      )}
      <button
        onClick={handleRunMatch}
        disabled={loading}
        className="px-5 py-2.5 bg-[#B89862] hover:bg-[#A68652] text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Đang tính toán khả năng đỗ...</span>
          </>
        ) : (
          <span>Phân tích khả năng đỗ các trường này</span>
        )}
      </button>
    </div>
  );
}
