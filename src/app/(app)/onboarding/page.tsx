import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Compass } from "lucide-react";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("student_profiles")
    .select("onboarding_step, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const currentStep = profile?.onboarding_step || 1;

  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col justify-center items-center p-4 py-12 md:py-24">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0E1B3D]/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#B89862]/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
      
      <div className="w-full max-w-3xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#0E1B3D] text-[#B89862] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#0E1B3D]/20">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-[#0E1B3D] mb-4">Hành trình của bạn bắt đầu</h1>
          <p className="text-[#0E1B3D]/60 text-lg max-w-xl mx-auto">
            Hãy cho chúng tôi biết một chút về bản thân để 1learn.asia có thể cá nhân hóa lộ trình và gợi ý phù hợp nhất dành riêng cho bạn.
          </p>
        </div>

        <OnboardingWizard initialStep={currentStep} />
      </div>
    </div>
  );
}
