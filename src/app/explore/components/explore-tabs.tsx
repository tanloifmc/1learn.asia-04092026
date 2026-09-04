'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function ExploreTabs() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'recommended';

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'recommended', label: 'Dành cho bạn' },
    { id: 'saved', label: 'Đang cân nhắc' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 px-6 md:px-0">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/explore?tab=${tab.id}`}
              className={`whitespace-nowrap px-8 py-3 rounded-full text-sm font-bold transition-all ${
                isActive 
                  ? "bg-[#0E1B3D] text-white shadow-md" 
                  : "bg-white text-[#0E1B3D]/70 hover:bg-white hover:text-[#0E1B3D] border border-[#0E1B3D]/10 shadow-[0_4px_15px_rgba(14,27,61,0.02)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
