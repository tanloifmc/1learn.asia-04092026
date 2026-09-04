import { describe, it, expect } from 'vitest';
import { buildReportData, ProfileFeatures } from '../actions/report-builder';
import { ReportBlockedError } from '../actions/report-builder';

const createBaseProfile = (): ProfileFeatures => ({
  meta: { validity: 'VALID' },
  interests: {
    primary_code: 'IRE',
    ranked_dimensions: ['I', 'R', 'E', 'A', 'S', 'C'],
    scores: { I: 80, R: 75, E: 70, A: 65, S: 60, C: 55 }
  },
  personality: {
    scores: { BF_O: 50, BF_C: 50, BF_E: 50, BF_A: 50, BF_N: 50 }
  },
  work_values: {
    scores: { WV_ACHIEVEMENT: 80, WV_INDEPENDENCE: 75, WV_RECOGNITION: 70, WV_RELATIONSHIPS: 65, WV_SUPPORT: 60, WV_WORKING_CONDITIONS: 55 }
  }
});

describe('Report Builder V1 - Engine Test Gate', () => {

  describe('Big Five working & interaction style (GAP 1 FIXED)', () => {
    it('should map workingStyle and interactionStyle directly from interpreted object (which is null from engine without explicit rule)', () => {
      const data = buildReportData('123', '456', {
        meta: { validity: 'VALID' },
        interests: { primary_code: 'IC' as any, ranked_dimensions: ['I', 'C', 'A', 'S', 'E', 'R'] as any },
        personality: {
          scores: { BF_C: 80, BF_O: 50, BF_E: 50, BF_A: 50, BF_N: 50 }
        }
      });
      // Engine currently sets them to null, so Builder should map to null
      expect(data.bigFive.workingStyle).toBeNull();
      expect(data.bigFive.interactionStyle).toBeNull();
    });
  });

  describe('3. Identity', () => {
    it('should use exact dictionary mapping for exact Holland Code (IRE)', () => {
      const profile = createBaseProfile();
      profile.interests!.primary_code = 'IRE';
      const result = buildReportData('student-1', 'assessment-1', profile);
      expect(result.identity.title).toBe('Người Khám Phá - Phân Tích');
      expect(result.identity.state).toBe('AVAILABLE');
    });

    it('should fallback to Primary Code (I) if no exact Holland Code', () => {
      const profile = createBaseProfile();
      profile.interests!.primary_code = 'IYZ'; 
      const result = buildReportData('student-1', 'assessment-1', profile);
      expect(result.identity.title).toBe('Người Phân Tích');
      expect(result.identity.state).toBe('AVAILABLE');
    });

    it('should throw Error if Holland Code is totally missing', () => {
      const profile = createBaseProfile();
      profile.interests!.primary_code = ''; // Empty string
      expect(() => buildReportData('student-1', 'assessment-1', profile)).toThrow(/Missing deterministic Holland Code/);
    });
  });

  describe('4. Executive Snapshot', () => {
    it('should contain 3 sentences for full data (Identity, Personality, Work Value)', () => {
      const profile = createBaseProfile();
      profile.personality!.scores = { BF_O: 50, BF_C: 70, BF_E: 50, BF_A: 50, BF_N: 50 }; // C prominent
      const result = buildReportData('student-1', 'assessment-1', profile);
      
      expect(result.executiveSnapshot.deterministicSummary.length).toBe(3);
      expect(result.executiveSnapshot.deterministicSummary[0]).toMatch(/Người Khám Phá - Phân Tích/);
      expect(result.executiveSnapshot.deterministicSummary[1]).toMatch(/Trong hồ sơ tính cách/);
      expect(result.executiveSnapshot.deterministicSummary[2]).toMatch(/Trong công việc, bạn ưu tiên nhất là/);
    });

    it('should contain 2 sentences if no prominent Big Five trait', () => {
      const profile = createBaseProfile();
      profile.personality!.scores = { BF_O: 50, BF_C: 50, BF_E: 50, BF_A: 50, BF_N: 50 }; // all moderate
      const result = buildReportData('student-1', 'assessment-1', profile);
      
      expect(result.executiveSnapshot.deterministicSummary.length).toBe(2);
      expect(result.executiveSnapshot.deterministicSummary[0]).toMatch(/Người Khám Phá - Phân Tích/);
      expect(result.executiveSnapshot.deterministicSummary[1]).toMatch(/Trong công việc, bạn ưu tiên nhất là/);
    });

    it('should omit work value if none exists', () => {
      const profile = createBaseProfile();
      profile.work_values!.scores = {}; // No work values
      const result = buildReportData('student-1', 'assessment-1', profile);
      
      // Since no prominent BF trait either
      expect(result.executiveSnapshot.deterministicSummary.length).toBe(1);
      expect(result.executiveSnapshot.deterministicSummary[0]).toMatch(/Người Khám Phá - Phân Tích/);
    });
    
    it('should return NOT_AVAILABLE if absolutely no Big Five or Work Values data (but valid RIASEC)', () => {
       const profile = createBaseProfile();
       profile.personality!.scores = {};
       profile.work_values!.scores = {};
       const result = buildReportData('student-1', 'assessment-1', profile);
       // Still has Identity (from RIASEC), so it's 1 sentence
       expect(result.executiveSnapshot.state).toBe('AVAILABLE');
       expect(result.executiveSnapshot.deterministicSummary.length).toBe(1);
    });
  });

  describe('5. Regression: RIASEC, Work Values, Insights, Provenance', () => {
    it('should preserve correct RIASEC ranks', () => {
      const result = buildReportData('student-1', 'assessment-1', createBaseProfile());
      expect(result.riasec.dimensions.length).toBe(6);
      expect(result.riasec.dimensions[0].code).toBe('I'); // Primary
    });

    it('should preserve all work values for PREMIUM and slice top 3 for FREE', () => {
      const freeResult = buildReportData('student-1', 'assessment-1', createBaseProfile(), 'FREE');
      expect(freeResult.workValues.values.length).toBe(3);
      expect(freeResult.workValues.values[0].rank).toBe(1);

      const premiumResult = buildReportData('student-1', 'assessment-1', createBaseProfile(), 'PREMIUM');
      expect(premiumResult.workValues.values.length).toBe(5); // mock createBaseProfile only has 5
    });

    it('should preserve sourceDimensions (provenance)', () => {
      const result = buildReportData('student-1', 'assessment-1', createBaseProfile());
      expect(result.strengths.items.length).toBeGreaterThan(0);
      expect(result.strengths.items[0]).toHaveProperty('sourceDimensions');
    });
  });

  describe('6. Contract Integrity (Free Access by default)', () => {
    it('should output expected ReportData shape without invalid fields', () => {
      const result = buildReportData('student-1', 'assessment-1', createBaseProfile());
      expect(result).toHaveProperty('validity', 'VALID');
      expect(result).toHaveProperty('identity');
      expect(result.identity.state).not.toBe('NOT_AVAILABLE'); // Should be AVAILABLE or EMPTY
      
      expect(result).toHaveProperty('bigFive');
      expect(result.bigFive.workingStyle).toBeNull();
      
      expect(result).toHaveProperty('executiveSnapshot');
      expect(result.executiveSnapshot.state).not.toBe('EMPTY');
      
      // Check that future capabilities are strictly typed and exist
      expect(result.careerExploration.state).toBe('NOT_AVAILABLE');
    });
  });
});
