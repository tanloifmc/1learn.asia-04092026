import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Map, BarChart3, Route, BookOpen, GraduationCap, ShieldCheck, Target, Lock, CheckCircle2, Star, Search, Sparkles, User, Scale, Flag, ChevronRight, Briefcase, MapPin, TrendingUp, FileText, Landmark } from "lucide-react";
import { HeroSlider } from "@/components/home/hero-slider";

export const metadata = {
  title: "1learn.asia - Hiểu mình. Chọn đúng hướng.",
  description: "Nền tảng hướng nghiệp khoa học dành cho học sinh THPT và phụ huynh Việt Nam.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-background selection:bg-gold/30">
      
      {/* 3. HERO — 3 SLIDES */}
      <HeroSlider />

      {/* 4. TRUST MICRO COPY DƯỚI HERO */}
      <section className="w-full py-8 border-b border-navy/5 bg-background">
        <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 text-sm">
          <div className="flex items-center gap-3 text-navy/70">
            <CheckCircle2 className="w-5 h-5 text-gold" />
            <span><strong className="text-navy font-semibold">Miễn phí</strong> — Bắt đầu khám phá mà không cần cam kết</span>
          </div>
          <div className="flex items-center gap-3 text-navy/70">
            <Lock className="w-5 h-5 text-gold" />
            <span><strong className="text-navy font-semibold">Bảo mật</strong> — Thông tin cá nhân luôn được tôn trọng</span>
          </div>
          <div className="flex items-center gap-3 text-navy/70">
            <Compass className="w-5 h-5 text-gold" />
            <span><strong className="text-navy font-semibold">Bạn làm chủ lựa chọn</strong> — 1learn hỗ trợ, không quyết định thay bạn</span>
          </div>
        </div>
      </section>

      {/* 5. SECTION — MOMENT OF RECOGNITION */}
      <section className="w-full py-16 md:py-24 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-navy tracking-tight">Bạn đang ở đâu trên hành trình chọn tương lai?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Panel 01 — Học sinh */}
            <div className="bg-[#F4F8FB] rounded-3xl border border-[#E2E8F0] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[420px] shadow-sm hover:shadow-md transition-shadow">
              
              <div className="relative z-10 w-full md:w-[60%]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 bg-[#1E293B] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-2xl text-[#1E293B]">Học sinh</h3>
                </div>
                
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#1E293B]/20 text-[#1E293B] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <Search className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Mình thích nhiều thứ nhưng chưa biết mình thực sự hợp gì.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#1E293B]/20 text-[#1E293B] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <Map className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Có quá nhiều ngành,<br/>quá nhiều trường.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#1E293B]/20 text-[#1E293B] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <Route className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Mình không biết nên<br/>chuẩn bị từ đâu.</p>
                  </li>
                </ul>
              </div>

              {/* Image (Right aligned, clean fade) */}
              <div 
                className="absolute right-0 bottom-0 top-0 w-[45%] bg-cover bg-center"
                style={{ 
                  backgroundImage: "url('https://images.unsplash.com/photo-1531545514251-b159ce9378ca?q=80&w=800&auto=format&fit=crop')",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                  maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)"
                }}
              />
            </div>

            {/* Panel 02 — Phụ huynh */}
            <div className="bg-[#FCF9F4] rounded-3xl border border-[#F0E6D2] p-6 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[420px] shadow-sm hover:shadow-md transition-shadow">
              
              <div className="relative z-10 w-full md:w-[60%]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 bg-[#B89862] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-2xl text-[#1E293B]">Phụ huynh</h3>
                </div>
                
                <ul className="space-y-6">
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#B89862]/40 text-[#B89862] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <Compass className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Muốn định hướng cho con nhưng không biết đâu là lựa chọn phù hợp.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#B89862]/40 text-[#B89862] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <Target className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Sợ con chọn sai.</p>
                  </li>
                  <li className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-[#B89862]/40 text-[#B89862] flex items-center justify-center shrink-0 mt-0.5 bg-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <p className="text-[15px] text-[#1E293B]/80 font-medium leading-relaxed">Nhưng cũng không muốn<br/>quyết định thay con.</p>
                  </li>
                </ul>
              </div>

              {/* Image (Right aligned, clean fade) */}
              <div 
                className="absolute right-0 bottom-0 top-0 w-[45%] bg-cover bg-center"
                style={{ 
                  backgroundImage: "url('https://images.unsplash.com/photo-1596496622830-1014e7dc2fbc?q=80&w=800&auto=format&fit=crop')",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)",
                  maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 100%)"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. CORE DIFFERENTIATOR — HERO SECTION THỨ HAI */}
      <section className="w-full py-16 md:py-24 px-6 bg-[#0E1B3D] text-white relative overflow-hidden rounded-3xl mx-auto max-w-[96%] mt-8 mb-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            
            {/* Title Left */}
            <div className="w-full lg:w-1/4 text-center lg:text-left">
              <h2 className="font-serif text-4xl md:text-5xl lg:text-5xl leading-tight tracking-tight text-white/90">
                1learn không dừng ở một bài trắc nghiệm
              </h2>
            </div>
            
            {/* 5 Steps Right */}
            <div className="w-full lg:w-3/4 flex flex-wrap md:flex-nowrap justify-center lg:justify-between items-start relative gap-y-10">
              {[
                { title: "Hiểu mình", desc: "Đánh giá đa chiều về bản thân", icon: <User className="w-7 h-7" /> },
                { title: "Khám phá nghề", desc: "Gợi ý những nghề phù hợp", icon: <Compass className="w-7 h-7" /> },
                { title: "Chọn ngành", desc: "Kết nối nghề nghiệp với ngành học", icon: <GraduationCap className="w-7 h-7" /> },
                { title: "Tìm trường", desc: "Gợi ý trường đại học phù hợp", icon: <Landmark className="w-7 h-7" /> },
                { title: "Lập lộ trình", desc: "Biết cần làm gì để tiến gần mục tiêu", icon: <MapPin className="w-7 h-7 text-[#E38561]" /> }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center relative w-[45%] md:w-1/5 px-2">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 text-[#0E1B3D] shadow-lg relative z-10">
                    {step.icon}
                  </div>
                  <h3 className="text-[16px] font-bold mb-2 text-white">{step.title}</h3>
                  <p className="text-white/60 text-[12px] leading-tight px-1">{step.desc}</p>
                  
                  {i < 4 && (
                    <div className="hidden md:flex absolute top-10 -right-6 w-12 items-center justify-center text-white/30 z-0">
                      <ArrowRight className="w-6 h-6" strokeWidth={1} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
          </div>
          
          {/* Bottom Callout */}
          <div className="mt-24 text-center max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Left Laurel */}
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" className="hidden md:block text-[#C6A15B] opacity-80">
              <path d="M50 10 C30 30, 30 50, 50 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M48 20 C35 25, 35 35, 42 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M43 40 C30 45, 30 55, 37 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M50 10 C45 5, 35 15, 48 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M42 40 C37 35, 27 45, 43 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M37 60 C32 55, 22 65, 37 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
            
            <h3 className="font-serif text-3xl md:text-4xl leading-tight">
              <span className="text-[#C6A15B]">Không chỉ nói bạn phù hợp với nghề gì.</span><br/>
              <span className="text-white mt-3 block">1learn cho bạn biết tiếp theo nên làm gì.</span>
            </h3>

            {/* Right Laurel */}
            <svg width="60" height="80" viewBox="0 0 60 80" fill="none" className="hidden md:block text-[#C6A15B] opacity-80 transform scale-x-[-1]">
              <path d="M50 10 C30 30, 30 50, 50 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M48 20 C35 25, 35 35, 42 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M43 40 C30 45, 30 55, 37 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M50 10 C45 5, 35 15, 48 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M42 40 C37 35, 27 45, 43 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M37 60 C32 55, 22 65, 37 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="w-full py-16 md:py-32 px-6 bg-[#F9F7F4]">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-24 max-w-4xl mx-auto">
            <h2 className="font-serif text-4xl md:text-6xl text-[#0E1B3D] mb-6 tracking-tight">Từ hiểu mình đến biết mình cần làm gì</h2>
            <p className="text-xl text-[#0E1B3D]/70 font-light">Một hành trình rõ ràng hơn để biến sự mơ hồ thành những lựa chọn cụ thể.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              { num: "01", title: "Hiểu mình", desc: "Khám phá sở thích, năng lực, đặc điểm cá nhân và giá trị nghề nghiệp.", icon: <User className="w-10 h-10 text-[#C6A15B]" strokeWidth={1} /> },
              { num: "02", title: "Khám phá lựa chọn", desc: "Xem những nghề nghiệp, ngành học và trường đại học phù hợp với hồ sơ của bạn.", icon: <Compass className="w-10 h-10 text-[#C6A15B]" strokeWidth={1} /> },
              { num: "03", title: "So sánh & lựa chọn", desc: "Đánh giá mức độ phù hợp và khám phá những lựa chọn tiềm năng.", icon: <Scale className="w-10 h-10 text-[#C6A15B]" strokeWidth={1} /> }, 
              { num: "04", title: "Lập kế hoạch", desc: "Biết mình còn thiếu gì và cần chuẩn bị gì để tiến gần mục tiêu.", icon: <Flag className="w-10 h-10 text-[#C6A15B]" strokeWidth={1} /> }
            ].map((card, i) => (
              <div key={i} className="relative group">
                <div className="bg-white border border-[#C6A15B]/20 p-6 md:p-10 rounded-[32px] h-full flex flex-col items-center text-center transition-all hover:border-[#C6A15B]/60 hover:-translate-y-2 duration-500 shadow-sm hover:shadow-xl">
                  {/* Number Badge */}
                  <div className="absolute top-6 left-6 w-10 h-10 rounded-full border border-[#C6A15B]/30 flex items-center justify-center text-sm font-bold text-[#C6A15B] bg-[#F9F7F4]">
                    {card.num}
                  </div>
                  
                  <div className="mt-8 mb-6 p-5 rounded-full bg-[#F9F7F4] shadow-inner border border-[#C6A15B]/10">
                     {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#0E1B3D] mb-4">{card.title}</h3>
                  <p className="text-[15px] text-[#0E1B3D]/70 leading-relaxed font-medium">{card.desc}</p>
                </div>
                
                {/* Connecting Arrow for Desktop */}
                {i < 3 && (
                  <div className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center text-[#C6A15B]/40 z-20">
                    <ChevronRight className="w-8 h-8" strokeWidth={1} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. OUTPUT SECTION */}
      <section className="w-full py-16 md:py-32 px-6 bg-[#0E1B3D] text-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20 md:mb-28">
            <h2 className="font-serif text-4xl md:text-6xl text-white tracking-tight">Sau khi khám phá, bạn sẽ có gì?</h2>
            <div className="w-24 h-1 bg-[#C6A15B] mx-auto mt-8 opacity-50"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
              {[
                { title: "Hồ sơ cá nhân", desc: "Hiểu sở thích, năng lực, đặc điểm và giá trị nghề nghiệp.", icon: <User className="w-8 h-8 text-[#C6A15B]" /> },
                { title: "Bản đồ nghề", desc: "Những nhóm nghề phù hợp để bạn tiếp tục khám phá.", icon: <Briefcase className="w-8 h-8 text-[#C6A15B]" /> },
                { title: "Ngành & Trường", desc: "Kết nối nghề nghiệp → ngành học → trường đại học.", icon: <GraduationCap className="w-8 h-8 text-[#C6A15B]" /> },
                { title: "Lộ trình", desc: "Biết mục tiêu, khoảng cách hiện tại và những việc cần chuẩn bị.", icon: <MapPin className="w-8 h-8 text-[#C6A15B]" /> },
                { title: "Hành động", desc: "Cung cấp các bước cụ thể để từng bước tiến đến mục tiêu.", icon: <TrendingUp className="w-8 h-8 text-[#C6A15B]" /> },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="w-24 h-24 rounded-full border border-[#C6A15B]/30 bg-white/5 flex items-center justify-center mb-8 shadow-lg transition-all duration-500 group-hover:-translate-y-3 group-hover:bg-[#C6A15B]/10 group-hover:border-[#C6A15B]">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-[14px] text-white/60 font-medium leading-relaxed px-2">{item.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* BOTTOM SECTIONS WRAPPER */}
      <div className="w-full py-12 md:py-16 px-4 md:px-6 lg:px-12 bg-white flex flex-col gap-12">
        
        {/* 9. PARENT SECTION */}
        <section className="w-full bg-[#FDFCFB] border border-navy/5 shadow-sm rounded-3xl md:rounded-[40px] px-6 py-12 md:p-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 w-full order-1">
              <h2 className="font-serif text-4xl md:text-5xl text-navy leading-tight mb-6">
                Đồng hành cùng con,<br/> không chọn thay con.
              </h2>
              <div className="text-lg text-navy/70 font-medium mb-16 max-w-md leading-relaxed">
                <p>1learn không chọn tương lai thay con.</p>
                <p>1learn giúp gia đình có đủ thông tin để cùng con lựa chọn.</p>
              </div>
              
              <div className="flex justify-between items-start max-w-lg">
                {[
                  { icon: <TrendingUp className="w-6 h-6" />, label: "Theo dõi tiến trình" },
                  { icon: <FileText className="w-6 h-6" />, label: "Báo cáo dễ hiểu" },
                  { icon: <Sparkles className="w-6 h-6" />, label: "Gợi ý trao đổi" },
                  { icon: <Lock className="w-6 h-6" />, label: "Bảo mật tuyệt đối" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-4 w-1/4 px-2">
                    <div className="text-[#C6A15B]">
                      {item.icon}
                    </div>
                    <div className="text-xs font-bold text-navy/80 uppercase tracking-wide">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 order-2 relative w-full h-full flex justify-end">
              <div className="bg-white rounded-[24px] shadow-2xl p-6 border border-navy/5 w-full max-w-xl flex gap-6 relative z-10">
                {/* Mock Sidebar */}
                <div className="w-1/3 flex flex-col gap-4 border-r border-navy/5 pr-4">
                  <div className="font-bold text-navy text-sm mb-2">Góc phụ huynh</div>
                  {["Tổng quan", "Tiến trình", "Kết quả đánh giá", "Định hướng nghề", "Lộ trình học tập", "Gợi ý dành cho con"].map((item, i) => (
                    <div key={i} className={`text-xs font-semibold p-2.5 rounded-lg flex items-center gap-2 ${i === 0 ? "bg-navy/5 text-navy" : "text-navy/50"}`}>
                      {i === 0 && <User className="w-3.5 h-3.5" />}
                      {i === 1 && <TrendingUp className="w-3.5 h-3.5" />}
                      {i === 2 && <Target className="w-3.5 h-3.5" />}
                      {i === 3 && <Briefcase className="w-3.5 h-3.5" />}
                      {i === 4 && <MapPin className="w-3.5 h-3.5" />}
                      {i === 5 && <Sparkles className="w-3.5 h-3.5" />}
                      {item}
                    </div>
                  ))}
                </div>
                {/* Mock Main */}
                <div className="w-2/3 flex flex-col gap-4">
                  <div className="text-sm font-bold text-navy">Tổng quan</div>
                  <div className="flex gap-4">
                    {/* User info & Progress */}
                    <div className="w-1/2 flex flex-col gap-4">
                      <div className="bg-[#F8F9FA] p-3 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden relative">
                           <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop" alt="avatar" fill className="object-cover" sizes="40px" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-navy">Minh Anh</div>
                          <div className="text-xs text-[#C6A15B] font-bold">Lớp 11 ✦</div>
                        </div>
                      </div>
                      <div className="bg-[#F8F9FA] p-4 rounded-xl flex-1 flex flex-col justify-center">
                        <div className="text-xs text-navy/60 font-medium mb-1">Tiến trình hoàn thành</div>
                        <div className="text-3xl font-bold text-navy mb-2">75%</div>
                        <div className="w-full h-1.5 bg-navy/10 rounded-full overflow-hidden">
                          <div className="w-[75%] h-full bg-navy rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    {/* Stats & Suggestions */}
                    <div className="w-1/2 flex flex-col gap-4">
                      <div className="bg-[#F8F9FA] p-3 rounded-xl">
                        <div className="text-xs font-bold text-navy mb-3">Nhóm nghề phù hợp</div>
                        <div className="space-y-3">
                          {[
                            { name: "Nhóm Xã hội", val: 78, color: "bg-teal-500", icon: <User className="w-3 h-3 text-teal-600"/> },
                            { name: "Nhóm Nghiệp vụ", val: 72, color: "bg-green-500", icon: <FileText className="w-3 h-3 text-green-600"/> },
                            { name: "Nhóm Kỹ thuật", val: 65, color: "bg-blue-500", icon: <Briefcase className="w-3 h-3 text-blue-600"/> }
                          ].map((stat, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between text-[10px] font-bold text-navy/70 mb-1">
                                <span className="flex items-center gap-1">{stat.icon} {stat.name}</span>
                                <span>{stat.val}%</span>
                              </div>
                              <div className="w-full h-1 bg-navy/5 rounded-full overflow-hidden">
                                <div className={`w-[${stat.val}%] h-full ${stat.color} rounded-full`}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Padlock decoration */}
              <div className="absolute -top-8 right-8 w-20 h-20 bg-[#F2E8D9] rounded-full flex items-center justify-center shadow-sm z-20">
                 <Lock className="w-8 h-8 text-[#C6A15B]" />
              </div>
            </div>
          </div>
        </section>

        {/* 10. TRUST SECTION */}
        <section className="w-full bg-[#FDFCFB] border border-navy/5 shadow-sm rounded-3xl md:rounded-[40px] px-6 py-12 md:p-16">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            <div className="w-full lg:w-1/3 pr-4">
              <h2 className="font-serif text-4xl md:text-[42px] text-navy leading-tight tracking-tight">
                Dữ liệu rõ ràng.<br/>Phương pháp có cơ sở.<br/>Quyết định thuộc về bạn.
              </h2>
            </div>
            
            <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white shrink-0">
                  <span className="text-lg">⚛</span>
                </div>
                <h3 className="font-bold text-sm text-navy">Đánh giá đa chiều về bản thân</h3>
                <p className="text-navy/60 text-xs leading-relaxed font-medium">RIASEC · Big Five ·<br/>Giá trị nghề nghiệp</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-navy">Cơ sở đánh giá rõ ràng</h3>
                <p className="text-navy/60 text-xs leading-relaxed font-medium">Các bài đánh giá được xây dựng dựa trên những mô hình tâm lý học và hướng nghiệp được sử dụng rộng rãi.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-navy">Minh bạch & tôn trọng</h3>
                <p className="text-navy/60 text-xs leading-relaxed font-medium">Dữ liệu của bạn được bảo mật và chỉ bạn có quyền quyết định sử dụng.</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-navy">Góc nhìn để bạn lựa chọn</h3>
                <p className="text-navy/60 text-xs leading-relaxed font-medium">Cung cấp góc nhìn có cơ sở để bạn khám phá những lựa chọn phù hợp hơn.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 11. FINAL CTA */}
        <section className="w-full bg-[#0E1B3D] text-white rounded-3xl md:rounded-[40px] px-6 py-16 md:p-24 relative overflow-hidden shadow-xl">
          {/* Subtle decorative elements */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#C6A15B] rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#C6A15B] rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute top-1/5 right-1/5 text-[#C6A15B] text-xl">✦</div>
            <div className="absolute bottom-1/3 left-1/5 text-white/50 text-sm">✦</div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col">
              <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4 leading-tight tracking-tight text-white">
                Tương lai không cần phải <br/> quyết định trong một ngày.
              </h2>
              <p className="text-lg text-white/70 font-light">Hãy bắt đầu bằng việc hiểu mình.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <Link href="/login" className="bg-[#B89862] text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-[#A38555] transition-all flex items-center gap-3">
                Bắt đầu khám phá <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="mt-4 text-sm text-white/60 font-medium tracking-wide">
                Miễn phí &nbsp;·&nbsp; Bạn làm chủ lựa chọn của mình
              </div>
            </div>
          </div>
          
          {/* Rocket illustration in corner */}
          <div className="absolute bottom-4 right-12 opacity-80 pointer-events-none">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#B89862" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-12 translate-y-8">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
             </svg>
          </div>
          <div className="absolute bottom-16 right-32 opacity-30 pointer-events-none">
            <svg width="200" height="50" viewBox="0 0 200 50" fill="none" stroke="#B89862" strokeWidth="2" strokeDasharray="4 4" className="transform rotate-12">
               <path d="M0,50 Q50,0 100,30 T200,10"/>
            </svg>
          </div>
        </section>
      </div>

    </div>
  );
}
