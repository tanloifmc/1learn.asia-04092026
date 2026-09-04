import { TargetRequirement } from './requirement-engine';
import { Database } from '@/types/supabase';

type AcademicRecord = Database['public']['Tables']['academic_records']['Row'];
type StudentProfile = Database['public']['Tables']['student_profiles']['Row'];

export interface StudentState {
  profile: StudentProfile;
  academicRecords: AcademicRecord[];
}

export interface Gap {
  requirement: TargetRequirement;
  currentValue: string | null;
  hasGap: boolean;
  gapMagnitude: number; // 0 if no gap, higher means bigger gap
}

// Mapping from requirement_code to subject_code in academic_records
const REQUIREMENT_TO_SUBJECT_CODE: Record<string, string> = {
  'academic_math': 'toan',
  'academic_physics': 'ly',
  'academic_chemistry': 'hoa',
  'academic_biology': 'sinh',
  'academic_literature': 'van',
  'academic_english': 'anh',
  'academic_history': 'su',
  'academic_geography': 'dia',
};

export class GapAnalysisEngine {
  
  /**
   * Compares the student's current state against the target requirements
   */
  analyze(requirements: TargetRequirement[], studentState: StudentState): Gap[] {
    return requirements.map(req => {
      const { currentValue, hasGap, gapMagnitude } = this.evaluateRequirement(req, studentState);
      return {
        requirement: req,
        currentValue,
        hasGap,
        gapMagnitude
      };
    });
  }

  private evaluateRequirement(req: TargetRequirement, state: StudentState): { currentValue: string | null, hasGap: boolean, gapMagnitude: number } {
    let currentValue: string | null = null;
    let hasGap = true;
    let gapMagnitude = 1;

    if (req.requirement_type === 'academic') {
      // Resolve requirement_code to normalized subject_code to prevent hardcoded string matching
      const subjectCode = REQUIREMENT_TO_SUBJECT_CODE[req.requirement_code];
      if (subjectCode) {
        // Match by subject_code (normalized, lowercase) instead of Vietnamese name
        const record = state.academicRecords.find(
          r => r.subject_code?.toLowerCase() === subjectCode && r.grade_level === state.profile.grade
        );
        if (record && record.score !== null && record.score !== undefined) {
          currentValue = String(record.score);
          const targetValue = parseFloat(req.requirement_value);
          if (!isNaN(targetValue)) {
            hasGap = record.score < targetValue;
            gapMagnitude = hasGap ? targetValue - record.score : 0;
          }
        }
      }
    } else if (req.requirement_type === 'certification' || req.requirement_code.includes('ielts')) {
      // In a real scenario, we'd query a `certifications` table. 
      // For now, if there's no data, there's a gap.
      currentValue = null;
      hasGap = true;
      gapMagnitude = parseFloat(req.requirement_value) || 1; 
    } else if (req.requirement_type === 'skill') {
      currentValue = null; // Simplification for V1
      hasGap = true;
      gapMagnitude = 1;
    }

    // Safety fallback for exact matches etc.
    if (currentValue === null) {
      hasGap = true;
    }

    return { currentValue, hasGap, gapMagnitude };
  }
}
