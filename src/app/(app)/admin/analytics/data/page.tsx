import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { AlertCircle, Database, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Data Quality | Admin",
};

export default async function DataQualityPage() {
  const account = await getCurrentAccount();
  if (!account || !account.roles.includes("super_admin")) {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch counts from master data
  const [
    { count: totalCareers }, { count: unverifiedCareers },
    { count: totalMajors }, { count: unverifiedMajors },
    { count: totalUnis }, { count: unverifiedUnis }
  ] = await Promise.all([
    supabase.from("careers").select("*", { count: 'exact', head: true }),
    supabase.from("careers").select("*", { count: 'exact', head: true }).neq("verification_status", "verified"),
    supabase.from("majors").select("*", { count: 'exact', head: true }),
    supabase.from("majors").select("*", { count: 'exact', head: true }).neq("verification_status", "verified"),
    supabase.from("universities").select("*", { count: 'exact', head: true }),
    supabase.from("universities").select("*", { count: 'exact', head: true }).neq("verification_status", "verified"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Quality & Verification</h1>
        <p className="text-muted-foreground">
          Quản lý và kiểm duyệt chất lượng dữ liệu cốt lõi (Nghề nghiệp, Ngành học, Trường ĐH).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <DataCard 
          title="Nghề nghiệp (Careers)"
          total={totalCareers || 0}
          unverified={unverifiedCareers || 0}
          href="/admin/careers"
        />
        <DataCard 
          title="Ngành học (Majors)"
          total={totalMajors || 0}
          unverified={unverifiedMajors || 0}
          href="/admin/majors"
        />
        <DataCard 
          title="Trường ĐH (Universities)"
          total={totalUnis || 0}
          unverified={unverifiedUnis || 0}
          href="/admin/universities"
        />
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900">Quy trình kiểm duyệt (Verification)</h3>
          <p className="text-sm text-blue-800 mt-1">
            Dữ liệu có verification_status khác "verified" sẽ cần được ưu tiên kiểm duyệt (Fix Data). Các chuyên gia hướng nghiệp cần rà soát lại thông tin trước khi đánh dấu là đã xác minh.
          </p>
        </div>
      </div>
    </div>
  );
}

function DataCard({ title, total, unverified, href }: { title: string, total: number, unverified: number, href: string }) {
  const verified = total - unverified;
  const percentage = total > 0 ? Math.round((verified / total) * 100) : 0;

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-muted-foreground">Tổng số record</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Đã kiểm duyệt</p>
            <p className="text-lg font-semibold text-green-600">{percentage}%</p>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" /> {verified}
          </span>
          <span className="flex items-center gap-1 text-orange-500">
            <Clock className="h-4 w-4" /> {unverified} chờ duyệt
          </span>
        </div>

        <Link href={href} className="block w-full text-center py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors">
          Quản lý dữ liệu
        </Link>
      </div>
    </div>
  );
}
