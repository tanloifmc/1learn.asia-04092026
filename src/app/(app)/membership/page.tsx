import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";

export default async function MembershipPage() {
  const account = await getCurrentAccount();
  let isPremium = false;
  let premiumEndDate = null;

  if (account) {
    const supabase = await createClient();
    const today = new Date().toISOString();
    const { data: subscription } = await supabase
      .from("membership_subscriptions")
      .select("ends_at")
      .eq("user_id", account.userId)
      .eq("is_active", true)
      .gte("ends_at", today)
      .limit(1)
      .maybeSingle();

    if (subscription) {
      isPremium = true;
      premiumEndDate = new Date(subscription.ends_at).toLocaleDateString("vi-VN");
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 bg-[#B89862]/10 text-[#B89862] font-bold text-xs uppercase tracking-widest rounded-full mb-4">
          Gói Thành Viên
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-[#0E1B3D] mb-4">Mở khóa tiềm năng của bạn</h1>
        <p className="text-[#0E1B3D]/70 text-lg">
          Chúng tôi đang hoàn thiện các gói thành viên đặc quyền nhằm mang đến trải nghiệm định hướng nghề nghiệp sâu sắc và cá nhân hóa nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-[32px] p-8 md:p-10 border border-[#0E1B3D]/5 shadow-sm">
          <div className="mb-8">
            <h2 className="font-serif text-2xl text-[#0E1B3D] mb-2">Gói Khám Phá</h2>
            {!isPremium && <p className="text-[#0E1B3D]/60 mb-6">Đang sử dụng</p>}
            {isPremium && <p className="text-[#0E1B3D]/60 mb-6">Gói cơ bản</p>}
            <div className="text-4xl font-bold text-[#0E1B3D]">Miễn phí</div>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
              <span className="text-[#0E1B3D]/80">Làm bài kiểm tra đánh giá năng lực cơ bản</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
              <span className="text-[#0E1B3D]/80">Xem báo cáo tóm tắt RIASEC</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
              <span className="text-[#0E1B3D]/80">Tra cứu thư viện ngành nghề và trường đại học</span>
            </li>
          </ul>

          {!isPremium ? (
            <button disabled className="w-full py-4 bg-[#0E1B3D]/5 text-[#0E1B3D]/40 font-bold rounded-full cursor-not-allowed">
              Đang sử dụng
            </button>
          ) : (
            <button disabled className="w-full py-4 bg-[#0E1B3D]/5 text-[#0E1B3D]/40 font-bold rounded-full cursor-not-allowed">
              Đã bao gồm trong Premium
            </button>
          )}
        </div>

        {/* Premium Plan */}
        <div className="bg-[#0E1B3D] text-white rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#B89862]/20 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="font-serif text-2xl mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#B89862]" /> Premium
                </h2>
                {isPremium ? (
                  <p className="text-white/60 mb-6">Đang sử dụng (Hết hạn: {premiumEndDate})</p>
                ) : (
                  <p className="text-white/60 mb-6">Truy cập toàn bộ tính năng</p>
                )}
                <div className="text-4xl font-bold text-[#B89862]">149.000<span className="text-xl text-white/50 font-normal">đ / năm</span></div>
              </div>
              <span className="bg-[#B89862] text-[#0E1B3D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {isPremium ? "KÍCH HOẠT" : "Khuyên dùng"}
              </span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
                <span className="text-white/80">Tất cả quyền lợi của Gói Khám Phá</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
                <span className="text-white/80">Báo cáo phân tích chuyên sâu (Bento Board đa chiều)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
                <span className="text-white/80">Sử dụng thuật toán AI Matching thế hệ mới</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
                <span className="text-white/80">Xây dựng lộ trình (Roadmap) cá nhân hóa</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#B89862] shrink-0 mt-0.5" />
                <span className="text-white/80">Kết nối phụ huynh để theo dõi tiến độ</span>
              </li>
            </ul>

            {isPremium ? (
              <Link href="/me/bao-cao/premium" className="w-full flex items-center justify-center gap-2 py-4 bg-white text-[#0E1B3D] font-bold rounded-full hover:bg-gray-100 transition-colors">
                Xem Báo Cáo Premium <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link href="/membership/checkout" className="w-full flex items-center justify-center gap-2 py-4 bg-[#B89862] text-[#0E1B3D] font-bold rounded-full hover:bg-white transition-colors">
                Thanh toán chuyển khoản <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
