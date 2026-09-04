import { PrioritizedGap } from './priority-engine';

export interface MilestoneDraft {
  title: string;
  description: string;
  priority: string;
  sourceRequirementId: string;
  targetDate: Date;
  orderIndex: number;
  tasks: TaskDraft[];
}

export interface TaskDraft {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  sourceRequirementId: string;
  dueDate: Date;
  estimatedEffort: string;
  evidenceRequired: boolean;
  evidenceType: string;
}

export class TimelinePlanner {
  
  /**
   * Generates a timeline of milestones and tasks based on prioritized gaps.
   */
  plan(gaps: PrioritizedGap[], currentGrade: number): MilestoneDraft[] {
    const milestones: MilestoneDraft[] = [];
    const currentDate = new Date();
    let currentMonthOffset = 1; // Start planning from next month

    for (let i = 0; i < gaps.length; i++) {
      const gap = gaps[i];
      if (!gap.hasGap) continue;

      // Determine task types based on gap type and grade context
      let taskType = 'skill_building';
      let evidenceType = 'none';
      let evidenceRequired = false;

      if (gap.requirement.requirement_type === 'certification') {
        taskType = 'certification';
        evidenceType = 'certificate';
        evidenceRequired = true;
      } else if (gap.requirement.requirement_type === 'academic') {
        taskType = 'foundation';
        evidenceType = 'score';
        evidenceRequired = true;
      }

      // Spread out target dates
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() + currentMonthOffset + 2); // 2 months to complete milestone

      const taskDueDate = new Date(currentDate);
      taskDueDate.setMonth(currentDate.getMonth() + currentMonthOffset);

      milestones.push({
        title: `Đạt được ${gap.requirement.requirement_code}`,
        description: `Bù đắp khoảng trống cho ${gap.requirement.requirement_code}. Hiện tại: ${gap.currentValue || 'Chưa có'}, Mục tiêu: ${gap.requirement.requirement_value} ${gap.requirement.unit}`,
        priority: gap.priorityLevel,
        sourceRequirementId: gap.requirement.id,
        targetDate: targetDate,
        orderIndex: i,
        tasks: [
          {
            title: `Xây dựng nền tảng cho ${gap.requirement.requirement_code}`,
            description: `Bắt đầu xây dựng kiến thức nền tảng cần thiết cho ${gap.requirement.requirement_code}.`,
            taskType: taskType,
            priority: gap.priorityLevel,
            sourceRequirementId: gap.requirement.id,
            dueDate: taskDueDate,
            // Estimate effort based on gap magnitude: larger gap = more hours
            estimatedEffort: `${Math.ceil(Math.max(5, gap.gapMagnitude * 8))} giờ`,
            evidenceRequired: false,
            evidenceType: 'none'
          },
          {
            title: `Kiểm tra thử hoặc nộp minh chứng cho ${gap.requirement.requirement_code}`,
            description: `Đánh giá tiến độ của bạn so với mục tiêu yêu cầu.`,
            taskType: 'assessment',
            priority: gap.priorityLevel,
            sourceRequirementId: gap.requirement.id,
            dueDate: targetDate, // Same as milestone target
            estimatedEffort: `${Math.ceil(Math.max(1, gap.gapMagnitude * 2))} giờ`,
            evidenceRequired: evidenceRequired,
            evidenceType: evidenceType
          }
        ]
      });

      // Increase offset to spread out milestones over time, 
      // preventing too many tasks per month.
      currentMonthOffset += 1; 
    }

    return milestones;
  }
}
