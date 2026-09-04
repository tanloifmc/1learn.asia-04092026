import { createClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/features/account/current-account";
import { redirect } from "next/navigation";
import { getJourneyProgress } from "@/features/metrics/journey-progress";
import Link from "next/link";
import { Surface, ElevatedCard } from "@/components/ui/cards";
import { ProgressBar } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status";
import { TaskCheckbox } from "./components/task-checkbox";

export default async function JourneyPage() {
  const account = await getCurrentAccount();
  const user = account ? { id: account.userId } : null;
  if (!user) redirect("/login");

  const supabase = await createClient();

  // 1. Fetch Journey Progress metric
  const journey = await getJourneyProgress(user.id);

  if (!journey) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="border border-dashed border-neutral-300 p-6 md:p-12 text-center bg-white rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Hành trình chưa bắt đầu</h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">Em cần chọn một mục tiêu chính để hệ thống thiết lập lộ trình.</p>
          <Link href="/goal" className="btn btn--primary btn--lg shadow-md">Đến trang Mục tiêu</Link>
        </div>
      </div>
    );
  }

  // 2. Lấy danh sách milestones & tasks để render chi tiết
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("id, target_career_id, careers(name)")
    .eq("student_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data: milestones } = await supabase
    .from("roadmap_milestones")
    .select("id, title, status, target_date, order_index")
    .eq("roadmap_id", roadmap?.id)
    .order("order_index", { ascending: true });

  const { data: tasks } = await supabase
    .from("roadmap_tasks")
    .select("id, milestone_id, title, status, due_date, priority, task_completions(id)")
    .in("milestone_id", (milestones ?? []).map(m => m.id))
    .order("due_date", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="mb-2">
        <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Hành trình của em</p>
        <h1 className="text-3xl font-bold mb-2">Mục tiêu: {(roadmap?.careers as any)?.name ?? "Chưa xác định"}</h1>
      </header>

      {/* KPI Section */}
      <ElevatedCard className="bg-primary-soft border-primary-soft border-l-4" style={{ borderLeftColor: 'var(--primary)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-bold text-primary-dark uppercase tracking-wider">Tiến độ chặng hiện tại</p>
            <div className="flex items-end gap-3 mb-3 mt-1">
              <span className="text-4xl md:text-5xl font-bold text-primary-dark leading-none">{journey.progress}%</span>
            </div>
            <div className="mb-3">
              <ProgressBar progress={journey.progress} color="var(--primary)" trackColor="rgba(255,255,255,0.5)" />
            </div>
            <p className="text-sm font-medium text-primary-dark">
              Đã hoàn thành {journey.completedTasks}/{journey.totalTasks} nhiệm vụ của chặng: {journey.currentMilestone?.title}
            </p>
          </div>
          
          {journey.priorityTask && (
            <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-100">
              <div className="flex gap-2 items-center mb-3">
                <span className="text-xl">🎯</span>
                <span className="font-bold text-primary uppercase text-sm tracking-wider">Ưu tiên ngay lúc này</span>
              </div>
              <p className="font-bold text-lg text-neutral-800 leading-tight mb-4">{journey.priorityTask.title}</p>
              <div>
                <form action={async () => {
                  "use server";
                  const supa = await createClient();
                  const acc = await getCurrentAccount();
                  if (!acc) return;
                  await supa.from("task_completions").insert({
                    student_id: acc.userId,
                    task_id: journey.priorityTask!.id,
                    completion_type: "self_reported"
                  });
                  redirect("/journey");
                }}>
                  <button type="submit" className="btn btn--primary btn--sm shadow-sm">Đánh dấu hoàn thành</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </ElevatedCard>

      {/* Roadmap visualization */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl font-bold">Lộ trình chi tiết</h2>
        <Surface className="p-4 md:p-8">
          <div className="pl-6 border-l-2 space-y-10" style={{ borderColor: 'var(--primary-soft)' }}>
            {(milestones ?? []).map(m => {
              const milestoneTasks = (tasks ?? []).filter(t => t.milestone_id === m.id);
              const isCurrent = m.id === journey.currentMilestone?.id;
              
              return (
                <div key={m.id} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[33px] w-4 h-4 rounded-full border-2 border-white ${isCurrent ? 'scale-125' : ''}`} style={{ backgroundColor: isCurrent ? 'var(--primary)' : m.status === 'completed' ? 'var(--success)' : 'var(--neutral-300)' }}></div>
                  
                  <h3 className={`text-xl font-bold mb-1 ${isCurrent ? 'text-primary' : 'text-neutral-800'}`}>{m.title}</h3>
                  <p className="text-sm font-medium text-neutral-500 mb-5">Mục tiêu: {m.target_date ? new Date(m.target_date).toLocaleDateString("vi-VN") : "Chưa xác định"}</p>
                  
                  <div className="space-y-3">
                    {milestoneTasks.map(t => {
                      const isCompleted = (t.task_completions as any[])?.length > 0;
                      return (
                        <div key={t.id} className={`p-4 rounded-lg border flex justify-between items-center transition-colors ${isCompleted ? 'opacity-60 bg-neutral-50/50 border-neutral-200' : 'bg-white border-neutral-200 hover:border-primary-soft'}`}>
                          <div className="flex items-center gap-3">
                            <TaskCheckbox taskId={t.id} isCompleted={isCompleted} />
                            <span className={isCompleted ? 'line-through text-neutral-500' : 'font-medium text-neutral-800'}>{t.title}</span>
                          </div>
                          {t.priority === 'critical' && (
                            <StatusBadge status="warning" label="Quan trọng" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}
