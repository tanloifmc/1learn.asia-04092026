import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runUniversityRecommendation } from '@/features/university/actions/recommendation-engine';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}));

function createChainableMock() {
  const mock: any = {};
  ['from', 'select', 'eq', 'order', 'limit', 'update', 'upsert'].forEach(method => {
    mock[method] = vi.fn().mockReturnValue(mock);
  });
  mock.insert = vi.fn().mockReturnValue(mock);
  mock.single = vi.fn();
  return mock;
}

describe('Phase 5: University Recommendation Engine', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createChainableMock();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('Should return insufficient_data if projectAcademicScore yields null (NO SILENT FALLBACK)', async () => {
    // Mock setup where student has no verified actual score, and we refuse to guess.
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_career_profiles') {
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { profile_version: 1 } }) }) }) }) }) };
      }
      if (table === 'academic_records') {
        // No records -> select().eq().eq()
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) };
      }
      if (table === 'university_recommendation_runs') {
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'run-123' }, error: null }) }) }) };
      }
      return mockSupabase;
    });

    const result = await runUniversityRecommendation('student-1', 'major-1');
    
    expect(result.success).toBe(true);
    expect(result.status).toBe('insufficient_data');
    expect(result.message).toContain('Định hướng Mục tiêu');
  });

  it('Should strictly filter by score_scale and admission_method', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_career_profiles') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { profile_version: 1 } }) }) }) }) }) };
      if (table === 'academic_records') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ record_type: 'IELTS', status: 'final', score_value: 7.0, max_score: 9.0 }], error: null }) }) }) };
      if (table === 'university_recommendation_runs') return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'run-123' }, error: null }) }) }) };
      if (table === 'university_majors') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'um1', university_id: 'u1', major_id: 'm1', admission_data: [{ admission_method: 'THPT', score_scale: 30, cutoff_score: 28 }] }], error: null }) }) };
      if (table === 'student_university_recommendations') return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return mockSupabase;
    });

    const result = await runUniversityRecommendation('student-1', 'major-1', 'IELTS');
    
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations![0].tier).toBe('Unrated');
  });
  
  it('Should map to Dream/Match/Safer Option based on gap, and calculate trend/volatility', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'student_career_profiles') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { profile_version: 1 } }) }) }) }) }) };
      if (table === 'academic_records') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ record_type: 'THPT', status: 'final', score_value: 28.5, max_score: 30 }], error: null }) }) }) };
      if (table === 'university_recommendation_runs') return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'run-123' }, error: null }) }) }) };
      if (table === 'university_majors') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ id: 'um1', university_id: 'u1', major_id: 'm1', admission_data: [
        { academic_year: 2023, admission_method: 'THPT', score_scale: 30, cutoff_score: 27, data_status: 'published' },
        { academic_year: 2024, admission_method: 'THPT', score_scale: 30, cutoff_score: 27.5, data_status: 'published' },
        { academic_year: 2025, admission_method: 'THPT', score_scale: 30, cutoff_score: 28, data_status: 'published' }
      ]}], error: null }) }) };
      if (table === 'student_university_recommendations') return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return mockSupabase;
    });

    const result = await runUniversityRecommendation('student-1', 'major-1', 'THPT');
    
    expect(result.recommendations).toBeDefined();
    const rec = result.recommendations![0];
    expect(rec.tier).toBe('Dream');
    expect(rec.fit_breakdown.trend).toBe('increasing');
    expect(rec.fit_breakdown.volatility).toBe('medium');
  });
});
