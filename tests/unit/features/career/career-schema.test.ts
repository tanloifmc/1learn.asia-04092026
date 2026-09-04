import { describe, it, expect } from 'vitest';
import { processCareerCSVUpload } from '../../../../src/features/career/actions/admin-careers';
import { careerFormSchema } from '../../../../src/features/career/schemas/career';

describe('Career Schema Validation', () => {
  it('should validate a correct career payload', () => {
    const payload = {
      code: 'TEST_01',
      name: 'Test Career',
      slug: 'test-career-01',
      career_domain_code: 'TEST',
      skills: [
        { code: 'programming', name: 'Programming', importance: 0.9, type: 'hard' }
      ],
      market_data: {
        salary: { currency: 'VND', min: 1000, max: 2000, period: 'month', location: 'VN', experience_level: 'all', year: 2026, source: 'Test' }
      }
    };
    
    const result = careerFormSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject invalid codes and slugs', () => {
    const payload = {
      code: 'invalid code space',
      name: 'Test',
      slug: 'invalid_slug',
      career_domain_code: 'TEST'
    };
    
    const result = careerFormSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.code).toBeDefined();
      expect(result.error.flatten().fieldErrors.slug).toBeDefined();
    }
  });

  it('should reject salary without year', () => {
    const payload = {
      code: 'TEST_02',
      name: 'Test',
      slug: 'test-02',
      career_domain_code: 'TEST',
      market_data: {
        salary: { min: 1000, max: 2000, period: 'month' }
      }
    };
    
    const result = careerFormSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('processCareerCSVUpload', () => {
  it('should process mixed valid and invalid rows correctly', async () => {
    const rows = [
      {
        code: 'VALID_1',
        name: 'Valid Career',
        slug: 'valid-1',
        career_domain_code: 'IT'
      },
      {
        code: 'invalid code',
        name: 'Invalid Career',
        slug: 'invalid-slug!',
        career_domain_code: 'IT'
      }
    ];

    const results = await processCareerCSVUpload(rows);
    
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    
    if (!results[1].success) {
      expect(results[1].errors?.code).toBeDefined();
    }
  });
});
