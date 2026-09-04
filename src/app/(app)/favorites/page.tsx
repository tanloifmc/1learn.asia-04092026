import { redirect } from "next/navigation";
import { FavoriteList } from "@/components/favorites/favorite-list";
import { getAuthenticatedSession } from "@/lib/auth/server-session";
import { BookmarkIcon } from "lucide-react";

export default async function FavoritesPage() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) redirect("/login");

  // Fetch favorites along with basic data based on entity type
  const { data } = await supabase
    .from("favorites")
    .select("id, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false });

  // In a real implementation, we would join with careers/universities tables
  // Here we pass the raw data to the client component which can fetch details

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-24">
      {/* HEADER SECTION */}
      <div className="bg-[#0E1B3D] pt-32 pb-48 rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-4 bg-white/5 backdrop-blur-md">
            Lookbook Collection
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6">Mục Đã Lưu</h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed font-light">
            Bộ sưu tập cá nhân chứa các ngành nghề và trường đại học mà bạn đang quan tâm. Lưu lại để dễ dàng so sánh và đưa ra quyết định.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-[0_20px_50px_rgba(14,27,61,0.03)] border border-[#0E1B3D]/10 min-h-[500px]">
          <FavoriteList initialFavorites={data ?? []} />
        </div>
      </div>
    </div>
  );
}
