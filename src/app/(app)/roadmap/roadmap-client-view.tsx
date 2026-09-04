"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, AlertCircle, Target, BookOpen, Flag, Check, Route } from "lucide-react";
import { updateTaskStatus } from "@/features/roadmap/actions";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  target_date: string;
  priority: string;
  roadmap_tasks: Task[];
};

type Roadmap = {
  id: string;
  status: string;
  target_career_id: string | null;
  roadmap_milestones: Milestone[];
};

export function RoadmapClientView({ initialRoadmap }: { initialRoadmap: Roadmap }) {
  const router = useRouter();
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>(() => {
    // Expand the first milestone by default
    const firstId = initialRoadmap.roadmap_milestones[0]?.id;
    return firstId ? { [firstId]: true } : {};
  });

  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const toggleMilestone = (id: string) => {
    setExpandedMilestones(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTaskCheck = async (taskId: string, currentStatus: string) => {
    if (updatingTask) return;
    setUpdatingTask(taskId);
    
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const result = await updateTaskStatus(taskId, newStatus);
    
    setUpdatingTask(null);
    if (!result.error) {
      router.refresh();
    } else {
      alert("Lỗi cập nhật task: " + result.error);
    }
  };

  const totalTasks = initialRoadmap.roadmap_milestones.reduce((acc, m) => acc + m.roadmap_tasks.length, 0);
  const completedTasks = initialRoadmap.roadmap_milestones.reduce(
    (acc, m) => acc + m.roadmap_tasks.filter(t => t.status === "completed").length, 
  0);
  
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="bg-white rounded-[40px] shadow-sm border border-[#0E1B3D]/10 p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#0E1B3D]/5 rounded-full flex items-center justify-center">
              <Route className="w-6 h-6 text-[#B89862]" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-[#0E1B3D]">Tiến độ hành trình</h2>
              <p className="text-[#0E1B3D]/60 text-sm mt-1">Hoàn thành {completedTasks} / {totalTasks} bước</p>
            </div>
          </div>
          <span className="text-4xl font-serif text-[#0E1B3D]">{progressPercent}%</span>
        </div>
        
        <div className="w-full bg-[#0E1B3D]/5 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#0E1B3D] to-[#B89862] h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-[#0E1B3D]/10 hidden md:block z-0"></div>

        {initialRoadmap.roadmap_milestones
          .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
          .map((milestone, index) => {
          
          const isExpanded = expandedMilestones[milestone.id];
          const mTotal = milestone.roadmap_tasks.length;
          const mCompleted = milestone.roadmap_tasks.filter(t => t.status === "completed").length;
          const isMilestoneCompleted = mTotal > 0 && mCompleted === mTotal;

          return (
            <div key={milestone.id} className="relative z-10 flex flex-col md:flex-row gap-6">
              
              {/* Timeline Marker (Desktop) */}
              <div className="hidden md:flex flex-col items-center pt-8">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-[4px] border-[#F8F6F1] shadow-sm transition-colors ${isMilestoneCompleted ? 'bg-[#0E1B3D] text-[#B89862]' : 'bg-white text-[#0E1B3D]'}`}>
                  {isMilestoneCompleted ? <Check className="w-8 h-8" /> : <Flag className="w-8 h-8" />}
                </div>
              </div>

              {/* Milestone Card */}
              <div className={`flex-1 bg-white rounded-[32px] shadow-sm border transition-all overflow-hidden ${isMilestoneCompleted ? 'border-[#B89862]/30' : 'border-[#0E1B3D]/10 hover:border-[#0E1B3D]/30'}`}>
                {/* Milestone Header */}
                <div 
                  className={`p-6 md:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isExpanded ? 'bg-[#0E1B3D]/5 border-b border-[#0E1B3D]/10' : ''}`}
                  onClick={() => toggleMilestone(milestone.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`md:hidden p-2 rounded-full flex-shrink-0 ${isMilestoneCompleted ? 'bg-[#0E1B3D] text-[#B89862]' : 'bg-[#0E1B3D]/10 text-[#0E1B3D]'}`}>
                        {isMilestoneCompleted ? <Check className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white border border-[#0E1B3D]/10 text-[#B89862]">
                        <Clock className="w-3 h-3" />
                        {new Date(milestone.target_date).toLocaleDateString("vi-VN", { month: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl text-[#0E1B3D]">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-[#0E1B3D]/60 text-sm mt-2 max-w-2xl">{milestone.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#0E1B3D] mb-1">{mCompleted}/{mTotal} Task</div>
                      <div className="w-24 h-1.5 bg-[#0E1B3D]/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isMilestoneCompleted ? 'bg-[#B89862]' : 'bg-[#0E1B3D]'}`}
                          style={{ width: mTotal === 0 ? '0%' : `${(mCompleted / mTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-[#0E1B3D]/10 flex items-center justify-center text-[#0E1B3D]">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                {isExpanded && (
                  <div className="p-6 md:p-8 bg-white">
                    <div className="space-y-4">
                      {milestone.roadmap_tasks
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                        .map(task => (
                        <div 
                          key={task.id} 
                          className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${task.status === 'completed' ? 'bg-[#0E1B3D]/5 border-transparent' : 'bg-white border-[#0E1B3D]/10 hover:border-[#B89862]/50 hover:shadow-md'}`}
                        >
                          <button 
                            onClick={() => handleTaskCheck(task.id, task.status)}
                            disabled={updatingTask === task.id}
                            className={`mt-1 flex-shrink-0 transition-all ${
                              updatingTask === task.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${task.status === 'completed' ? 'text-[#B89862] scale-110' : 'text-[#0E1B3D]/20 hover:text-[#B89862]'}`}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-7 h-7" />
                            ) : (
                              <Circle className="w-7 h-7" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <h4 className={`text-lg font-medium transition-colors ${task.status === 'completed' ? 'text-[#0E1B3D]/50 line-through' : 'text-[#0E1B3D]'}`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-[#0E1B3D]/40' : 'text-[#0E1B3D]/60'}`}>{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#0E1B3D]/5 text-[#0E1B3D]/70 uppercase tracking-wider">
                                <BookOpen className="w-3.5 h-3.5" />
                                {task.task_type.replace('_', ' ')}
                              </span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                task.priority === 'critical' ? 'text-red-500' :
                                task.priority === 'high' ? 'text-orange-500' : 'text-[#0E1B3D]/50'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {milestone.roadmap_tasks.length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-[#0E1B3D]/10 rounded-2xl">
                          <p className="text-[#0E1B3D]/40 font-medium">Chưa có nhiệm vụ (task) nào trong chặng này.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
