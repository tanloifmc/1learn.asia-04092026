import { Metadata } from 'next';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ExploreTabs } from './components/explore-tabs';
import { CareerCard } from './components/career-card';
import { CompareTray } from './components/compare-tray';
import Link from 'next/link';
import { ArrowRight, Compass, Sparkles, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Khám phá Nghề nghiệp | 1learn.asia',
  description: 'Khám phá bản đồ nghề nghiệp, ngành học và trường đại học dành riêng cho bạn.',
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const tab = resolvedParams.tab || 'recommended';

  // Fetch saved items
  let savedCareerIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from('student_saved_items')
      .select('item_id')
      .eq('student_id', user.id)
      .eq('item_type', 'career');
    if (saved) savedCareerIds = saved.map((s: any) => s.item_id);
  }

  let content = null;

  if (tab === 'all') {
    // Fetch all careers (limit for now)
    const { data: careers } = await supabase
      .from('careers')
      .select('id, name, career_domain_code, description, cover_image_url')
      .eq('status', 'published')
      .limit(20);

    content = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-10">
        {careers?.map((career: any) => (
          <CareerCard 
            key={career.id} 
            career={career} 
            isSaved={savedCareerIds.includes(career.id)} 
          />
        ))}
      </div>
    );
  } else if (tab === 'recommended') {
    if (!user) {
      content = (
        <div className="mt-10 flex flex-col items-center justify-center p-12 md:p-20 bg-white rounded-[32px] border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="w-20 h-20 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mb-6 relative z-10">
            <Sparkles className="w-10 h-10 text-[#B89862]" />
          </div>
          <h3 className="font-serif text-3xl text-[#0E1B3D] mb-4 relative z-10">Kết quả được cá nhân hóa</h3>
          <p className="text-[#0E1B3D]/60 mb-8 max-w-md text-lg relative z-10">
            Hệ thống cần phân tích hồ sơ năng lực của bạn để đưa ra những gợi ý nghề nghiệp chính xác nhất.
          </p>
          <Link href="/dang-nhap" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all relative z-10">
            Đăng nhập để xem <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      );
    } else {
      // Fetch latest match run
      const { data: run } = await supabase
        .from('match_runs')
        .select('id')
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!run) {
        content = (
          <div className="mt-10 flex flex-col items-center justify-center p-12 md:p-20 bg-white rounded-[32px] border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            <div className="w-20 h-20 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mb-6 relative z-10">
              <Compass className="w-10 h-10 text-[#B89862]" />
            </div>
            <h3 className="font-serif text-3xl text-[#0E1B3D] mb-4 relative z-10">Bạn chưa làm Khảo sát</h3>
            <p className="text-[#0E1B3D]/60 mb-8 max-w-md text-lg relative z-10">
              Hãy hoàn thành bài đánh giá năng lực & tính cách để hệ thống AI vẽ ra bản đồ nghề nghiệp dành riêng cho bạn.
            </p>
            <Link href="/me/kham-pha" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white rounded-full font-bold hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all relative z-10">
              Làm khảo sát ngay <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        );
      } else {
        // Fetch matched careers
        const { data: matches } = await supabase
          .from('career_matches')
          .select(`
            match_score,
            career:career_id (
              id, name, career_domain_code, description, cover_image_url
            )
          `)
          .eq('run_id', run.id)
          .order('match_score', { ascending: false })
          .limit(10);
        
        content = (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-10">
            {matches?.map((match: any) => (
              <CareerCard 
                key={match.career.id} 
                career={match.career} 
                matchScore={Math.round(match.match_score)}
                isSaved={savedCareerIds.includes(match.career.id)} 
              />
            ))}
          </div>
        );
      }
    }
  } else if (tab === 'saved') {
    if (!user) {
      content = (
        <div className="mt-10 text-center py-20 bg-white rounded-[32px] border border-[#0E1B3D]/10">
          <p className="text-[#0E1B3D]/60 text-lg">Vui lòng đăng nhập để xem danh sách đang cân nhắc.</p>
        </div>
      );
    } else if (savedCareerIds.length === 0) {
      content = (
        <div className="mt-10 flex flex-col items-center justify-center p-12 md:p-20 bg-white rounded-[32px] border border-[#0E1B3D]/10 shadow-[0_20px_50px_rgba(14,27,61,0.03)] text-center">
           <div className="w-20 h-20 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center mb-6">
              <Star className="w-10 h-10 text-[#0E1B3D]/30" />
            </div>
          <h3 className="font-serif text-2xl text-[#0E1B3D] mb-4">Danh sách trống</h3>
          <p className="text-[#0E1B3D]/60 text-lg">Bạn chưa đánh dấu lưu bất kỳ nghề nghiệp nào.</p>
        </div>
      );
    } else {
      const { data: savedCareers } = await supabase
        .from('careers')
        .select('id, name, career_domain_code, description, cover_image_url')
        .in('id', savedCareerIds);
      
      content = (
        <div className="space-y-6 mt-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-2xl text-[#0E1B3D]">Đang cân nhắc ({savedCareers?.length || 0})</h3>
            {(savedCareers?.length || 0) > 0 && (
              <Link href="/explore/compare" className="px-6 py-2 bg-[#B89862] text-[#0E1B3D] rounded-full font-bold hover:bg-[#0E1B3D] hover:text-white transition-colors">
                So sánh ngay
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {savedCareers?.map((career: any) => (
              <CareerCard 
                key={career.id} 
                career={career} 
                isSaved={true} 
              />
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0E1B3D] text-white overflow-hidden rounded-b-[40px] md:rounded-b-[80px]">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
            alt="Explore Background" 
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B3D]/40 via-[#0E1B3D]/70 to-[#0E1B3D]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-6 bg-white/5 backdrop-blur-md">
            Khám phá Tương lai
          </div>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-6 text-white max-w-4xl mx-auto">
            Bản đồ dẫn tới <span className="italic text-[#B89862]">sự nghiệp mơ ước.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
            Khám phá hàng trăm lựa chọn nghề nghiệp thực tế, so sánh kỹ năng cần thiết và tìm ra con đường dành riêng cho bạn.
          </p>
        </div>
      </section>

      {/* TABS & CONTENT */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <ExploreTabs />
        
        {content}
      </section>

      <CompareTray />
    </div>
  );
}
