/**
 * remediation.test.ts
 *
 * ARCHITECTURE NOTE:
 * - The PRODUCTION flow uses calculateScoringV1() in scoring.ts, which uses
 *   total session duration (startedAt/completedAt) for speeding detection.
 *   The production validity tests are in scoring.test.ts.
 *
 * Big Five interpretation tests use BF_ prefixed keys matching the DB contract.
 */
import { describe, it, expect } from 'vitest';
import { interpretProfile } from '../../career/actions/interpretation-engine';

/**
 * Big Five Interpretation uses BF_ prefixed keys (BF_O, BF_C, BF_E, BF_A, BF_N)
 * matching the DB contract in assessment_dimensions.code.
 * interpretation-engine.ts resolves: dict.dimensions[code] || dict.dimensions[code.toUpperCase()]
 * so it accepts both 'BF_O' and its uppercase. Production data uses BF_ prefix.
 */
describe('Big Five Interpretation (Spec 07 Remediation) — DB key contract BF_ prefix', () => {
  it('No trait D >= 10 -> No PROMINENT (BF_ keys)', () => {
    const interpreted = interpretProfile({
      personality: {
        // mean = 50, max D = +5 (BF_E at 55) — not PROMINENT
        scores: { BF_O: 50, BF_C: 50, BF_E: 55, BF_A: 45, BF_N: 50 }
      }
    });

    const hasProminent = interpreted.personality.some(t => t.level === 'prominent');
    expect(hasProminent).toBe(false);
  });

  it('No trait D <= -10 -> No LOWER (BF_ keys)', () => {
    const interpreted = interpretProfile({
      personality: {
        // mean = 50, min D = -5 (BF_A at 45) — not LOWER
        scores: { BF_O: 50, BF_C: 50, BF_E: 55, BF_A: 45, BF_N: 50 }
      }
    });

    const hasLower = interpreted.personality.some(t => t.level === 'lower');
    expect(hasLower).toBe(false);
  });

  it('BF_O D >= 10 -> PROMINENT', () => {
    const interpreted = interpretProfile({
      personality: {
        // mean = (70+50+50+50+50)/5 = 54, BF_O = 70, D = +16 >= 10 => PROMINENT
        scores: { BF_O: 70, BF_C: 50, BF_E: 50, BF_A: 50, BF_N: 50 }
      }
    });

    const openTrait = interpreted.personality.find(t => t.code === 'BF_O');
    expect(openTrait?.level).toBe('prominent');
  });

  it('BF_O D <= -10 -> LOWER', () => {
    const interpreted = interpretProfile({
      personality: {
        // mean = (30+50+50+50+50)/5 = 46, BF_O = 30, D = -16 <= -10 => LOWER
        scores: { BF_O: 30, BF_C: 50, BF_E: 50, BF_A: 50, BF_N: 50 }
      }
    });

    const openTrait = interpreted.personality.find(t => t.code === 'BF_O');
    expect(openTrait?.level).toBe('lower');
  });

  it('All traits same score -> all MODERATE', () => {
    const interpreted = interpretProfile({
      personality: {
        scores: { BF_O: 60, BF_C: 60, BF_E: 60, BF_A: 60, BF_N: 60 }
        // mean = 60, all D = 0, none PROMINENT or LOWER
      }
    });

    const allModerate = interpreted.personality.every(t => t.level === 'moderate');
    expect(allModerate).toBe(true);
  });
});
