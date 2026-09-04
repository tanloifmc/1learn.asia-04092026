import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Globe, BookOpen,
  GraduationCap, ChevronRight, Award, ExternalLink, Shield
} from "lucide-react";
import { HeroCarousel } from "@/components/ui/hero-carousel";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate placeholder brand color from university name
function getUniversityTheme(name: string): { bg: string; accent: string } {
  const themes = [
    { bg: "#0E1B3D", accent: "#B89862" },
    { bg: "#1A3A6B", accent: "#E8D8A0" },
    { bg: "#1A5C3A", accent: "#A8D8B0" },
    { bg: "#5A1A1A", accent: "#E8A0A0" },
    { bg: "#2D5A7B", accent: "#A0C8E8" },
    { bg: "#4A2545", accent: "#D4A8D8" },
    { bg: "#3A4A1A", accent: "#C8E8A0" },
    { bg: "#1A3A4A", accent: "#A0D8E8" },
  ];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return themes[Math.abs(hash) % themes.length];
}

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean)
    .filter(w => w[0] === w[0]?.toUpperCase())
    .slice(0, 2).map(w => w[0]).join("") || name.slice(0, 2).toUpperCase();
}

const UNI_TYPE_LABELS: Record<string, string> = {
  public: "Trường Công lập",
  private: "Trường Tư thục",
  foreign_invested: "Trường có vốn nước ngoài",
  international: "Trường Quốc tế",
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("universities").select("name").eq("id", slug).maybeSingle();
  return {
    title: data?.name ? `${data.name} - 1learn.asia` : "Trường Đại học - 1learn.asia",
    description: `Thông tin, ngành học và điểm chuẩn tham khảo của ${data?.name || "trường đại học"}.`,
  };
}

export default async function UniversityLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // 1. University details (slug = uuid id)
  const { data: uni } = await supabase
    .from("universities")
    .select("id, name, short_name, type, province, website, logo_url, established_year, description, accreditation_status")
    .eq("id", slug)
    .maybeSingle();

  if (!uni) notFound();

  // 2. Majors this university offers
  const { data: uniMajors } = await supabase
    .from("university_majors")
    .select("id, original_major_name, majors(id, name, code, fields(name))")
    .eq("university_id", slug)
    .limit(60);

  // 3. Admission data — latest scores per major
  const majorIds = (uniMajors || [])
    .map(um => (um.majors as any)?.id)
    .filter(Boolean);

  let admissionData: Record<string, { min: number; max: number; year: number }> = {};

  if (majorIds.length > 0) {
    const { data: admData } = await supabase
      .from("admission_data")
      .select("major_id, total_score, year")
      .eq("university_id", slug)
      .in("major_id", majorIds)
      .order("year", { ascending: false });

    for (const ad of admData || []) {
      if (!ad.major_id || !ad.total_score) continue;
      const k = ad.major_id;
      if (!admissionData[k] || ad.year > admissionData[k].year) {
        admissionData[k] = { min: ad.total_score, max: ad.total_score, year: ad.year };
      } else if (ad.year === admissionData[k].year) {
        admissionData[k].min = Math.min(admissionData[k].min, ad.total_score);
        admissionData[k].max = Math.max(admissionData[k].max, ad.total_score);
      }
    }
  }

  // Group majors by field
  const byField: Record<string, { majorId: string; name: string; code: string; adm?: { min: number; max: number; year: number } }[]> = {};
  for (const um of uniMajors || []) {
    const major = um.majors as any;
    if (!major) continue;
    const fieldName = major.fields?.name || "Các ngành khác";
    if (!byField[fieldName]) byField[fieldName] = [];
    byField[fieldName].push({
      majorId: major.id,
      name: um.original_major_name || major.name,
      code: major.code,
      adm: admissionData[major.id],
    });
  }

  const totalMajors = uniMajors?.length || 0;
  const theme = getUniversityTheme(uni.name);

  // Placeholder images for the carousel (if DB had gallery, we would use it)
  const carouselImages = [
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24">

      {/* ── HERO CAROUSEL ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <HeroCarousel images={carouselImages} themeAccent={theme.accent} />

        {/* Floating Header info overlaid on carousel bottom */}
        <div className="absolute top-8 left-6 md:left-10 z-30">
          <Link href="javascript:history.back()"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
        </div>

        <div className="absolute -bottom-16 left-0 right-0 z-30 px-4 sm:px-6 md:px-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-end md:items-center gap-6">
            {/* Logo / Avatar */}
            {uni.logo_url ? (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-4 shadow-2xl flex-shrink-0 border border-[#0E1B3D]/10 overflow-hidden translate-y-8 md:translate-y-0">
                <div className="relative w-full h-full">
                  <Image src={uni.logo_url} alt={uni.name} fill className="object-contain" sizes="160px" />
                </div>
              </div>
            ) : (
              <div
                className="w-32 h-32 md:w-40 md:h-40 rounded-3xl flex items-center justify-center font-black text-4xl flex-shrink-0 shadow-2xl translate-y-8 md:translate-y-0 text-white"
                style={{ backgroundColor: `${theme.accent}90` }}>
                {getInitials(uni.name)}
              </div>
            )}

            <div className="flex-1 min-w-0 pb-4 w-full md:w-auto">
              {uni.short_name && (
                <div className="inline-flex items-center px-3 py-1 rounded-full mb-3 text-[10px] font-black tracking-widest uppercase bg-black/40 text-white backdrop-blur-sm border border-white/20">
                  {uni.short_name}
                </div>
              )}
              <h1 className="font-serif text-3xl md:text-5xl text-[#0E1B3D] drop-shadow-sm mb-4 leading-tight">{uni.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-[#0E1B3D]/70 text-sm font-medium">
                {uni.type && (
                  <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                    <Building2 className="w-4 h-4" />{UNI_TYPE_LABELS[uni.type] || uni.type}
                  </span>
                )}
                {uni.province && (
                  <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                    <MapPin className="w-4 h-4" />{uni.province}
                  </span>
                )}
                {uni.established_year && (
                  <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                    <Award className="w-4 h-4" />Thành lập {uni.established_year}
                  </span>
                )}
                {totalMajors > 0 && (
                  <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
                    <BookOpen className="w-4 h-4" />{totalMajors} ngành đào tạo
                  </span>
                )}
              </div>
            </div>

            {/* Website */}
            {uni.website && (
              <a href={uni.website.startsWith("http") ? uni.website : `https://${uni.website}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-transform shadow-xl hover:scale-105 active:scale-95 flex-shrink-0 mb-4 md:mb-0"
                style={{ backgroundColor: theme.accent, color: theme.bg }}>
                <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 mt-24 md:mt-20 relative z-20 space-y-8">

        {/* ── DESCRIPTION ────────────────────────────────────────────── */}
        {uni.description && (
          <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${theme.bg}12` }}>
                <Building2 className="w-4 h-4" style={{ color: theme.bg }} />
              </div>
              <h2 className="font-serif text-xl text-[#0E1B3D]">Giới thiệu về trường</h2>
            </div>
            <p className="text-[#0E1B3D]/70 leading-relaxed">{uni.description}</p>
          </div>
        )}

        {/* ── MAJORS BY FIELD ──────────────────────────────────────── */}
        {Object.keys(byField).length > 0 ? (
          <div className="bg-white rounded-3xl border border-[#0E1B3D]/8 shadow-md overflow-hidden">
            {/* Table header */}
            <div className="p-6 md:p-8 border-b border-[#0E1B3D]/8">
              <h2 className="font-serif text-xl text-[#0E1B3D] flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-[#B89862]" />
                Ngành đào tạo & Điểm chuẩn tham khảo
              </h2>
              <p className="text-[10px] text-[#0E1B3D]/40 leading-relaxed">
                Điểm chuẩn chỉ mang tính tham khảo từ dữ liệu tuyển sinh công khai. Vui lòng xác nhận trực tiếp với nhà trường để có thông tin chính xác nhất.
              </p>
            </div>

            <div className="divide-y divide-[#0E1B3D]/5">
              {Object.entries(byField).map(([fieldName, majors]) => (
                <div key={fieldName} className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-5 rounded-full" style={{ backgroundColor: theme.bg }} />
                    <h3 className="font-bold text-xs uppercase tracking-widest text-[#0E1B3D]/50">{fieldName}</h3>
                    <span className="text-[10px] text-[#0E1B3D]/30">({majors.length} ngành)</span>
                  </div>
                  <div className="space-y-2">
                    {majors.map((m) => (
                      <div key={m.majorId}
                        className="flex items-center justify-between p-4 rounded-2xl bg-[#0E1B3D]/2 border border-[#0E1B3D]/6 hover:bg-[#0E1B3D]/5 transition-all">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-semibold text-sm text-[#0E1B3D] truncate">{m.name}</p>
                          {m.code && <p className="text-[10px] text-[#0E1B3D]/35 font-mono mt-0.5">{m.code}</p>}
                        </div>
                        {m.adm ? (
                          <div className="text-right flex-shrink-0">
                            <div className="font-black text-sm" style={{ color: theme.bg }}>
                              {m.adm.min === m.adm.max
                                ? m.adm.min.toFixed(2)
                                : `${m.adm.min.toFixed(2)}–${m.adm.max.toFixed(2)}`}
                            </div>
                            <div className="text-[10px] text-[#0E1B3D]/35">điểm · {m.adm.year}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#0E1B3D]/25 flex-shrink-0">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-[#0E1B3D]/8 shadow-md text-center">
            <BookOpen className="w-10 h-10 text-[#0E1B3D]/15 mx-auto mb-3" />
            <p className="text-[#0E1B3D]/40 text-sm">Đang cập nhật thông tin ngành học của trường này.</p>
          </div>
        )}

        {/* ── DISCLAIMER ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-5 bg-white rounded-2xl border border-[#0E1B3D]/8">
          <Shield className="w-5 h-5 text-[#0E1B3D]/25 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#0E1B3D]/40 leading-relaxed">
            Thông tin trên đây được tổng hợp nhằm <strong>mục đích tham khảo</strong>.
            1learn.asia không đại diện pháp lý cho trường và không chịu trách nhiệm về tính chính xác tuyệt đối của dữ liệu tuyển sinh.
            Hãy liên hệ trực tiếp với trường để có thông tin tuyển sinh chính thức và cập nhật nhất.
          </p>
        </div>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <div className="text-center pb-4">
          <Link href="/me/bao-cao/premium"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold bg-[#4A2545] text-white hover:bg-[#B89862] hover:text-[#4A2545] transition-all shadow-xl">
            Xem trường phù hợp với hồ sơ của bạn <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
