'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Scale } from 'lucide-react';

export function CompareTray() {
  const searchParams = useSearchParams();
  const compareIds = searchParams.get('compare')?.split(',').filter(Boolean) || [];

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-[#0E1B3D]/95 backdrop-blur-md shadow-[0_20px_50px_rgba(14,27,61,0.2)] border border-white/10 rounded-full p-2 pr-2 pl-6 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#B89862]" />
          <span className="text-sm font-medium text-white/80">
            Đã chọn <strong className="text-white font-bold">{compareIds.length}/3</strong> nghề
          </span>
        </div>
        <Link 
          href={`/explore/compare?ids=${compareIds.join(',')}`}
          className="bg-[#B89862] text-[#0E1B3D] px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider hover:bg-white transition-colors shadow-sm flex items-center gap-2"
        >
          So sánh ngay <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
