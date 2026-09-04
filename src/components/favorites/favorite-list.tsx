"use client";

import { useState } from "react";
import { BookmarkMinus, Compass, Library, ArrowRight } from "lucide-react";
import Link from "next/link";

type Favorite = { id: string; entity_type: string; entity_id: string; created_at: string };

export function FavoriteList({ initialFavorites }: { initialFavorites: Favorite[] }) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [removing, setRemoving] = useState<string | null>(null);

  async function removeFavorite(id: string) {
    setRemoving(id);
    const response = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFavorites((items) => items.filter((item) => item.id !== id));
    }
    setRemoving(null);
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <Library className="w-10 h-10 text-[#0E1B3D]/20" />
        </div>
        <h2 className="font-serif text-3xl text-[#0E1B3D] mb-4">Bộ sưu tập trống</h2>
        <p className="text-[#0E1B3D]/60 mb-8 max-w-md mx-auto text-lg">
          Bạn chưa lưu bất kỳ ngành nghề hay trường đại học nào. Khám phá ngay để xây dựng bộ sưu tập cá nhân.
        </p>
        <Link 
          href="/explore"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md"
        >
          Khám phá ngay <Compass className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  const careers = favorites.filter(f => f.entity_type === 'career');
  const universities = favorites.filter(f => f.entity_type === 'university');

  const renderCard = (item: Favorite) => {
    const isCareer = item.entity_type === 'career';
    // In a real implementation, we would fetch the actual names/images. 
    // Here we use a placeholder since the API only returns entity_id.
    const title = isCareer ? `Ngành nghề #${item.entity_id.substring(0,6)}` : `Trường #${item.entity_id.substring(0,6)}`;
    const link = isCareer ? `/careers/${item.entity_id}` : `/universities/${item.entity_id}`;
    const Icon = isCareer ? Compass : Library;

    return (
      <div key={item.id} className="group relative bg-[#F8F6F1] rounded-[24px] p-6 border border-[#0E1B3D]/5 hover:border-[#B89862]/30 hover:shadow-lg transition-all flex flex-col justify-between h-[200px] overflow-hidden">
        {/* Background Graphic */}
        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon className="w-40 h-40 text-[#0E1B3D]" />
        </div>
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-[10px] font-bold text-[#0E1B3D] uppercase tracking-wider shadow-sm border border-[#0E1B3D]/10">
            {isCareer ? "Nghề nghiệp" : "Đại học"}
          </div>
          <button 
            type="button" 
            onClick={() => removeFavorite(item.id)}
            disabled={removing === item.id}
            className="w-8 h-8 bg-white text-red-400 hover:text-red-600 rounded-full flex items-center justify-center shadow-sm border border-[#0E1B3D]/10 hover:border-red-200 transition-colors disabled:opacity-50"
            title="Bỏ lưu"
          >
            <BookmarkMinus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 mt-auto">
          <h3 className="font-serif text-2xl text-[#0E1B3D] mb-1 line-clamp-2">{title}</h3>
          <p className="text-xs text-[#0E1B3D]/50 mb-4">Lưu ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
          <Link 
            href={link}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#B89862] hover:text-[#0E1B3D] transition-colors uppercase tracking-wider group-hover:translate-x-1"
          >
            Xem chi tiết <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {careers.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Compass className="w-6 h-6 text-[#B89862]" />
            <h2 className="font-serif text-3xl text-[#0E1B3D]">Nghề nghiệp đã lưu ({careers.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {careers.map(renderCard)}
          </div>
        </section>
      )}

      {universities.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Library className="w-6 h-6 text-[#B89862]" />
            <h2 className="font-serif text-3xl text-[#0E1B3D]">Đại học đã lưu ({universities.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {universities.map(renderCard)}
          </div>
        </section>
      )}
    </div>
  );
}
