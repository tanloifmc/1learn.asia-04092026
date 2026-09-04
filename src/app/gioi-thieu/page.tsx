import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Target, GraduationCap, Map, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export const metadata = {
  title: "Giới thiệu | 1learn.asia",
  description: "Hiểu mình. Chọn đúng hướng. Chủ động tương lai.",
};

export default function GioiThieuPage() {
  return (
    <div className="bg-[#0E1B3D] text-white min-h-screen selection:bg-[#B89862] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-24 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80" 
            alt="Students" 
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0E1B3D]/30 via-[#0E1B3D]/60 to-[#0E1B3D]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-16">
          <div className="inline-block border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-8 backdrop-blur-md">
            1learn.asia
          </div>
          <h1 className="font-serif text-4xl md:text-7xl lg:text-[5rem] leading-[1.1] mb-6 md:mb-8 font-normal text-white">
            Hiểu mình.<br/> 
            <span className="italic text-[#B89862]">Chọn đúng hướng.</span><br/> 
            Chủ động tương lai.
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed mb-12">
            Một nền tảng giúp học sinh khám phá bản thân, tìm hướng nghề nghiệp phù hợp, lựa chọn ngành học – trường đại học và biết mình cần chuẩn bị gì từ hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-[#B89862] text-[#0E1B3D] hover:bg-[#A38555] hover:text-white transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(184,152,98,0.3)]">
              Bắt đầu khám phá miễn phí <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all text-center">
              Tôi là Phụ huynh
            </Link>
          </div>
          <p className="mt-8 text-sm text-white/40 tracking-wide">
            Không chọn đại. Không chọn theo phong trào. Không để tương lai phụ thuộc vào may rủi.
          </p>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="py-20 md:py-32 px-6 bg-[#0E1B3D] relative border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-6xl text-white mb-10 md:mb-16 leading-tight">
            15–16 tuổi, bạn có nhất thiết phải biết mình muốn làm gì?
          </h2>
          
          <div className="space-y-8 text-xl md:text-2xl font-light text-white/70 leading-relaxed max-w-3xl mx-auto">
            <p>Có thể là <strong className="text-white font-medium">chưa</strong>.</p>
            <p>Bạn có thể học khá nhiều môn nhưng chưa biết mình thích điều gì.</p>
            <p>Có thể thích công nghệ, kinh doanh, sáng tạo hoặc làm việc với con người nhưng chưa biết đâu mới là hướng phù hợp.</p>
            
            <div className="py-12 my-12 border-y border-white/10">
              <p className="text-lg uppercase tracking-widest text-white/40 mb-8 font-bold">Có thể bạn đã nghe rất nhiều lời khuyên:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">"Ngành này đang hot."</div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">"Trường này tốt."</div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">"Học ngành này dễ xin việc."</div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">"Bạn bè đều chọn ngành đó."</div>
              </div>
            </div>

            <p className="text-2xl text-white mb-8">Nhưng một câu hỏi quan trọng hơn vẫn chưa có câu trả lời:</p>
            <h3 className="font-serif text-3xl md:text-5xl text-[#B89862] italic mb-10 md:mb-16">
              "Điều gì thực sự phù hợp với mình?"
            </h3>

            <p>Và nếu chưa biết câu trả lời, bạn cũng khó biết:</p>
            <ul className="text-left max-w-md mx-auto space-y-4 mt-8 text-white text-xl font-medium">
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#B89862] rounded-full"></div> Nên chọn nghề nào?</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#B89862] rounded-full"></div> Nên học ngành gì?</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#B89862] rounded-full"></div> Nên chọn trường nào?</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-[#B89862] rounded-full"></div> Và từ bây giờ cần chuẩn bị những gì?</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. THE SOLUTION INTRO */}
      <section className="py-20 md:py-32 px-6 bg-white text-navy relative rounded-t-[40px] md:rounded-t-[100px] -mt-10 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-[#FAF6F0] rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm border border-[#0E1B3D]/20">
            <Compass className="w-8 h-8 text-[#B89862]" />
          </div>
          <h2 className="font-serif text-3xl md:text-6xl mb-6 md:mb-8 leading-tight text-navy">
            1learn.asia được tạo ra để giúp bạn trả lời những câu hỏi đó.
          </h2>
          <div className="text-xl md:text-2xl font-light text-[#0E1B3D]/70 space-y-4 mb-16">
            <p>Không chỉ đưa cho bạn một bài trắc nghiệm.</p>
            <p>Không chỉ đưa cho bạn một danh sách ngành nghề.</p>
            <p>Không chỉ cho bạn xem thông tin trường đại học.</p>
          </div>
          
          <h3 className="text-lg font-bold tracking-[0.2em] uppercase text-[#B89862] mb-12">1learn kết nối tất cả thành một hành trình:</h3>
          
          <div className="flex flex-col items-center gap-4 text-xl md:text-2xl font-medium text-[#0E1B3D]/80">
            <div>HIỂU MÌNH</div>
            <div className="w-[1px] h-8 bg-[#0E1B3D]/20"></div>
            <div>KHÁM PHÁ NGHỀ NGHIỆP</div>
            <div className="w-[1px] h-8 bg-[#0E1B3D]/20"></div>
            <div>TÌM NGÀNH HỌC PHÙ HỢP</div>
            <div className="w-[1px] h-8 bg-[#0E1B3D]/20"></div>
            <div>KHÁM PHÁ TRƯỜNG ĐẠI HỌC</div>
            <div className="w-[1px] h-8 bg-[#0E1B3D]/20"></div>
            <div>BIẾT MÌNH CÒN THIẾU GÌ</div>
            <div className="w-[1px] h-8 bg-[#0E1B3D]/20"></div>
            <div className="text-navy font-bold">XÂY DỰNG LỘ TRÌNH CHUẨN BỊ</div>
          </div>
        </div>
      </section>

      {/* 4. THE 5 STEPS (SCROLL SECTIONS) */}
      <section className="bg-[#FAF6F0] text-navy py-12 md:py-32">
        
        {/* Step 1 */}
        <div className="max-w-6xl mx-auto px-6 mb-32 md:mb-48 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="text-[#B89862] font-bold tracking-[0.2em] mb-4">01 — HIỂU CHÍNH MÌNH</div>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-navy">Khám phá Bản thân</h2>
            <p className="text-xl font-light text-[#0E1B3D]/70 mb-8 leading-relaxed">
              Bạn không thể chọn một hướng phù hợp nếu chưa hiểu chính mình. 1learn giúp bạn khám phá nhiều khía cạnh quan trọng của bản thân thông qua hệ thống đánh giá hướng nghiệp có cấu trúc.
            </p>
            <ul className="space-y-4">
              <li className="bg-white p-6 rounded-2xl border border-[#0E1B3D]/20 shadow-sm">
                <strong className="block text-navy mb-1 text-lg">Sở thích & Đặc điểm cá nhân</strong>
                <span className="text-[#0E1B3D]/70 text-sm leading-relaxed">Bạn bị thu hút bởi hoạt động nào? Bạn suy nghĩ và tương tác ra sao?</span>
              </li>
              <li className="bg-white p-6 rounded-2xl border border-[#0E1B3D]/20 shadow-sm">
                <strong className="block text-navy mb-1 text-lg">Giá trị nghề nghiệp & Năng lực</strong>
                <span className="text-[#0E1B3D]/70 text-sm leading-relaxed">Điều gì quan trọng với bạn? Điểm mạnh nào là nền tảng cho tương lai?</span>
              </li>
            </ul>
            <p className="mt-8 italic text-[#0E1B3D]/70 border-l-2 border-[#B89862] pl-4">
              Mục tiêu không phải là gắn cho bạn một cái nhãn. Mục tiêu là giúp bạn hiểu mình rõ hơn để có cơ sở khám phá những lựa chọn phù hợp.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-[#B89862] rounded-[40px] rotate-3 opacity-20 blur-lg"></div>
            <div className="bg-white p-8 rounded-[40px] border border-[#0E1B3D]/5 shadow-xl relative aspect-square md:aspect-auto md:h-[600px] flex flex-col items-center justify-center">
              <h3 className="font-serif text-2xl mb-8 text-navy">Hồ sơ RIASEC</h3>
              {/* Fake UI Radar Chart */}
              <div className="w-64 h-64 border border-dashed border-[#0E1B3D]/20 rounded-full relative flex items-center justify-center">
                <div className="absolute w-[80%] h-[80%] border border-dashed border-[#0E1B3D]/10 rounded-full"></div>
                <div className="absolute w-[60%] h-[60%] border border-dashed border-[#0E1B3D]/10 rounded-full"></div>
                <div className="w-[50%] h-[70%] bg-[#B89862]/20 rounded-full border border-[#B89862] rotate-45 transform"></div>
                <div className="absolute top-2 font-bold text-navy text-sm">Nghệ thuật</div>
                <div className="absolute bottom-2 font-bold text-[#0E1B3D]/40 text-sm">Nghiệp vụ</div>
                <div className="absolute left-0 -ml-4 font-bold text-navy text-sm">Nghiên cứu</div>
                <div className="absolute right-0 -mr-4 font-bold text-navy text-sm">Xã hội</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="max-w-6xl mx-auto px-6 mb-24 md:mb-48 flex flex-col md:flex-row-reverse items-center gap-12 md:gap-16">
          <div className="flex-1">
            <div className="text-[#B89862] font-bold tracking-[0.2em] mb-4">02 — KHÁM PHÁ NGHỀ NGHIỆP</div>
            <h2 className="font-serif text-3xl md:text-5xl mb-4 md:mb-6 text-navy">"Mình nên học ngành gì?"</h2>
            <p className="text-xl font-light text-[#0E1B3D]/70 mb-8 leading-relaxed">
              Thay vì bắt đầu bằng hàng trăm ngành học, 1learn bắt đầu từ <strong>con người bạn</strong>. Hệ thống phân tích hồ sơ của bạn và kết nối với dữ liệu nghề nghiệp để giúp bạn khám phá những hướng đáng tìm hiểu.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/50 p-4 rounded-xl border border-[#0E1B3D]/20 text-center font-medium text-navy">Nghề đó làm gì?</div>
              <div className="bg-white/50 p-4 rounded-xl border border-[#0E1B3D]/20 text-center font-medium text-navy">Môi trường làm việc?</div>
              <div className="bg-white/50 p-4 rounded-xl border border-[#0E1B3D]/20 text-center font-medium text-navy">Kỹ năng cần thiết?</div>
              <div className="bg-white/50 p-4 rounded-xl border border-[#0E1B3D]/20 text-center font-medium text-navy">Ngành học dẫn đến?</div>
            </div>
            <p className="text-xl md:text-2xl font-serif text-navy">Bạn không nhận một câu trả lời duy nhất. Bạn nhận được một bản đồ những khả năng đáng khám phá.</p>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-[#0E1B3D] rounded-[40px] -rotate-3 opacity-10 blur-lg"></div>
            <div className="bg-[#FDFCFB] p-8 rounded-[40px] border border-[#0E1B3D]/5 shadow-xl relative aspect-square md:aspect-auto md:h-[600px] flex flex-col gap-6">
              <h3 className="font-serif text-2xl mb-2 text-navy">Độ Phù hợp Nghề nghiệp</h3>
              {/* Fake Career Cards */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-[#0E1B3D]/10 flex-1 flex flex-col justify-center relative overflow-hidden transform hover:-translate-y-1 transition-transform">
                <div className="absolute top-0 right-0 px-4 py-2 font-bold text-[#2E7D32] text-sm md:text-base bg-[#2E7D32]/10 rounded-bl-3xl">98% Match</div>
                <h4 className="font-bold text-xl md:text-2xl text-navy mb-3">Chuyên gia Phân tích Dữ liệu</h4>
                <p className="text-sm md:text-base text-[#0E1B3D]/60 line-clamp-2 md:line-clamp-3 mb-6">Kết hợp hoàn hảo giữa năng lực Tư duy logic của bạn và môi trường làm việc Độc lập.</p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-xs bg-[#FAF6F0] px-3 py-1.5 rounded-full text-navy font-medium">Công nghệ</span>
                  <span className="text-xs bg-[#FAF6F0] px-3 py-1.5 rounded-full text-navy font-medium">Tư duy phân tích</span>
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-[#0E1B3D]/5 h-32 flex flex-col justify-center relative opacity-70 scale-95 origin-top">
                <div className="absolute top-0 right-0 px-4 py-2 font-bold text-[#2E7D32] text-sm bg-[#2E7D32]/10 rounded-bl-3xl">92% Match</div>
                <h4 className="font-bold text-lg text-navy mb-1">Thiết kế Trải nghiệm Người dùng (UX)</h4>
                <p className="text-xs text-[#0E1B3D]/50">Phù hợp với nhóm Nghệ thuật & Xã hội</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="max-w-6xl mx-auto px-6 mb-32 md:mb-48 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="text-[#B89862] font-bold tracking-[0.2em] mb-4">03 — TỪ NGHỀ NGHIỆP ĐẾN NGÀNH HỌC</div>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-navy">Tìm Ngành Học Phù Hợp</h2>
            <p className="text-xl font-light text-[#0E1B3D]/70 mb-8 leading-relaxed">
              Biết nghề mình quan tâm vẫn chưa đủ. Một nghề có thể liên quan đến nhiều ngành học, và ngược lại. 1learn giúp bạn nhìn thấy mối liên hệ: <strong className="text-navy">Bản thân → Nghề nghiệp → Ngành học.</strong>
            </p>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#0E1B3D]/20 text-center md:text-left">
              <p className="text-lg italic text-[#0E1B3D]/70 mb-4">
                Thay vì hỏi: "Ngành nào đang hot?"
              </p>
              <p className="font-serif text-3xl text-navy">
                Bạn có thể bắt đầu hỏi: "Ngành nào phù hợp với mục tiêu và đặc điểm của mình?"
              </p>
            </div>
          </div>
          <div className="flex-1 w-full relative">
             <div className="absolute inset-0 bg-[#B89862] rounded-[40px] rotate-2 opacity-20 blur-lg"></div>
            <div className="bg-white p-8 rounded-[40px] border border-[#0E1B3D]/5 shadow-xl relative md:h-[600px] flex items-center justify-center">
               <div className="text-center space-y-6 w-full max-w-sm">
                 <div className="bg-[#0E1B3D] text-white p-4 rounded-2xl shadow-lg relative z-10 font-medium">Bản thân</div>
                 <div className="w-[2px] h-10 bg-[#0E1B3D]/20 mx-auto"></div>
                 <div className="bg-[#B89862] text-[#0E1B3D] p-4 rounded-2xl shadow-lg relative z-10 font-bold text-lg">Nhà Khoa Học Dữ Liệu (Nghề)</div>
                 <div className="flex justify-between items-start pt-6 relative">
                   <div className="absolute top-0 left-[25%] right-[25%] h-[2px] bg-[#0E1B3D]/20"></div>
                   <div className="absolute top-0 left-[25%] w-[2px] h-10 bg-[#0E1B3D]/20"></div>
                   <div className="absolute top-0 right-[25%] w-[2px] h-10 bg-[#0E1B3D]/20"></div>
                   <div className="w-1/2 pr-2 pt-10">
                     <div className="bg-[#FAF6F0] border border-[#0E1B3D]/10 text-[#0E1B3D] p-4 font-bold rounded-2xl shadow-sm">KH Máy Tính</div>
                   </div>
                   <div className="w-1/2 pl-2 pt-10">
                     <div className="bg-[#FAF6F0] border border-[#0E1B3D]/10 text-[#0E1B3D] p-4 font-bold rounded-2xl shadow-sm">Toán Ứng Dụng</div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="max-w-6xl mx-auto px-6 mb-32 md:mb-48 flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="flex-1">
            <div className="text-[#B89862] font-bold tracking-[0.2em] mb-4">04 — KHÁM PHÁ TRƯỜNG ĐẠI HỌC</div>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-navy">Chọn nơi để học</h2>
            <p className="text-xl font-light text-[#0E1B3D]/70 mb-8 leading-relaxed">
              Chọn ngành rồi, tiếp theo là chọn nơi để học. 1learn giúp kết nối lựa chọn ngành học với các trường đại học để bạn có thể tiếp tục tìm hiểu thông tin tuyển sinh, môi trường và mức độ phù hợp.
            </p>
            <div className="border-l-4 border-[#B89862] pl-6 py-2">
              <p className="text-lg text-[#0E1B3D]/70 mb-2">Không phải "trường nào tốt nhất?"</p>
              <p className="font-serif text-3xl md:text-4xl text-navy">Mà là: "Trường nào phù hợp với mục tiêu của mình?"</p>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="bg-white p-6 md:p-10 rounded-[40px] border border-[#0E1B3D]/20 shadow-xl md:h-[600px] flex flex-col justify-center gap-6 overflow-hidden">
               <h3 className="font-serif text-2xl mb-4 text-navy">Đại học đào tạo CNTT</h3>
               
               <div className="flex gap-6 p-6 border border-[#0E1B3D]/20 rounded-3xl items-center hover:bg-[#FAF6F0] transition-colors shadow-sm bg-white">
                 <div className="w-16 h-16 shrink-0 bg-[#0E1B3D]/5 rounded-2xl flex items-center justify-center text-3xl">🏛️</div>
                 <div>
                   <h4 className="font-bold text-lg text-navy mb-1">Đại học Bách Khoa</h4>
                   <p className="text-sm text-[#0E1B3D]/70">Hệ Đào tạo Kỹ sư • Điểm chuẩn: Rất Cao</p>
                 </div>
               </div>
               
               <div className="flex gap-6 p-6 border border-[#0E1B3D]/20 rounded-3xl items-center hover:bg-[#FAF6F0] transition-colors shadow-sm bg-white">
                 <div className="w-16 h-16 shrink-0 bg-[#0E1B3D]/5 rounded-2xl flex items-center justify-center text-3xl">🎓</div>
                 <div>
                   <h4 className="font-bold text-lg text-navy mb-1">Đại học Khoa học Tự nhiên</h4>
                   <p className="text-sm text-[#0E1B3D]/70">Cử nhân KH Máy tính • Môi trường học thuật</p>
                 </div>
               </div>
               
               <div className="flex gap-6 p-6 border border-[#0E1B3D]/20 rounded-3xl items-center hover:bg-[#FAF6F0] transition-colors shadow-sm bg-white">
                 <div className="w-16 h-16 shrink-0 bg-[#0E1B3D]/5 rounded-2xl flex items-center justify-center text-3xl">🌐</div>
                 <div>
                   <h4 className="font-bold text-lg text-navy mb-1">Đại học FPT</h4>
                   <p className="text-sm text-[#0E1B3D]/70">Kỹ sư Phần mềm • Môi trường Quốc tế</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="text-[#B89862] font-bold tracking-[0.2em] mb-4">05 — BIẾN MỤC TIÊU THÀNH LỘ TRÌNH</div>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-navy">Xây dựng lộ trình cá nhân</h2>
            <p className="text-xl font-light text-[#0E1B3D]/70 mb-8 leading-relaxed">
              Đây là nơi 1learn khác biệt. Biết mình muốn đi đâu chưa đủ. Bạn còn cần biết: <strong>Hiện tại mình đang ở đâu? Mình còn thiếu gì để đến được đó?</strong>
            </p>
            <p className="text-[#0E1B3D]/70 mb-8">1learn giúp bạn nhìn thấy khoảng cách giữa mục tiêu và thực trạng hiện tại, từ đó xây dựng lộ trình với những việc cụ thể:</p>
            <ul className="grid grid-cols-2 gap-4">
              <li className="bg-white p-5 rounded-2xl shadow-sm border border-[#0E1B3D]/20 text-center font-medium text-navy">📚 Học tập</li>
              <li className="bg-white p-5 rounded-2xl shadow-sm border border-[#0E1B3D]/20 text-center font-medium text-navy">🧠 Kỹ năng</li>
              <li className="bg-white p-5 rounded-2xl shadow-sm border border-[#0E1B3D]/20 text-center font-medium text-navy">🏆 Hoạt động</li>
              <li className="bg-white p-5 rounded-2xl shadow-sm border border-[#0E1B3D]/20 text-center font-medium text-navy">📅 Cột mốc</li>
            </ul>
          </div>
          <div className="flex-1 w-full relative">
            <div className="bg-[#0E1B3D] text-white p-8 md:p-12 rounded-[40px] shadow-2xl md:h-[600px] flex flex-col">
              <h3 className="font-serif text-3xl mb-12 text-white">Lộ trình của bạn</h3>
              
              <div className="flex-1 relative mt-8 md:mt-0">
                <div className="absolute left-6 top-4 bottom-8 w-1 bg-white/10 rounded-full"></div>
                
                <div className="relative pl-16 mb-10">
                  <div className="absolute left-4 top-1 w-5 h-5 bg-[#B89862] rounded-full border-4 border-[#0E1B3D] shadow-[0_0_0_2px_#B89862]"></div>
                  <div className="text-sm text-[#B89862] font-bold tracking-widest uppercase mb-1">Tháng 9 - Lớp 11</div>
                  <div className="font-bold text-xl mb-2">Cải thiện điểm Toán</div>
                  <div className="text-white/70 text-sm p-4 bg-white/5 rounded-xl border border-white/5">Mục tiêu: Đạt 8.5 để đủ điều kiện xét tuyển học bạ ĐH Bách Khoa.</div>
                </div>

                <div className="relative pl-16 mb-10 opacity-70">
                  <div className="absolute left-[1.125rem] top-1 w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="text-sm text-white/50 mb-1">Tháng 12 - Lớp 11</div>
                  <div className="font-bold text-lg mb-2">Thi lấy chứng chỉ IELTS</div>
                </div>

                <div className="relative pl-16 opacity-40">
                  <div className="absolute left-[1.125rem] top-1 w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="text-sm text-white/50 mb-1">Mùa hè - Lớp 11</div>
                  <div className="font-bold text-lg mb-2">Tham gia Trại hè Công nghệ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 5. THE CORE MESSAGE */}
      <section className="py-24 md:py-40 px-6 bg-[#B89862] text-[#0E1B3D] text-center relative overflow-hidden">
        {/* Abstract subtle shapes */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/30 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-black/5 rounded-full blur-[100px]"></div>

        <div className="container mx-auto max-w-5xl relative z-10 px-4">
          <p className="text-lg md:text-2xl font-medium mb-6 uppercase tracking-[0.3em]">Không chỉ "Bạn hợp với nghề gì?"</p>
          <p className="text-lg md:text-2xl font-medium mb-12 uppercase tracking-[0.3em]">Mà là:</p>
          <h2 className="font-serif text-4xl md:text-7xl lg:text-[5.5rem] leading-[1.1] mb-10 md:mb-16 text-[#0E1B3D]">
            "Vậy bây giờ bạn<br/> nên làm gì?"
          </h2>
          <div className="w-24 h-[1px] bg-[#0E1B3D]/30 mx-auto mb-16"></div>
          <p className="text-xl md:text-3xl font-normal max-w-3xl mx-auto leading-relaxed">
            Một bài trắc nghiệm có thể cho bạn một kết quả.<br/>
            Một website có thể cho bạn thông tin.<br/><br/>
            Nhưng một hành trình hướng nghiệp tốt phải giúp bạn <strong>biến sự hiểu biết thành hành động.</strong>
          </p>
        </div>
      </section>

      {/* 6. FOR PARENTS */}
      <section className="py-20 md:py-32 px-6 bg-white text-navy relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-[#FAF6F0] rounded-[60px] rotate-3 opacity-100 transition-transform hover:rotate-1 duration-500"></div>
              <Image 
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80" 
                alt="Phụ huynh và con" 
                fill
                className="relative z-10 rounded-[40px] md:rounded-[60px] shadow-2xl object-cover h-[400px] md:h-[500px] lg:h-[600px] w-full"
              />
              <div className="absolute -bottom-10 -right-5 md:-right-10 bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(14,27,61,0.1)] z-20 max-w-xs border border-[#0E1B3D]/20">
                <Logo className="text-3xl mb-3 block" />
                <p className="text-[#0E1B3D]/70 text-sm leading-relaxed">Cung cấp dữ liệu để phụ huynh thấu hiểu, không quyết định thay gia đình.</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex border border-[#0E1B3D]/20 rounded-full px-5 py-2 text-xs font-bold tracking-[0.2em] uppercase text-[#0E1B3D]/70 mb-8 bg-[#FAF6F0]">
                Dành cho Phụ huynh
              </div>
              <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl mb-6 md:mb-8 leading-tight">
                Đồng hành cùng con,<br/> không chọn thay con.
              </h2>
              <div className="space-y-6 text-lg md:text-xl font-light text-[#0E1B3D]/70 leading-relaxed mb-12">
                <p>Làm cha mẹ, ai cũng muốn con có một tương lai tốt. Nhưng giữa <em>"Bố mẹ nghĩ con nên học ngành này"</em> và <em>"Con muốn học gì?"</em> đôi khi là một khoảng cách rất lớn.</p>
                <p>Thay vì chỉ hỏi "Hôm nay con học gì?", bạn có thể nhìn thấy hành trình của con và cùng thảo luận:</p>
                <ul className="space-y-4 mt-6 border-l-2 border-[#B89862] pl-6 py-2">
                  <li className="font-medium text-navy">"Con đang quan tâm đến những nghề nào?"</li>
                  <li className="font-medium text-navy">"Vì sao con thấy mình phù hợp với hướng đó?"</li>
                  <li className="font-medium text-navy">"Bố mẹ có thể hỗ trợ con điều gì?"</li>
                </ul>
              </div>
              <p className="font-serif text-3xl md:text-4xl text-navy">
                Từ "chọn thay con"<br/>
                sang <span className="text-[#B89862] italic">"cùng con lựa chọn."</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PHILOSOPHY & FINAL CTA */}
      <section className="py-20 md:py-32 px-6 bg-[#0E1B3D] text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B89862] blur-[200px] rounded-full opacity-20 -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#B89862] blur-[200px] rounded-full opacity-10 -ml-40 -mb-40"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="font-serif text-3xl md:text-5xl lg:text-7xl mb-12 md:mb-16 leading-tight text-white">
            Một quyết định tốt không bắt đầu từ việc chọn ngành.<br/>
            Nó bắt đầu từ việc hiểu chính mình.
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-[40px] md:rounded-[60px] p-6 md:p-20 mb-24 backdrop-blur-md shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0E1B3D] border border-white/10 px-8 py-3 rounded-full text-[#B89862] font-bold tracking-[0.2em] uppercase text-sm">
              Tôn chỉ của 1learn
            </div>
            <p className="text-2xl md:text-4xl font-serif text-center mb-8 md:mb-10 leading-tight">
              Không có một bài test nào có thể quyết định tương lai của một con người.
            </p>
            <p className="text-lg md:text-xl text-white/70 text-center font-light leading-relaxed max-w-3xl mx-auto">
              Kết quả đánh giá chỉ là một nguồn thông tin để tham khảo. Lựa chọn cuối cùng vẫn là của bạn. 1learn không chọn tương lai thay bạn, 1learn giúp bạn có cơ sở tốt hơn để tự lựa chọn.
            </p>
          </div>

          <div className="space-y-12 max-w-4xl mx-auto">
            <h2 className="font-serif text-4xl md:text-6xl text-[#B89862]">Sẵn sàng khám phá?</h2>
            <p className="text-xl md:text-2xl font-light text-white/70 leading-relaxed">
              Bạn không cần phải biết chính xác mình sẽ trở thành ai ở tuổi 15 hay 16. Hãy bắt đầu bằng một câu hỏi đơn giản:<br/> <strong className="text-white text-3xl font-serif mt-6 inline-block">"Mình thực sự phù hợp với điều gì?"</strong>
            </p>
            
            <div className="pt-12">
              <Link href="/register" className="inline-flex px-12 py-6 rounded-full text-lg md:text-xl font-bold bg-[#B89862] text-[#0E1B3D] hover:bg-[#A38555] hover:text-white transition-all items-center justify-center gap-3 shadow-[0_0_50px_rgba(184,152,98,0.5)] hover:scale-105 duration-300">
                BẮT ĐẦU KHÁM PHÁ MIỄN PHÍ <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
