import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <AuthCard title="Tạo tài khoản" description="Bắt đầu với tài khoản cá nhân của bạn."><RegisterForm /></AuthCard>;
}
