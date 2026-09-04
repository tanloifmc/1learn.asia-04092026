import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { RequirementEngine } from './requirement-engine';
import { GapAnalysisEngine, StudentState } from './gap-analysis';
import { PriorityEngine } from './priority-engine';
import { TimelinePlanner } from './timeline-planner';
import * as crypto from 'crypto';

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
      // Fallback: If no strict academic requirements exist, we still provide a general exploration roadmap
      // instead of returning 'limited' because our primary goal is to advise fields of study.
      requirements = [
        {
          id: 'default-req-1',
          target_type: targetType,
          target_id: targetId,
          requirement_code: 'general_exploration',
          requirement_type: 'skill',
          comparison_operator: '>=',
          requirement_value: '1',
          unit: 'step',
          importance: 'high',
          status: 'published',
          source: 'system_default'
        } as any
      ];
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

    // 5. Transaction: Archive old, Create new
    // Supabase JS doesn't support generic RPC transactions easily without a Postgres function, 
    // but we can do a sequence of updates. For strict concurrency, we should use a Postgres function.
    // However, the partial unique index on (student_id) WHERE status = 'active' will prevent race conditions!
    // If two requests try to insert an active roadmap, one will fail the unique constraint.

    // 5.1 Archive existing active roadmap
    if (existingActive.data) {
      await (this.supabase as any)
        .from('roadmaps')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('id', existingActive.data.id);
    }

    // 5.2 Insert new roadmap
    const roadmapInsert = await (this.supabase as any).from('roadmaps').insert({
      student_id: studentId,
      target_career_id: targetDetails.target_career_id,
      target_major_id: targetDetails.target_major_id,
      target_university_id: targetDetails.target_university_id,
      target_program_id: targetDetails.target_program_id,
      roadmap_version: 1,
      generator_version: generatorVersionStr,
      profile_version: profileVersion,
      academic_data_version: new Date().toISOString(),
      status: 'active'
    }).select('id').single();

    if (roadmapInsert.error) {
      throw new Error(`Failed to insert roadmap: ${roadmapInsert.error.message}`);
    }

    const roadmapId = roadmapInsert.data.id;

    // 5.3 Insert Milestones and Tasks
    for (const ms of milestones) {
      const msInsert = await (this.supabase as any).from('roadmap_milestones').insert({
        roadmap_id: roadmapId,
        title: ms.title,
        description: ms.description,
        target_date: ms.targetDate.toISOString().split('T')[0],
        priority: ms.priority,
        source_requirement_id: ms.sourceRequirementId,
        order_index: ms.orderIndex
      }).select('id').single();

      if (msInsert.error) continue; // In production, handle better

      const msId = msInsert.data.id;
      
      const tasksToInsert = ms.tasks.map((t: any) => ({
        milestone_id: msId,
        title: t.title,
        description: t.description,
        task_type: t.taskType,
        priority: t.priority,
        due_date: t.dueDate.toISOString().split('T')[0],
        estimated_effort: t.estimatedEffort,
        source_requirement_id: t.sourceRequirementId,
        evidence_required: t.evidenceRequired,
        evidence_type: t.evidenceType
      }));

      await (this.supabase as any).from('roadmap_tasks').insert(tasksToInsert);
    }

    return { status: 'success', roadmapId, message: 'Roadmap generated successfully.' };
  }
}
