"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPrimaryGoalAndGenerateRoadmapAction } from "@/features/roadmap/actions";
import { Target, Loader2 } from "lucide-react";

export function RoadmapTriggerButton({ 
  studentId, 
  targetType, 
  targetId 
}: { 
  studentId: string;
  targetType: 'career' | 'university' | 'major';
  targetId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await setPrimaryGoalAndGenerateRoadmapAction(studentId, targetType, targetId);
      
      if (res.success) {
        router.push('/goal'); // Chuyển về trang Mục tiêu để thấy Goal mới và tiến độ Roadmap
      } else {
        alert(res.error || 'Có lỗi xảy ra khi tạo lộ trình.');
      }
    } catch (err) {
      alert('Lỗi hệ thống khi tạo lộ trình.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateRoadmap}
      disabled={loading}
      className="group flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đang thiết lập...</span>
        </>
      ) : (
        <>
          <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Chọn làm Mục tiêu ưu tiên</span>
        </>
      )}
    </button>
  );
}
