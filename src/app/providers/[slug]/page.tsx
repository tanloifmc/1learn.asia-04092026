import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { FavoriteToggle } from "@/components/favorites/favorite-toggle";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { ArrowLeft, MapPin, Globe, Mail, Phone, BookOpen, Target, ChevronRight } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("organizations").select("name").eq("slug", slug).maybeSingle();
  return {
    title: data?.name ? `${data.name} - 1learn.asia` : "Nhà cung cấp - 1learn.asia",
  };
}

export default async function ProviderDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("organizations")
    .select("id, name, slug, logo_url, description, contact_email, contact_phone, website_url")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  if (!provider) notFound();

  // Generate an accent color based on name (simulating DB theme)
  const themes = ["#B89862", "#4A2545", "#1A5C3A", "#2D5A7B", "#5A1A1A"];
  let hash = 0;
  for (const ch of provider.name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const themeAccent = themes[Math.abs(hash) % themes.length];

  // Placeholder images for the carousel (if DB had gallery, we would use it)
  const carouselImages = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">
      {/* ── 1. HERO CAROUSEL ──────────────────────────────────────────── */}
      <div className="relative">
        <HeroCarousel images={carouselImages} themeAccent={themeAccent} />
        
        {/* Floating Header info overlaid on carousel bottom */}
        <div className="absolute top-8 left-6 md:left-10 z-30">
          <Link href="/providers" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
        </div>

        <div className="absolute -bottom-16 left-0 right-0 z-30 px-4 sm:px-6 md:px-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-6">
            {/* Logo */}
            {provider.logo_url ? (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-4 shadow-2xl flex-shrink-0 border border-[#0E1B3D]/10 overflow-hidden translate-y-8 md:translate-y-0">
                <div className="relative w-full h-full">
                  <Image src={provider.logo_url} alt={provider.name} fill className="object-contain" unoptimized />
                </div>
              </div>
            ) : (
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center font-black text-4xl flex-shrink-0 shadow-2xl translate-y-8 md:translate-y-0 text-white"
                style={{ backgroundColor: themeAccent }}
              >
                {provider.name.charAt(0)}
              </div>
            )}

            {/* Title & Actions */}
            <div className="flex-1 min-w-0 pb-4 w-full md:w-auto">
              <h1 className="font-serif text-3xl md:text-5xl text-[#0E1B3D] drop-shadow-sm mb-3">
                {provider.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/inquiries/new/${provider.id}`} 
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: themeAccent }}>
                  Đăng ký tư vấn
                </Link>
                <div className="bg-white rounded-full shadow-sm border border-[#0E1B3D]/10 hover:bg-[#0E1B3D]/5 transition-colors">
                  <FavoriteToggle entityId={provider.id} entityType="organization" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CONTENT SECTIONS ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 mt-24 md:mt-20 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0E1B3D]/5 flex items-center justify-center text-[#0E1B3D]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-2xl text-[#0E1B3D]">Giới thiệu</h2>
              </div>
              <div className="prose prose-slate max-w-none text-[#0E1B3D]/70 leading-relaxed whitespace-pre-wrap">
                {provider.description || "Đang cập nhật thông tin giới thiệu."}
              </div>
            </section>

            {/* Highlights (Mocked for Landing Page demo) */}
            <section className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0E1B3D]/5 flex items-center justify-center text-[#0E1B3D]">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-2xl text-[#0E1B3D]">Điểm nổi bật</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Chương trình đào tạo chuẩn Quốc tế",
                  "100% Giảng viên có chứng chỉ chuyên môn",
                  "Cơ sở vật chất hiện đại, phòng Lab 24/7",
                  "Cam kết hỗ trợ việc làm sau tốt nghiệp"
                ].map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-[#F7F5F0]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${themeAccent}20`, color: themeAccent }}>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <span className="text-[#0E1B3D] font-medium text-sm">{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 border border-[#0E1B3D]/8 shadow-sm sticky top-24">
              <h3 className="font-serif text-xl text-[#0E1B3D] mb-6 border-b border-[#0E1B3D]/5 pb-4">Thông tin liên hệ</h3>
              
              <ul className="space-y-5">
                {provider.website_url && (
                  <li>
                    <a href={provider.website_url.startsWith('http') ? provider.website_url : `https://${provider.website_url}`} 
                       target="_blank" rel="noreferrer" 
                       className="flex items-start gap-3 text-[#0E1B3D]/70 hover:text-[#0E1B3D] group transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center group-hover:bg-[#0E1B3D]/10 transition-colors shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="mt-1.5 text-sm break-all">{provider.website_url}</span>
                    </a>
                  </li>
                )}
                {provider.contact_phone && (
                  <li>
                    <a href={`tel:${provider.contact_phone}`} 
                       className="flex items-center gap-3 text-[#0E1B3D]/70 hover:text-[#0E1B3D] group transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center group-hover:bg-[#0E1B3D]/10 transition-colors shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{provider.contact_phone}</span>
                    </a>
                  </li>
                )}
                {provider.contact_email && (
                  <li>
                    <a href={`mailto:${provider.contact_email}`} 
                       className="flex items-center gap-3 text-[#0E1B3D]/70 hover:text-[#0E1B3D] group transition-colors">
                      <div className="w-8 h-8 rounded-full bg-[#0E1B3D]/5 flex items-center justify-center group-hover:bg-[#0E1B3D]/10 transition-colors shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-sm truncate">{provider.contact_email}</span>
                    </a>
                  </li>
                )}
                {!provider.website_url && !provider.contact_phone && !provider.contact_email && (
                  <p className="text-sm text-[#0E1B3D]/40 italic text-center">Đang cập nhật thông tin liên hệ.</p>
                )}
              </ul>

              <div className="mt-8 pt-6 border-t border-[#0E1B3D]/5">
                <Link href={`/inquiries/new/${provider.id}`} 
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[#0E1B3D] bg-[#F7F5F0] hover:bg-[#0E1B3D]/5 transition-colors border border-[#0E1B3D]/10 text-sm">
                  Gửi yêu cầu tư vấn
                </Link>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
