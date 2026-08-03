import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <AuthCard title="Tao tai khoan" description="Bat dau voi tai khoan ca nhan cua ban."><RegisterForm /></AuthCard>;
}
