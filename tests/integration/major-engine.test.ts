import { describe, it, expect, vi } from 'vitest';
import { runMajorMatching, CareerMatchInput } from '@/features/university/actions/major-engine';

describe('Major Matching Engine V1.0', () => {
  // Mock Supabase client to avoid real DB calls during logic tests
  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === 'careers') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({
            data: [
              { code: 'CAREER_A', education_paths: [{ major_code: 'MAJOR_1', priority: 1 }, { major_code: 'MAJOR_2', priority: 2 }] },
              { code: 'CAREER_B', education_paths: [{ major_code: 'MAJOR_1', priority: 1 }, { major_code: 'MAJOR_3', priority: 1 }] },
              { code: 'CAREER_C', education_paths: [{ major_code: 'MAJOR_4', priority: 1 }] }
            ],
            error: null
          })
        };
      }
      if (table === 'majors') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockImplementation((col, values) => {
            // Mock that all queried majors are valid by default
            return Promise.resolve({
              data: values.map((v: string) => ({ code: v })),
              error: null
            });
          })
        };
      }
      return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
    })
  };

  it('Test 1: Một Career → một Major', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c3', career_code: 'CAREER_C', match_score: 85 }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    
    expect(result.success).toBe(true);
    expect(result.matches).toHaveLength(1);
    expect(result.matches![0].major_code).toBe('MAJOR_4');
    expect(result.matches![0].relevance_score).toBe(85);
    expect(result.matches![0].supporting_career_count).toBe(1);
    expect(result.matches![0].max_supporting_career_score).toBe(85);
  });

  it('Test 2: Hai Careers → một Major (Weighted average with weight 1)', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 90 },
      { career_id: 'c2', career_code: 'CAREER_B', match_score: 80 }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    
    expect(result.success).toBe(true);
    // MAJOR_1 should get (90*1 + 80*1) / 2 = 85
    const major1 = result.matches!.find(m => m.major_code === 'MAJOR_1');
    expect(major1).toBeDefined();
    expect(major1!.relevance_score).toBe(85);
    expect(major1!.supporting_career_count).toBe(2);
    expect(major1!.max_supporting_career_score).toBe(90);
  });

  it('Test 3: Nhiều Careers → nhiều Majors', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 90 },
      { career_id: 'c2', career_code: 'CAREER_B', match_score: 80 },
      { career_id: 'c3', career_code: 'CAREER_C', match_score: 75 }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    expect(result.matches!.length).toBeGreaterThan(1);
    
    // MAJOR_2 should be from CAREER_A only -> 90
    const major2 = result.matches!.find(m => m.major_code === 'MAJOR_2');
    expect(major2!.relevance_score).toBe(90);
    
    // MAJOR_3 should be from CAREER_B only -> 80
    const major3 = result.matches!.find(m => m.major_code === 'MAJOR_3');
    expect(major3!.relevance_score).toBe(80);
    
    // MAJOR_4 should be from CAREER_C only -> 75
    const major4 = result.matches!.find(m => m.major_code === 'MAJOR_4');
    expect(major4!.relevance_score).toBe(75);
  });

  it('Test 4: Mapping weight = 1 (Authoritative rule for V1.0)', async () => {
    // Verified implicitly in Test 2, but we'll check provenance explicitly
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 90 }
    ];
    
    const result = await runMajorMatching(input, mockSupabase);
    const major1 = result.matches!.find(m => m.major_code === 'MAJOR_1');
    
    expect(major1!.supporting_careers[0].mapping_weight).toBe(1);
  });

  it('Test 5: Hai Majors cùng score → tie-break', async () => {
    // Provide inputs where two majors have the exact same score
    // Tie-break rules: 1. relevance_score DESC, 2. supporting_career_count DESC, 3. max_score DESC, 4. code ASC
    const tieBreakSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'careers') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { code: 'C1', education_paths: [{ major_code: 'M_B', priority: 1 }, { major_code: 'M_A', priority: 1 }] },
                { code: 'C2', education_paths: [{ major_code: 'M_B', priority: 1 }] },
                { code: 'C3', education_paths: [{ major_code: 'M_C', priority: 1 }] }
              ],
              error: null
            })
          };
        }
        if (table === 'majors') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockImplementation((col, values) => {
              return Promise.resolve({ data: values.map((v: string) => ({ code: v })), error: null });
            })
          };
        }
        return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
      })
    };

    // C1=80, C2=80, C3=80
    // M_B supported by C1, C2 -> Score 80, Count 2, Max 80
    // M_A supported by C1 -> Score 80, Count 1, Max 80
    // M_C supported by C3 -> Score 80, Count 1, Max 80
    // Tie break 1: Score are all 80
    // Tie break 2: M_B has 2 supports, so it wins 1st place.
    // Tie break 3: M_A and M_C both have 1 support, Max 80.
    // Tie break 4: Code M_A < M_C, so M_A wins 2nd place.
    const input: CareerMatchInput[] = [
      { career_id: 'id1', career_code: 'C1', match_score: 80 },
      { career_id: 'id2', career_code: 'C2', match_score: 80 },
      { career_id: 'id3', career_code: 'C3', match_score: 80 }
    ];

    const result = await runMajorMatching(input, tieBreakSupabase);
    
    expect(result.matches![0].major_code).toBe('M_B');
    expect(result.matches![1].major_code).toBe('M_A');
    expect(result.matches![2].major_code).toBe('M_C');
  });

  it('Test 6: Một Major được nhiều Career hỗ trợ nhưng score không vượt 100', async () => {
    // 5 careers each matching 100%
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 100 },
      { career_id: 'c2', career_code: 'CAREER_B', match_score: 100 }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    const major1 = result.matches!.find(m => m.major_code === 'MAJOR_1');
    
    expect(major1!.relevance_score).toBeLessThanOrEqual(100);
    expect(major1!.relevance_score).toBe(100); // (100+100)/2
  });

  it('Test 7: Không có mapping → no_major_mapping / insufficient_data', async () => {
    const noMappingSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'careers') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { code: 'UNKNOWN_CAREER', education_paths: [] }
              ],
              error: null
            })
          };
        }
        if (table === 'majors') {
          return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
        }
        return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
      })
    };

    const input: CareerMatchInput[] = [
      { career_id: 'u1', career_code: 'UNKNOWN_CAREER', match_score: 95 }
    ];

    const result = await runMajorMatching(input, noMappingSupabase);
    expect(result.success).toBe(true);
    expect(result.status).toBe('no_major_mapping');
    expect(result.matches).toBeUndefined();
  });

  it('Test 8: Duplicate mapping → Major chỉ xuất hiện một lần', async () => {
    // Career provides same major twice in DB
    const input: CareerMatchInput[] = [
      { 
        career_id: 'c1', 
        career_code: 'CAREER_A', 
        match_score: 90,
        education_paths: [
          { major_code: 'MAJOR_DUP', priority: 1 },
          { major_code: 'MAJOR_DUP', priority: 2 } // dupe
        ]
      }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    
    expect(result.matches).toHaveLength(1);
    expect(result.matches![0].major_code).toBe('MAJOR_DUP');
    // Score should be 90, not 90+90/2 (since dupe is filtered at career level)
    expect(result.matches![0].supporting_career_count).toBe(1);
  });

  it('Test 9: Kết quả chạy lại cùng input → giống hệt', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 90 },
      { career_id: 'c2', career_code: 'CAREER_B', match_score: 80 }
    ];

    const result1 = await runMajorMatching(input, mockSupabase);
    const result2 = await runMajorMatching(input, mockSupabase);
    
    expect(JSON.stringify(result1)).toEqual(JSON.stringify(result2));
  });

  it('Test 10: Provenance đầy đủ', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'CAREER_A', match_score: 90 }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    const major1 = result.matches!.find(m => m.major_code === 'MAJOR_1')!;
    
    expect(major1).toHaveProperty('major_code');
    expect(major1).toHaveProperty('relevance_score');
    expect(major1).toHaveProperty('supporting_career_count');
    expect(major1).toHaveProperty('max_supporting_career_score');
    expect(major1).toHaveProperty('algorithm_version', 'MAJOR_MATCH-V1.0');
    expect(major1.supporting_careers[0]).toHaveProperty('career_id', 'c1');
    expect(major1.supporting_careers[0]).toHaveProperty('career_code', 'CAREER_A');
    expect(major1.supporting_careers[0]).toHaveProperty('career_match_score', 90);
    expect(major1.supporting_careers[0]).toHaveProperty('mapping_weight', 1);
  });

  // EDGE CASE TESTS BY CTO
  it('Test A: Một Career map cùng Major 2 lần -> Chỉ tính 1 lần', async () => {
    // Already covered in Test 8, but explicit edge test as requested
    const input: CareerMatchInput[] = [
      { 
        career_id: 'c1', 
        career_code: 'CAREER_A', 
        match_score: 90,
        education_paths: [
          { major_code: 'MAJOR_X', priority: 1 },
          { major_code: 'MAJOR_X', priority: 1 }
        ]
      }
    ];
    const result = await runMajorMatching(input, mockSupabase);
    expect(result.matches![0].major_code).toBe('MAJOR_X');
    expect(result.matches![0].relevance_score).toBe(90);
    expect(result.matches![0].supporting_career_count).toBe(1);
  });

  it('Test B: Career map tới major_code không tồn tại -> Không tạo Major giả', async () => {
    const missingMajorSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'majors') {
          // Mock that the queried major does NOT exist
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: [], error: null })
          };
        }
        return { select: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
      })
    };

    const input: CareerMatchInput[] = [
      { 
        career_id: 'c1', career_code: 'CAREER_A', match_score: 90,
        education_paths: [{ major_code: 'FAKE_MAJOR', priority: 1 }]
      }
    ];

    const result = await runMajorMatching(input, missingMajorSupabase);
    expect(result.status).toBe('no_major_mapping');
    expect(result.matches).toBeUndefined();
  });

  it('Test C: 5 Careers cùng map một Major với score = 100 -> Score = 100, không > 100', async () => {
    const input: CareerMatchInput[] = Array.from({ length: 5 }).map((_, i) => ({
      career_id: `c${i}`, career_code: `CAREER_${i}`, match_score: 100,
      education_paths: [{ major_code: 'MAJOR_C', priority: 1 }]
    }));

    const result = await runMajorMatching(input, mockSupabase);
    expect(result.matches![0].major_code).toBe('MAJOR_C');
    expect(result.matches![0].relevance_score).toBe(100);
    expect(result.matches![0].supporting_career_count).toBe(5);
  });

  it('Test D: Hai Careers cùng Major (80 và 40) -> Score = 60 với Weight = 1', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'C1', match_score: 80, education_paths: [{ major_code: 'MAJOR_D', priority: 1 }] },
      { career_id: 'c2', career_code: 'C2', match_score: 40, education_paths: [{ major_code: 'MAJOR_D', priority: 1 }] }
    ];

    const result = await runMajorMatching(input, mockSupabase);
    expect(result.matches![0].major_code).toBe('MAJOR_D');
    expect(result.matches![0].relevance_score).toBe(60);
    expect(result.matches![0].supporting_career_count).toBe(2);
  });

  it('Test E: Cùng input chạy 2 lần -> Output giống hệt 100%', async () => {
    const input: CareerMatchInput[] = [
      { career_id: 'c1', career_code: 'C1', match_score: 80, education_paths: [{ major_code: 'MAJOR_E', priority: 1 }] }
    ];

    const result1 = await runMajorMatching(input, mockSupabase);
    const result2 = await runMajorMatching(input, mockSupabase);
    
    expect(JSON.stringify(result1)).toEqual(JSON.stringify(result2));
  });
});
