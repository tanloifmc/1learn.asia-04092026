import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { RoadmapTriggerButton } from "@/components/roadmap/roadmap-trigger-button";
import { UniversityMatchTrigger } from "./university-match-trigger";

export default async function MajorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const account = await getCurrentAccount();
  const { slug } = await params;

  const { data: major } = await supabase
    .from("majors")
    .select(`
      *,
      university_majors (
        id,
        universities (
          id,
          name,
          code,
          logo_url,
          type
        )
      )
    `)
    .eq("slug", slug)
    .single();

  if (!major) notFound();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6  mb-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <span className="text-sm font-semibold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-md mb-4 inline-block">
              {major.field}
            </span>
            <h1 className="text-4xl font-extrabold text-white mb-2">{major.name}</h1>
          </div>
          
          {account && (
            <RoadmapTriggerButton 
              studentId={account.userId} 
              targetType="major" 
              targetId={major.id} 
            />
          )}
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-zinc-300 text-lg leading-relaxed">
            {major.description || "Chưa có thông tin mô tả chi tiết."}
          </p>
        </div>

        {account && (
          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-2">Đánh giá khả năng đỗ</h3>
            <p className="text-zinc-400 mb-4 text-sm">
              Sử dụng điểm số hồ sơ của bạn để phân tích cơ hội đỗ vào các trường đào tạo ngành này.
            </p>
            <UniversityMatchTrigger 
              studentId={account.userId} 
              majorId={major.id} 
              majorSlug={major.slug} 
            />
          </div>
        )}
        
        {major.skills && major.skills.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4">Kỹ năng cần thiết</h3>
            <div className="flex flex-wrap gap-2">
              {major.skills.map((skill: string, idx: number) => (
                <span key={idx} className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-md text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Các trường đào tạo ngành này</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {major.university_majors?.map((um: any) => {
          const uni = um.universities;
          if (!uni) return null;
          return (
            <Link href={`/universities/${uni.id}`} key={uni.id}>
              <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 transition-all flex items-center space-x-4">
                {uni.logo_url ? (
                  <Image src={uni.logo_url} alt={uni.name} width={48} height={48} className="rounded object-contain bg-white p-1" />
                ) : (
                  <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                    {uni.code}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base leading-tight mb-1">{uni.name}</h3>
                  <p className="text-xs text-zinc-400">{uni.code} • {uni.type === 'public' ? 'Công lập' : 'Tư thục'}</p>
                </div>
              </div>
            </Link>
          );
        })}
        {(!major.university_majors || major.university_majors.length === 0) && (
          <div className="col-span-full text-zinc-500 bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-xl text-center">
            Hiện chưa có thông tin trường nào đào tạo ngành này.
          </div>
        )}
      </div>
    </div>
  );
}
