import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { BarChart3, Users, FileText, CheckCircle2, Target, Rocket } from "lucide-react";

export const metadata = {
  title: "Analytics Dashboard | Admin",
};

export default async function AnalyticsDashboardPage() {
  const account = await getCurrentAccount();
  if (!account || !account.roles.includes("super_admin")) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_name, user_id, id");

  // Expanded Funnel
  const funnel = {
    REGISTER: new Set<string>(),
    ONBOARDING_COMPLETED: new Set<string>(),
    ASSESSMENT_COMPLETED: new Set<string>(),
    CAREER_EXPLORED: new Set<string>(),
    ROADMAP_GENERATED: new Set<string>(),
    FIRST_TASK_COMPLETED: new Set<string>(),
  };

  const totals = {
    PAGE_VIEW: 0,
    STUDENTS: new Set<string>(),
  };

  events?.forEach(e => {
    if (e.event_name === 'PAGE_VIEW') totals.PAGE_VIEW++;
    
    if (e.user_id) totals.STUDENTS.add(e.user_id);
    
    if (e.event_name in funnel && e.user_id) {
      funnel[e.event_name as keyof typeof funnel].add(e.user_id);
    }
  });

  const funnelCounts = {
    REGISTER: funnel.REGISTER.size,
    ONBOARDING_COMPLETED: funnel.ONBOARDING_COMPLETED.size,
    ASSESSMENT_COMPLETED: funnel.ASSESSMENT_COMPLETED.size,
    CAREER_EXPLORED: funnel.CAREER_EXPLORED.size,
    ROADMAP_GENERATED: funnel.ROADMAP_GENERATED.size,
    FIRST_TASK_COMPLETED: funnel.FIRST_TASK_COMPLETED.size,
  };

  // North Star Metric: % học sinh có assessment_completed + career_explored + roadmap_generated + first_task_completed
  // Để đơn giản, ta coi tập hợp user ở bước cuối (FIRST_TASK_COMPLETED) chính là NSM Candidate 
  // (nếu funnel tuyến tính. Tuy nhiên user có thể skip, nhưng ta sẽ giao nhau các tập)
  
  let nsmUsers = new Set(
    [...funnel.FIRST_TASK_COMPLETED].filter(x => 
      funnel.ASSESSMENT_COMPLETED.has(x) &&
      funnel.CAREER_EXPLORED.has(x) &&
      funnel.ROADMAP_GENERATED.has(x)
    )
  );

  const nsmCount = nsmUsers.size;
  const totalStudents = totals.STUDENTS.size;
  const nsmPercentage = totalStudents > 0 ? Math.round((nsmCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Đo lường mức độ chuyển đổi và giá trị thực sự mang lại cho học sinh.
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow">
        <h2 className="text-lg font-medium opacity-90 mb-2">North Star Metric (NSM)</h2>
        <div className="flex items-end gap-4">
          <span className="text-4xl font-bold">{nsmPercentage}%</span>
          <span className="mb-1 opacity-80">
            học sinh đạt được mục tiêu ({nsmCount}/{totalStudents})
          </span>
        </div>
        <p className="mt-2 text-sm opacity-80 max-w-2xl">
          Tỷ lệ học sinh chuyển từ "chưa rõ hướng" sang "hành động". (Hoàn thành Assessment + Tìm hiểu Nghề nghiệp + Tạo Roadmap + Hoàn thành Task đầu tiên).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Tổng lượt truy cập" 
          value={totals.PAGE_VIEW} 
          icon={<FileText className="h-4 w-4 text-muted-foreground" />} 
        />
        <MetricCard 
          title="Học sinh Đăng ký" 
          value={funnelCounts.REGISTER} 
          icon={<Users className="h-4 w-4 text-muted-foreground" />} 
        />
        <MetricCard 
          title="Làm bài Assessment" 
          value={funnelCounts.ASSESSMENT_COMPLETED} 
          icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />} 
        />
        <MetricCard 
          title="Bắt đầu hành động" 
          value={funnelCounts.FIRST_TASK_COMPLETED} 
          icon={<Rocket className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl border">
        <h2 className="text-lg font-semibold mb-4">Product Funnel (Unique Users)</h2>
        <div className="space-y-4">
          <FunnelStep name="Đăng ký tài khoản (REGISTER)" count={funnelCounts.REGISTER} max={funnelCounts.REGISTER || 1} />
          <FunnelStep name="Hoàn thành Onboarding" count={funnelCounts.ONBOARDING_COMPLETED} max={funnelCounts.REGISTER || 1} />
          <FunnelStep name="Hoàn thành Assessment" count={funnelCounts.ASSESSMENT_COMPLETED} max={funnelCounts.REGISTER || 1} />
          <FunnelStep name="Tìm hiểu Nghề nghiệp" count={funnelCounts.CAREER_EXPLORED} max={funnelCounts.REGISTER || 1} />
          <FunnelStep name="Tạo Roadmap" count={funnelCounts.ROADMAP_GENERATED} max={funnelCounts.REGISTER || 1} />
          <FunnelStep name="Hoàn thành Task đầu tiên" count={funnelCounts.FIRST_TASK_COMPLETED} max={funnelCounts.REGISTER || 1} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function FunnelStep({ name, count, max }: { name: string, count: number, max: number }) {
  const percentage = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{name}</span>
        <span className="font-semibold">{count} ({percentage}%)</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4">
        <div 
          className="bg-blue-500 h-4 rounded-full transition-all" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
