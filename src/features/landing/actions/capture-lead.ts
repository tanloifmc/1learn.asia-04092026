"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { randomUUID } from "node:crypto";

const captureLeadSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().optional(),
  source: z.string().default("landing_hero"),
});

export async function captureLeadAction(formData: FormData) {
  try {
    const rawData = {
      email: formData.get("email")?.toString() || "",
      fullName: formData.get("fullName")?.toString() || "",
      source: formData.get("source")?.toString() || "landing_hero",
    };

    const parsed = captureLeadSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Lỗi định dạng" };
    }

    const { email, fullName, source } = parsed.data;
    const supabase = await createClient();

    const { error: dbError } = await supabase.from("leads").insert({
      email,
      full_name: fullName,
      source,
    });

    if (dbError) {
      if (dbError.code === "23505") { // unique_violation
        return { success: true, message: "Bạn đã đăng ký trước đó. Cảm ơn bạn!" };
      }
      console.error("Failed to capture lead:", dbError);
      return { success: false, error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." };
    }

    // Gửi email xác nhận
    await sendTransactionalEmail({
      to: email,
      subject: "Chào mừng bạn đến với 1learn.asia - Hành trình hướng nghiệp bắt đầu!",
      html: `<p>Chào ${fullName ? fullName : 'bạn'},</p><p>Cảm ơn bạn đã đăng ký nhận thông tin sớm từ 1learn.asia.</p><p>Chúng tôi sẽ cập nhật những tính năng mới nhất đến bạn trong thời gian sớm nhất!</p><p>Trân trọng,<br>Đội ngũ 1learn.asia</p>`,
      text: `Chào ${fullName ? fullName : 'bạn'},\n\nCảm ơn bạn đã đăng ký nhận thông tin sớm từ 1learn.asia.\n\nChúng tôi sẽ cập nhật những tính năng mới nhất đến bạn trong thời gian sớm nhất!\n\nTrân trọng,\nĐội ngũ 1learn.asia`,
      idempotencyKey: `lead-welcome-${email}-${randomUUID()}`
    }).catch(e => console.error("Welcome email failed, but lead captured:", e));

    return { success: true, message: "Đăng ký thành công! Vui lòng kiểm tra email của bạn." };
  } catch (error) {
    console.error("Capture lead error:", error);
    return { success: false, error: "Lỗi hệ thống." };
  }
}
