import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Calendar, Tag } from "lucide-react";

export const metadata = {
  title: "Cẩm nang | 1learn.asia",
  description: "Cẩm nang hướng nghiệp, tâm lý học đường và kỹ năng phát triển bản thân.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedParams = await searchParams;
  const currentCategorySlug = resolvedParams.category;

  const supabase = await createClient();
  
  // 1. Fetch Categories
  const { data: categories } = await supabase
    .from("content_categories")
    .select("id, name, slug")
    .order("name");

  // 2. Fetch Posts
  let query = supabase
    .from("content_posts")
    .select("id, title, slug, excerpt, cover_image_url, published_at, content_categories!inner(name, slug)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (currentCategorySlug) {
    query = query.eq("content_categories.slug", currentCategorySlug);
  }

  const { data: posts } = await query;

  const featuredPost = !currentCategorySlug && posts && posts.length > 0 ? posts[0] : null;
  const gridPosts = featuredPost ? posts?.slice(1) : posts;

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0E1B3D] text-white overflow-hidden rounded-b-[40px] md:rounded-b-[80px]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2073&q=80" 
            alt="Blog Background" 
            fill
            priority
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B3D]/30 via-[#0E1B3D]/60 to-[#0E1B3D]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-6 bg-white/5 backdrop-blur-md">
            Cẩm nang 1learn
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-6 text-white">
            Góc nhìn sâu sắc<br />
            về <span className="italic text-[#B89862]">định hướng tương lai.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
            Nơi tổng hợp các bài viết phân tích, chia sẻ kinh nghiệm thực tế về chọn ngành, chọn nghề, và thấu hiểu bản thân dành cho cả học sinh và phụ huynh.
          </p>
        </div>
      </section>

      {/* CATEGORY FILTER */}
      <section className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
          <Link 
            href="/blog"
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              !currentCategorySlug 
                ? "bg-[#0E1B3D] text-white shadow-md" 
                : "bg-white text-[#0E1B3D]/70 hover:bg-white hover:text-[#0E1B3D] border border-[#0E1B3D]/10"
            }`}
          >
            Tất cả bài viết
          </Link>
          
          {categories?.map((cat) => (
            <Link 
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                currentCategorySlug === cat.slug
                  ? "bg-[#0E1B3D] text-white shadow-md" 
                  : "bg-white text-[#0E1B3D]/70 hover:bg-white hover:text-[#0E1B3D] border border-[#0E1B3D]/10"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED POST (Only show if no category filter and we have posts) */}
      {featuredPost && (
        <section className="max-w-6xl mx-auto px-6 mb-16 md:mb-24">
          <Link href={`/blog/${featuredPost.slug}`} className="group block relative bg-white rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_20px_50px_rgba(14,27,61,0.05)] border border-[#0E1B3D]/5 flex flex-col md:flex-row min-h-[400px]">
            {/* Image */}
            <div className="w-full md:w-3/5 h-[300px] md:h-auto relative overflow-hidden bg-[#0E1B3D]/5">
              {featuredPost.cover_image_url ? (
                <Image 
                  src={featuredPost.cover_image_url} 
                  alt={featuredPost.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0E1B3D] to-[#1a2c5b] opacity-10"></div>
              )}
            </div>
            
            {/* Content */}
            <div className="w-full md:w-2/5 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#B89862] bg-[#B89862]/10 px-3 py-1.5 rounded-full">
                  <Tag className="w-3.5 h-3.5" />
                  {(featuredPost.content_categories as any)?.name || "Chung"}
                </span>
                {featuredPost.published_at && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#0E1B3D]/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(featuredPost.published_at).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
              
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#0E1B3D] leading-tight mb-6 group-hover:text-[#B89862] transition-colors">
                {featuredPost.title}
              </h2>
              
              <p className="text-[#0E1B3D]/70 text-lg leading-relaxed mb-8 line-clamp-3">
                {featuredPost.excerpt}
              </p>
              
              <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0E1B3D] uppercase tracking-wider mt-auto group-hover:gap-4 transition-all">
                Đọc bài viết <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* POST GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-24 md:pb-32">
        {gridPosts && gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {gridPosts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(14,27,61,0.1)] border border-[#0E1B3D]/5 transition-all duration-300 flex flex-col h-full"
              >
                {/* Image */}
                <div className="w-full h-[240px] relative overflow-hidden bg-[#0E1B3D]/5">
                  {post.cover_image_url ? (
                    <Image 
                      src={post.cover_image_url} 
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0E1B3D] to-[#1a2c5b] opacity-5"></div>
                  )}
                  
                  {/* Category Badge over image */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#0E1B3D]">
                    {(post.content_categories as any)?.name || "Chung"}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  {post.published_at && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#0E1B3D]/50 mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.published_at).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  
                  <h3 className="font-serif text-2xl text-[#0E1B3D] leading-snug mb-4 group-hover:text-[#B89862] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-[#0E1B3D]/60 text-base leading-relaxed mb-6 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0E1B3D] mt-auto">
                    Chi tiết <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#0E1B3D]/10">
            <h3 className="font-serif text-2xl text-[#0E1B3D] mb-4">Chưa có bài viết nào</h3>
            <p className="text-[#0E1B3D]/60">Các bài viết thuộc danh mục này đang được chúng tôi biên soạn và sẽ sớm ra mắt.</p>
          </div>
        )}
      </section>
    </div>
  );
}
