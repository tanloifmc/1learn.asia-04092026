"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Chưa đăng nhập" };
  }

  const grade = formData.get("grade");
  const gender = formData.get("gender");
  const region = formData.get("region");
  const redirectTo = formData.get("redirectTo")?.toString() || "/dashboard";

  const { error } = await supabase
    .from("student_profiles")
    .upsert({
      id: user.id,
      grade: grade ? parseInt(grade.toString()) : null,
      gender: gender ? gender.toString() : null,
      region: region ? region.toString() : null,
      onboarding_step: 4,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Onboarding error:", error);
    return { success: false, error: "Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại." };
  }

  revalidatePath("/", "layout");
  redirect(redirectTo);
}
