import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Danh sách trường Đại học | 1learn.asia",
};

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q = "" } = await searchParams;

  let query = supabase.from("universities").select("*").eq("status", "published");
  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  
  const { data: universities } = await query.order("name", { ascending: true });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
          Khám Phá Các Trường Đại Học
        </h1>
        <p className="text-lg text-zinc-400">
          Tìm kiếm trường đại học phù hợp với mục tiêu và định hướng của bạn.
        </p>
      </div>

      <div className="mb-8 max-w-xl mx-auto">
        <form action="/universities" method="GET" className="flex gap-2">
          <input 
            type="text" 
            name="q"
            defaultValue={q}
            placeholder="Tìm kiếm tên trường..." 
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
            Tìm
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universities?.map((uni) => (
          <Link href={`/universities/${uni.slug}`} key={uni.id}>
            <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition-all h-full flex flex-col">
              <div className="flex items-center space-x-4 mb-4">
                {uni.logo_url ? (
                  <Image src={uni.logo_url} alt={uni.name} width={64} height={64} className="rounded object-contain bg-white p-1" />
                ) : (
                  <div className="w-16 h-16 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                    {uni.code}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white leading-tight">{uni.name}</h2>
                  <p className="text-sm text-zinc-400">{uni.code} • {uni.type === 'public' ? 'Công lập' : 'Tư thục'}</p>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-sm text-zinc-500 line-clamp-2">{uni.description}</p>
                <div className="mt-4 flex items-center text-blue-400 text-sm font-medium">
                  Xem chi tiết <span className="ml-1">→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        
        {universities?.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            Không tìm thấy trường nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}
