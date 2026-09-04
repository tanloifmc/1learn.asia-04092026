"use client";

import { useEffect, useRef } from "react";
import { trackClientEvent } from "@/lib/analytics/client";

export function ExplorationTracker({ type, targetId, slug }: { type: 'CAREER' | 'MAJOR' | 'UNIVERSITY', targetId: string, slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    
    // Đơn giản: Ghi nhận Explore nếu ở lại trang quá 3 giây
    const timer = setTimeout(() => {
      if (!tracked.current) {
        trackClientEvent(`${type}_EXPLORED`, { target_id: targetId, slug });
        tracked.current = true;
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [type, targetId, slug]);

  return null;
}
