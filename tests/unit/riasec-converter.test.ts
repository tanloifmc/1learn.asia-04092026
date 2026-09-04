import { describe, it, expect } from 'vitest';
import { convertHollandCodeToVector } from '../../src/features/career/utils/riasec-converter';

describe('convertHollandCodeToVector', () => {
  it('converts a standard 3-letter code (ICR) correctly', () => {
    const result = convertHollandCodeToVector('ICR');
    expect(result).toEqual({
      R: 0.4,
      I: 1.0,
      A: 0,
      S: 0,
      E: 0,
      C: 0.7,
    });
  });

  it('converts another standard 3-letter code (EAS) correctly', () => {
    const result = convertHollandCodeToVector('EAS');
    expect(result).toEqual({
      R: 0,
      I: 0,
      A: 0.7,
      S: 0.4,
      E: 1.0,
      C: 0,
    });
  });

  it('handles duplicate characters (AAA) correctly', () => {
    const result = convertHollandCodeToVector('AAA');
    expect(result).toEqual({
      R: 0,
      I: 0,
      A: 1.0, // Only the first occurrence gets the weight
      S: 0,
      E: 0,
      C: 0,
    });
  });

  it('handles invalid codes (null, undefined, empty string)', () => {
    const emptyVector = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    expect(convertHollandCodeToVector('')).toEqual(emptyVector);
    expect(convertHollandCodeToVector(null as any)).toEqual(emptyVector);
    expect(convertHollandCodeToVector(undefined as any)).toEqual(emptyVector);
  });

  it('ignores characters outside R/I/A/S/E/C (e.g. IXC => I, C)', () => {
    const result = convertHollandCodeToVector('IXC');
    expect(result).toEqual({
      R: 0,
      I: 1.0,
      A: 0,
      S: 0,
      E: 0,
      C: 0.7, // C is the 2nd valid character found
    });
  });

  it('handles codes with missing characters (e.g. only 2 valid characters)', () => {
    const result = convertHollandCodeToVector('RA');
    expect(result).toEqual({
      R: 1.0,
      I: 0,
      A: 0.7,
      S: 0,
      E: 0,
      C: 0,
    });
  });

  it('always outputs exactly 6 keys', () => {
    const result = convertHollandCodeToVector('RIA');
    const keys = Object.keys(result);
    expect(keys).toHaveLength(6);
    expect(keys.includes('R')).toBe(true);
    expect(keys.includes('I')).toBe(true);
    expect(keys.includes('A')).toBe(true);
    expect(keys.includes('S')).toBe(true);
    expect(keys.includes('E')).toBe(true);
    expect(keys.includes('C')).toBe(true);
  });
});
