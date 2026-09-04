// Major Engine Types — shared between client and server
// NOT a "use server" file — pure types/constants only

export const MAJOR_ALGORITHM_VERSION = "MAJOR_MATCH-V1.0";

export interface CareerMatchInput {
  career_id: string;
  career_code: string;
  match_score: number;
  rank?: number;
  algorithm_version?: string;
  education_paths?: Array<{ major_code: string; priority: number; notes?: string }>;
}

export interface SupportingCareer {
  career_id: string;
  career_code: string;
  career_match_score: number;
  mapping_weight: number;
}

export interface MajorMatch {
  major_code: string;
  relevance_score: number;
  supporting_career_count: number;
  max_supporting_career_score: number;
  algorithm_version: string;
  supporting_careers: SupportingCareer[];
}

export interface MajorEngineResult {
  success: boolean;
  status: 'completed' | 'insufficient_data' | 'no_major_mapping' | 'error';
  matches?: MajorMatch[];
  error?: string;
}
