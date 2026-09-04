import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MajorsExplorerPage() {
  const supabase = await createClient();
  const { data: majors, error } = await supabase
    .from("majors")
    .select("*")
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) {
    return <div className="p-6 text-red-500">Error loading majors</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Khám Phá Nhóm Ngành</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {majors?.map(major => (
          <Link href={`/universities/matches?major=${major.slug}`} key={major.id}>
            <div className="border border-gray-200 rounded-lg p-5 bg-white hover:border-primary hover:shadow-md transition cursor-pointer">
              <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded-md mb-2 inline-block">
                {major.field}
              </span>
              <h2 className="text-xl font-bold mb-2 text-gray-900">{major.name}</h2>
              <p className="text-sm text-gray-600 line-clamp-2">{major.description}</p>
              <div className="mt-4 text-primary text-sm font-medium flex items-center">
                Xem trường phù hợp →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
