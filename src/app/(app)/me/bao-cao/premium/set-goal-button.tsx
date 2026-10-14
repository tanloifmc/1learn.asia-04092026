"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Target, Loader2, Check } from "lucide-react";
import { setCareerGoalAction } from "@/features/career/actions/set-goal-action";

interface SetGoalButtonProps {
  careerId: string;
  careerName: string;
  majorCode?: string;
  universityId?: string;
  programId?: string;
  variant?: "default" | "large" | "card";
}

export function SetGoalButton({
  careerId,
  careerName,
  majorCode,
  universityId,
  programId,
  variant = "default",
}: SetGoalButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await setCareerGoalAction(careerId, majorCode, universityId, programId);
      if (result.success) {
        setDone(true);
        setMessage(result.roadmapWarning ?? null);
        setTimeout(() => {
          router.push(result.roadmapWarning ? "/goal" : "/roadmap");
        }, 1200);
      } else {
        setMessage(result.error ?? "Không thể đặt mục tiêu.");
      }
    });
  }

  if (done) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 font-bold rounded-full bg-emerald-500 text-white transition-all ${
          variant === "large"
            ? "px-10 py-4 text-base"
            : "px-4 py-2 text-xs"
        }`}
      >
        <Check className={variant === "large" ? "w-5 h-5" : "w-4 h-4"} />
        Đã đặt mục tiêu! Chuyển đến Lộ trình...
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-2 font-bold rounded-full transition-all ${
          variant === "large"
            ? "px-10 py-4 text-base bg-[#B89862] text-[#0E1B3D] hover:bg-white hover:text-[#0E1B3D] shadow-xl"
            : variant === "card"
            ? "px-3 py-2 text-xs bg-[#0E1B3D] text-white hover:bg-[#4A2545]"
            : "px-4 py-2 text-xs bg-white/15 border border-white/25 text-white hover:bg-[#B89862] hover:text-[#0E1B3D] hover:border-[#B89862]"
        }`}
      >
        {isPending ? (
          <Loader2 className={`animate-spin ${variant === "large" ? "w-5 h-5" : "w-3.5 h-3.5"}`} />
        ) : (
          <Target className={variant === "large" ? "w-5 h-5" : "w-3.5 h-3.5"} />
        )}
        {isPending
          ? "Đang xử lý..."
          : variant === "large"
          ? `Chọn "${careerName}" làm mục tiêu`
          : "Đặt làm mục tiêu"}
      </button>
      {message && <p role="status" className="max-w-md text-sm text-amber-700">{message}</p>}
    </div>
  );
}
