"use server";

import { createClient } from "@/lib/supabase/server";

// Using the service role key to bypass email confirmation
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function registerWithAutoConfirm(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập email và mật khẩu" };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, error: "Lỗi hệ thống: Thiếu khóa bảo mật." };
  }

  // 1. Create user with auto-confirm using admin client
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    // Return friendly error if user exists
    if (createError.message.includes("already registered")) {
      return { success: false, error: "Email này đã được đăng ký. Vui lòng đăng nhập." };
    }
    return { success: false, error: createError.message };
  }

  // 1.5 Assign default student role
  if (userData?.user?.id) {
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: "student" })
      .select()
      .single();
  }

  // 2. Sign in the user so they get the session cookie using the normal client
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { success: false, error: "Đăng ký thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập thủ công." };
  }

  return { success: true };
}
