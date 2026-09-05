"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  saveOnboardingStep1Action, 
  saveOnboardingStep2Action, 
  saveOnboardingStep3Action, 
  saveOnboardingStep4Action 
} from "@/features/student/actions/onboarding";
import { ArrowRight, Check, MapPin, GraduationCap, Brain, Home, Globe2, Loader2, Calendar } from "lucide-react";

const TOTAL_STEPS = 4;

export function OnboardingWizard({ initialStep = 1 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await saveOnboardingStep1Action(formData);
    if (res.success) { setStep(2); scrollToTop(); }
    else setError(res.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    setLoading(false);
  }

  async function handleStep2(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await saveOnboardingStep2Action(formData);
    if (res.success) { setStep(3); scrollToTop(); }
    else setError(res.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    setLoading(false);
  }

  async function handleStep3(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await saveOnboardingStep3Action(formData);
    if (res.success) { setStep(4); scrollToTop(); }
    else setError(res.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    setLoading(false);
  }

  async function handleStep4(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await saveOnboardingStep4Action(formData);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(14,27,61,0.05)] border border-[#0E1B3D]/10 overflow-hidden relative">
      
      {/* Progress Bar */}
      <div className="h-2 bg-[#0E1B3D]/5 w-full absolute top-0 left-0">
        <div 
          className="h-full bg-gradient-to-r from-[#0E1B3D] to-[#B89862] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-8 md:p-12">
        <div className="mb-10 text-center">
          <span className="inline-block px-3 py-1 bg-[#B89862]/10 text-[#B89862] font-bold text-xs uppercase tracking-widest rounded-full mb-3">
            Bước {step} / {TOTAL_STEPS}
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-[#0E1B3D]">
            {step === 1 && "Thông tin cơ bản"}
            {step === 2 && "Học vấn hiện tại"}
            {step === 3 && "Sở thích cá nhân"}
            {step === 4 && "Dự định tương lai"}
          </h2>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 px-5 py-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Họ và tên đầy đủ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-[#0E1B3D]/40 font-bold">@</span>
                  </div>
                  <input 
                    name="display_name" 
                    type="text" 
                    placeholder="VD: Nguyễn Văn A"
                    required 
                    className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 pl-12 pr-4 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Năm sinh</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-[#0E1B3D]/40" />
                    </div>
                    <input 
                      name="birth_year" 
                      type="number" 
                      min="1990" 
                      max="2020" 
                      placeholder="VD: 2008"
                      required 
                      className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 pl-12 pr-4 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Khối lớp (9-12)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <GraduationCap className="h-5 w-5 text-[#0E1B3D]/40" />
                    </div>
                    <input 
                      name="grade" 
                      type="number" 
                      min="9" 
                      max="12" 
                      placeholder="VD: 10"
                      required 
                      className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 pl-12 pr-4 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Tỉnh / Thành phố</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-[#0E1B3D]/40" />
                  </div>
                  <input 
                    name="region" 
                    type="text" 
                    placeholder="VD: Hà Nội, TP.HCM..."
                    required 
                    className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 pl-12 pr-4 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[#B89862]/10 to-[#E5CFA3]/10 border border-[#B89862]/30 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center md:items-start shadow-sm">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md border border-[#B89862]/20">
                <span className="text-2xl">📸</span>
              </div>
              <div className="text-center md:text-left">
                <h4 className="font-bold text-[#0E1B3D] mb-1">Mẹo để Báo cáo đẹp hơn!</h4>
                <p className="text-sm text-[#0E1B3D]/70 leading-relaxed">
                  Khai báo họ tên đầy đủ sẽ giúp Báo cáo trông chuyên nghiệp hơn. Sau khi hoàn tất khảo sát, đừng quên vào phần <strong>Hồ sơ</strong> để tải lên ảnh đại diện cá nhân nhé! Một tấm ảnh đẹp sẽ làm Báo cáo của bạn nổi bật hơn rất nhiều.
                </p>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tiếp tục"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Môn học thế mạnh <span className="text-[#0E1B3D]/40 font-normal normal-case">(tùy chọn)</span></label>
                <input 
                  name="strong_subjects" 
                  type="text" 
                  placeholder="VD: Toán, Lý, Tiếng Anh (cách nhau bằng dấu phẩy)"
                  className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 px-6 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-2 uppercase tracking-wider">Môn học cần cải thiện <span className="text-[#0E1B3D]/40 font-normal normal-case">(tùy chọn)</span></label>
                <input 
                  name="weak_subjects" 
                  type="text" 
                  placeholder="VD: Hóa học, Ngữ Văn"
                  className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 px-6 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-3 uppercase tracking-wider">Học lực hiện tại</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "excellent", label: "Giỏi (Excellent)" },
                    { val: "good", label: "Khá (Good)" },
                    { val: "average", label: "Trung bình (Average)" },
                    { val: "below_average", label: "Yếu (Below)" }
                  ].map((opt) => (
                    <label key={opt.val} className="relative cursor-pointer">
                      <input type="radio" name="gpa_range" value={opt.val} defaultChecked={opt.val === "good"} className="peer sr-only" />
                      <div className="p-4 rounded-2xl border-2 border-[#0E1B3D]/5 bg-[#0E1B3D]/5 peer-checked:border-[#B89862] peer-checked:bg-[#B89862]/10 text-center transition-all text-[#0E1B3D] font-medium">
                        {opt.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tiếp tục"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-[#B89862]" />
                <h3 className="font-bold text-[#0E1B3D] uppercase tracking-wider">Bạn đam mê điều gì?</h3>
              </div>
              <p className="text-[#0E1B3D]/60 text-sm mb-6">Hãy liệt kê các lĩnh vực, hoạt động hoặc chủ đề mà bạn thực sự yêu thích. Có thể bỏ trống nếu chưa chắc.</p>
              
              <input 
                name="interest_areas" 
                id="interest_areas_input"
                type="text" 
                placeholder="VD: Trí tuệ nhân tạo, Thiết kế đồ họa, Đọc sách, Thể thao..." 
                className="w-full bg-[#0E1B3D]/5 border-none rounded-2xl py-4 px-6 text-[#0E1B3D] font-medium focus:ring-2 focus:ring-[#B89862]/50 transition-shadow outline-none" 
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              id="step3_submit_btn"
              disabled={loading} 
              className="w-full flex items-center justify-center gap-2 py-4 bg-[#0E1B3D] text-white font-bold rounded-full hover:bg-[#B89862] hover:text-[#0E1B3D] transition-all shadow-md group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tiếp tục"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        )}

        {step === 4 && (
          <form onSubmit={handleStep4} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-[#0E1B3D] mb-3 uppercase tracking-wider">Môi trường học tập mơ ước</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { val: "near", label: "Gần nhà", icon: Home },
                    { val: "far", label: "Xa nhà (Trong nước)", icon: MapPin },
                    { val: "abroad", label: "Du học", icon: Globe2 }
                  ].map((opt) => (
                    <label key={opt.val} className="relative cursor-pointer h-full">
                      <input type="radio" name="study_location_pref" value={opt.val} defaultChecked={opt.val === "near"} className="peer sr-only" />
                      <div className="p-4 rounded-2xl border-2 border-[#0E1B3D]/5 bg-[#0E1B3D]/5 peer-checked:border-[#B89862] peer-checked:bg-[#B89862]/10 flex flex-col items-center justify-center gap-2 transition-all text-[#0E1B3D] font-medium h-full">
                        <opt.icon className={`w-6 h-6 ${opt.val === 'near' ? 'text-blue-500' : opt.val === 'far' ? 'text-orange-500' : 'text-emerald-500'}`} />
                        <span className="text-center">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-[#0E1B3D] uppercase tracking-wider">Mức độ hỗ trợ từ gia đình</label>
                </div>
                <p className="text-xs text-[#0E1B3D]/50 mb-4">Đánh giá từ 1 (Tự lập hoàn toàn) đến 5 (Được hỗ trợ tối đa về tài chính & định hướng)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <label key={num} className="relative cursor-pointer flex-1">
                      <input type="radio" name="family_support_level" value={num} defaultChecked={num === 3} className="peer sr-only" required />
                      <div className="py-3 rounded-xl border-2 border-[#0E1B3D]/5 bg-[#0E1B3D]/5 peer-checked:border-[#0E1B3D] peer-checked:bg-[#0E1B3D] peer-checked:text-[#B89862] text-center transition-all text-[#0E1B3D] font-bold text-lg">
                        {num}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-[#B89862] text-[#0E1B3D] font-bold rounded-full hover:bg-[#0E1B3D] hover:text-[#B89862] transition-all shadow-md group">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Hoàn thành & Bắt đầu"}
              {!loading && <Check className="w-5 h-5" />}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
