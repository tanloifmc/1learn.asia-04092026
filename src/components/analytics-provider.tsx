"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackClientEvent } from '@/lib/analytics/client';

export function AnalyticsProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if we are in the browser
    if (typeof window === 'undefined') return;

    trackClientEvent('PAGE_VIEW', {
      path: pathname,
      search: searchParams.toString(),
      title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
