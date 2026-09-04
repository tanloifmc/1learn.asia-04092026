'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import Image from 'next/image';
import { Bookmark, ArrowRight, Activity } from 'lucide-react';
import { toggleSavedItem } from '../actions';

interface CareerCardProps {
  career: {
    id: string;
    name: string;
    career_domain_code?: string;
    description?: string;
    cover_image_url?: string;
  };
  matchScore?: number;
  isSaved: boolean;
}

export function CareerCard({ career, matchScore, isSaved }: CareerCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleSavedItem('career', career.id);
    });
  };

  const currentCompareIds = searchParams.get('compare')?.split(',').filter(Boolean) || [];
  const isSelectedForCompare = currentCompareIds.includes(career.id);

  const toggleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let newIds = [...currentCompareIds];
    
    if (isSelectedForCompare) {
      newIds = newIds.filter(id => id !== career.id);
    } else {
      if (newIds.length >= 3) {
        alert('Chỉ có thể so sánh tối đa 3 lựa chọn cùng lúc!');
        return;
      }
      newIds.push(career.id);
    }

    const params = new URLSearchParams(searchParams.toString());
    if (newIds.length > 0) {
      params.set('compare', newIds.join(','));
    } else {
      params.delete('compare');
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [currentCompareIds, isSelectedForCompare, career.id, pathname, router, searchParams]);

  return (
    <div className={`group flex flex-col bg-white rounded-3xl overflow-hidden transition-all duration-300 border ${
      isSelectedForCompare ? 'border-[#B89862] shadow-[0_0_0_1px_#B89862]' : 'border-[#0E1B3D]/5 hover:shadow-[0_20px_50px_rgba(14,27,61,0.08)]'
    } h-full relative`}>
      
      {/* Cover Image */}
      <div className="w-full h-48 relative bg-[#0E1B3D]/5 overflow-hidden">
        {career.cover_image_url ? (
          <Image 
            src={career.cover_image_url} 
            alt={career.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0E1B3D] to-[#1a2c5b] opacity-5"></div>
        )}

        {/* Save Button */}
        <button 
          onClick={handleToggleSave}
          disabled={isPending}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all disabled:opacity-50"
          title={isSaved ? "Bỏ lưu" : "Lưu vào Đang cân nhắc"}
        >
          {isSaved ? <Bookmark className="w-5 h-5 text-[#B89862] fill-[#B89862]" /> : <Bookmark className="w-5 h-5 text-[#0E1B3D]/70" />}
        </button>

        {/* Domain Badge */}
        {career.career_domain_code && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#0E1B3D]">
            {career.career_domain_code}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex flex-col flex-1">
        {matchScore !== undefined && (
          <div className="flex items-center gap-2 mb-4">
            <div className="w-full bg-[#0E1B3D]/5 rounded-full h-1.5">
              <div className="bg-[#B89862] h-1.5 rounded-full" style={{ width: `${matchScore}%` }}></div>
            </div>
            <span className="text-xs font-bold text-[#B89862] whitespace-nowrap">Phù hợp {matchScore}%</span>
          </div>
        )}

        <h3 className="font-serif text-2xl text-[#0E1B3D] leading-snug mb-3 group-hover:text-[#B89862] transition-colors line-clamp-2">
          {career.name}
        </h3>
        
        {career.description && (
          <p className="text-[#0E1B3D]/60 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
            {career.description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-[#0E1B3D]/5">
          <button 
            onClick={toggleCompare}
            className={`flex-1 text-sm font-bold uppercase tracking-wider transition-all py-3 rounded-xl text-center ${
              isSelectedForCompare 
                ? 'bg-[#B89862] text-white' 
                : 'bg-[#0E1B3D]/5 text-[#0E1B3D] hover:bg-[#0E1B3D]/10'
            }`}
          >
            {isSelectedForCompare ? 'Đang so sánh' : 'So sánh'}
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider py-3 text-[#0E1B3D] hover:text-[#B89862] transition-colors">
            Chi tiết <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
