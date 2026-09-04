import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return <AuthCard title="Quên mật khẩu" description="Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu."><ForgotPasswordForm /></AuthCard>;
}
