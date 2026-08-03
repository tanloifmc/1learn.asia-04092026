import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthCard title="Dang nhap" description="Truy cap khu vuc tai khoan cua ban."><LoginForm /></AuthCard>;
}
