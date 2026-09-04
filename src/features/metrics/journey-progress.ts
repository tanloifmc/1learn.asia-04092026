/**
 * Domain metric: Journey Progress
 *
 * "Em đang thực hiện kế hoạch đến đâu?" (TÁCH BIỆT với Goal Readiness)
 *
 * Nguồn dữ liệu:
 *   - roadmap_milestones (active milestone của roadmap học sinh)
 *   - roadmap_tasks (tasks trong milestone đó)
 *   - task_completions (tasks đã hoàn thành)
 *
 * Công thức: completed_tasks / total_tasks_in_current_milestone × 100
 *
 * Task Completion KHÔNG ảnh hưởng Goal Readiness.
 * Đây là SOURCE OF TRUTH duy nhất cho Journey Progress.
 */

import { createClient } from "@/lib/supabase/server";

export interface JourneyProgressResult {
  progress: number;            // 0–100
  completedTasks: number;
  totalTasks: number;
  currentMilestone: {
    id: string;
    title: string;
    targetDate: string | null;
  } | null;
  priorityTask: {
    id: string;
    title: string;
    taskType: string;
    dueDate: string | null;
    priority: string;
  } | null;
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export async function getJourneyProgress(
  studentId: string
): Promise<JourneyProgressResult | null> {
  const supabase = await createClient();

  // Lấy active roadmap
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!roadmap) return null;

  // Lấy milestone đang in_progress (ưu tiên order_index nhỏ nhất)
  const { data: milestone } = await supabase
    .from("roadmap_milestones")
    .select("id, title, target_date")
    .eq("roadmap_id", roadmap.id)
    .eq("status", "in_progress")
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!milestone) return null;

  // Lấy tất cả tasks trong milestone này
  const { data: tasks } = await supabase
    .from("roadmap_tasks")
    .select("id, title, task_type, due_date, priority, task_completions(id)")
    .eq("milestone_id", milestone.id);

  if (!tasks || tasks.length === 0) {
    return {
      progress: 0,
      completedTasks: 0,
      totalTasks: 0,
      currentMilestone: { id: milestone.id, title: milestone.title, targetDate: milestone.target_date },
      priorityTask: null,
    };
  }

  const completedIds = new Set(
    tasks.flatMap((t) => ((t.task_completions as { id: string }[]) ?? []).map((c) => c.id))
  );
  const completedCount = tasks.filter(
    (t) => ((t.task_completions as { id: string }[]) ?? []).length > 0
  ).length;

  const progress = Math.round((completedCount / tasks.length) * 100);

  // Tìm task ưu tiên cao nhất chưa hoàn thành (để hiển thị "Ưu tiên ngay lúc này")
  const pendingTasks = tasks
    .filter((t) => ((t.task_completions as { id: string }[]) ?? []).length === 0)
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority as string] ?? 99;
      const pb = PRIORITY_ORDER[b.priority as string] ?? 99;
      if (pa !== pb) return pa - pb;
      // Cùng priority: due_date gần nhất trước
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  const priorityTask = pendingTasks[0]
    ? {
        id: pendingTasks[0].id,
        title: pendingTasks[0].title,
        taskType: pendingTasks[0].task_type as string,
        dueDate: pendingTasks[0].due_date as string | null,
        priority: pendingTasks[0].priority as string,
      }
    : null;

  return {
    progress,
    completedTasks: completedCount,
    totalTasks: tasks.length,
    currentMilestone: {
      id: milestone.id,
      title: milestone.title,
      targetDate: milestone.target_date,
    },
    priorityTask,
  };
}
