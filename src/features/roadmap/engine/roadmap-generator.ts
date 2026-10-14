import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { RequirementEngine } from './requirement-engine';
import { GapAnalysisEngine, StudentState } from './gap-analysis';
import { PriorityEngine } from './priority-engine';
import { TimelinePlanner } from './timeline-planner';
import * as crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export class RoadmapGenerator {
  private supabase: ReturnType<typeof createClient<Database>>;
  private requirementEngine: RequirementEngine;
  private gapEngine: GapAnalysisEngine;
  private priorityEngine: PriorityEngine;
  private timelinePlanner: TimelinePlanner;

  constructor(supabaseClient: ReturnType<typeof createClient<Database>>) {
    this.supabase = supabaseClient;
    this.requirementEngine = new RequirementEngine(this.supabase);
    this.gapEngine = new GapAnalysisEngine();
    this.priorityEngine = new PriorityEngine();
    this.timelinePlanner = new TimelinePlanner();
  }

  /**
   * Generates a new roadmap for the student targeting a specific university major or career.
   */
  async generateRoadmap(
    studentId: string, 
    targetType: 'university_major' | 'career', 
    targetId: string,
    targetDetails: { target_career_id?: string, target_major_id?: string, target_university_id?: string, target_program_id?: string }
  ) {
    // 1. Fetch Student State
    const [profileRes, academicRes, careerProfileRes] = await Promise.all([
      (this.supabase as any).from('student_profiles').select('*').eq('id', studentId).single(),
      (this.supabase as any).from('academic_records').select('*').eq('student_id', studentId),
      (this.supabase as any).from('student_career_profiles')
        .select('profile_version')
        .eq('student_id', studentId)
        .eq('is_current', true)
        .maybeSingle()
    ]);

    if (profileRes.error || !profileRes.data) {
      console.error("Profile fetch error:", profileRes.error);
      throw new Error(`Student profile not found for id ${studentId}`);
    }
    const profile = profileRes.data;
    const academicRecords = academicRes.data || [];
    // Use real profile_version from DB, default to 0 if student hasn't completed assessment
    const profileVersion = careerProfileRes.data?.profile_version ?? 0;

    const studentState: StudentState = { profile, academicRecords };

    // 2. Fetch Target Requirements
    let requirements = await this.requirementEngine.getVerifiedRequirements(targetType, targetId);
    
    if (requirements.length === 0) {
      return {
        status: 'insufficient_data',
        message: 'Mục tiêu này chưa có yêu cầu đã được xác minh để tạo lộ trình đáng tin cậy.',
      };
    }

    // 3. Process Gaps and Timeline
    const gaps = this.gapEngine.analyze(requirements, studentState);
    
    // Check if there are any gaps. If all requirements are satisfied, we don't generate empty tasks.
    const hasUnmetGaps = gaps.some(g => g.hasGap);
    if (!hasUnmetGaps) {
      return { status: 'satisfied', message: 'All requirements already satisfied.' };
    }

    const prioritizedGaps = this.priorityEngine.prioritize(gaps, profile.grade || 10);
    const milestones = this.timelinePlanner.plan(prioritizedGaps, profile.grade || 10);

    // 4. Idempotency Check
    // Create a hash of the current state and target to prevent duplicate generation
    const stateHashInput = JSON.stringify({
      studentId,
      targetType,
      targetId,
      academicRecordsLength: academicRecords.length,
      grade: profile.grade
    });
    const snapshotHash = crypto.createHash('sha256').update(stateHashInput).digest('hex');

    // We can use generator_version as a place to store this hash for simplicity in V1 idempotency
    const generatorVersionStr = `ROADMAP-V1.0-${snapshotHash.substring(0, 8)}`;

    const existingActive = await (this.supabase as any)
      .from('roadmaps')
      .select('id, generator_version')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingActive.data && existingActive.data.generator_version === generatorVersionStr) {
      // Idempotent: exact same state and target already active
      return { status: 'success', roadmapId: existingActive.data.id, message: 'Existing roadmap is up to date.' };
    }

    const serializeDate = (date: Date) => date.toISOString().slice(0, 10);
    const adminClient = createAdminClient();
    const { data: roadmapId, error: transactionError } = await (adminClient as any).rpc('replace_student_roadmap', {
      p_student_id: studentId,
      p_requirement_target_type: targetType,
      p_requirement_target_id: targetId,
      p_target: {
        targetCareerId: targetDetails.target_career_id ?? null,
        targetMajorId: targetDetails.target_major_id ?? null,
        targetUniversityId: targetDetails.target_university_id ?? null,
        targetProgramId: targetDetails.target_program_id ?? null,
      },
      p_metadata: {
        generatorVersion: generatorVersionStr,
        profileVersion,
        academicDataVersion: new Date().toISOString(),
      },
      p_milestones: milestones.map((milestone) => ({
        title: milestone.title,
        description: milestone.description,
        targetDate: serializeDate(milestone.targetDate),
        priority: milestone.priority,
        sourceRequirementId: milestone.sourceRequirementId,
        orderIndex: milestone.orderIndex,
        tasks: milestone.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          taskType: task.taskType,
          priority: task.priority,
          dueDate: serializeDate(task.dueDate),
          estimatedEffort: task.estimatedEffort,
          sourceRequirementId: task.sourceRequirementId,
          evidenceRequired: task.evidenceRequired,
          evidenceType: task.evidenceType,
        })),
      })),
    });

    if (transactionError || !roadmapId) {
      throw new Error(`Failed to persist roadmap transaction: ${transactionError?.message ?? 'missing roadmap id'}`);
    }

    return { status: 'success', roadmapId, message: 'Roadmap generated successfully.' };
  }
}
