import { INTERPRETATION_DICT, InterpretationBand, InterpretationRule } from "../utils/interpretation-dictionary";

export function calculateHollandCode(scores: Record<string, number>): { primary_code: string, ranked_dimensions: string[] } {
  const riasecScores = Object.entries(scores) as [string, number][];
  riasecScores.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    // Tie-breaking according to canonical order
    const order = ['R', 'I', 'A', 'S', 'E', 'C'];
    const indexA = order.indexOf(a[0].toUpperCase());
    const indexB = order.indexOf(b[0].toUpperCase());
    return indexA - indexB; // Lower index means higher priority
  });
  return {
    ranked_dimensions: riasecScores.map(x => x[0]),
    primary_code: riasecScores.slice(0, 3).map(x => x[0]).join('')
  };
}
export interface TraitDetail {
  code: string;
  score: number;
  level: string;
  meaning: string;
  evidence: string;
  insight: string;
  strengths: string[];
  watch_outs: string[];
  environments: string[];
}

export function classifyScore(score: number, bands: InterpretationBand[]): string {
  for (const band of bands) {
    const meetMin = band.min !== undefined ? score >= band.min : true;
    const meetMax = band.max !== undefined ? score < band.max : true;
    
    if (meetMin && meetMax) {
      return band.label;
    }
  }
  return 'medium';
}

export function interpretProfile(profileFeatures: {
  interests?: { primary_code?: string; scores?: Record<string, number> };
  personality?: { scores?: Record<string, number> };
  work_values?: { scores?: Record<string, number> };
  [key: string]: any;
}) {
  const interpreted = {
    interests: {
      primary: [] as TraitDetail[],
      secondary: [] as TraitDetail[],
    },
    personality: [] as TraitDetail[],
    work_values: [] as TraitDetail[],
    all_strengths: [] as { description: string; source: string }[],
    all_watch_outs: [] as { description: string; source: string }[],
    all_environments: [] as { description: string; source: string }[],
    workingStyle: null as string | null,
    interactionStyle: null as string | null,
  };

  const processFramework = (frameworkCode: string, frameworkKey: string) => {
    const data = profileFeatures[frameworkKey];
    if (!data || !data.scores) return [];

    const results: TraitDetail[] = [];
    const dict = INTERPRETATION_DICT[frameworkCode];
    if (!dict) return results;

    const bands = dict.bands;

    for (const [code, score] of Object.entries(data.scores as Record<string, number>)) {
      const rules = dict.dimensions[code] || dict.dimensions[code.toUpperCase()];
      if (!rules) continue;

      const level = classifyScore(score, bands);

      for (const rule of rules) {
        if (rule.level === level) {
          const detail: TraitDetail = {
            code,
            score,
            level: rule.level,
            meaning: rule.meaning,
            evidence: rule.evidence,
            insight: rule.insight,
            strengths: rule.strengths,
            watch_outs: rule.watch_outs,
            environments: rule.environments,
          };
          results.push(detail);

          rule.strengths.forEach(s => interpreted.all_strengths.push({ description: s, source: code }));
          rule.watch_outs.forEach(s => interpreted.all_watch_outs.push({ description: s, source: code }));
          rule.environments.forEach(s => interpreted.all_environments.push({ description: s, source: code }));

          break;
        }
      }
    }
    return results;
  };

  // Process RIASEC
  const riasecResults = processFramework('riasec', 'interests');
  
  // Single Source of Truth tie-break
  if (profileFeatures.interests?.scores) {
    const { ranked_dimensions } = calculateHollandCode(profileFeatures.interests.scores);
    
    // Reorder riasecResults to match ranked_dimensions
    const orderedResults: TraitDetail[] = [];
    for (const code of ranked_dimensions) {
      const match = riasecResults.find(r => r.code.toUpperCase() === code.toUpperCase());
      if (match) orderedResults.push(match);
    }
    
    interpreted.interests.primary = orderedResults.slice(0, 3);
    interpreted.interests.secondary = orderedResults.slice(3);
  } else {
    interpreted.interests.primary = riasecResults.slice(0, 3);
    interpreted.interests.secondary = riasecResults.slice(3);
  }

  // Process Big Five (Spec 07)
  const bfData = profileFeatures['personality'];
  if (bfData && bfData.scores) {
    const bfScores = bfData.scores as Record<string, number>;
    const traits = ['BF_O', 'BF_C', 'BF_E', 'BF_A', 'BF_N'];
    let sum = 0;
    let count = 0;
    for (const t of traits) {
      if (bfScores[t] !== undefined) {
        sum += bfScores[t];
        count++;
      }
    }
    
    if (count > 0) {
      const mean = sum / count;
      const bfDict = INTERPRETATION_DICT['big_five'];
      if (bfDict) {
        for (const [code, score] of Object.entries(bfScores)) {
          const rules = bfDict.dimensions[code] || bfDict.dimensions[code.toUpperCase()];
          if (!rules) continue;

          const d = score - mean;
          let level = 'moderate';
          if (d >= 10) level = 'prominent';
          else if (d <= -10) level = 'lower';

          for (const rule of rules) {
            if (rule.level === level) {
              const detail: TraitDetail = {
                code,
                score,
                level: rule.level,
                meaning: rule.meaning,
                evidence: rule.evidence,
                insight: rule.insight,
                strengths: rule.strengths,
                watch_outs: rule.watch_outs,
                environments: rule.environments,
              };
              interpreted.personality.push(detail);

              rule.strengths.forEach(s => interpreted.all_strengths.push({ description: s, source: code }));
              rule.watch_outs.forEach(s => interpreted.all_watch_outs.push({ description: s, source: code }));
              rule.environments.forEach(s => interpreted.all_environments.push({ description: s, source: code }));
              break;
            }
          }
        }
      }
    }
  }

  // Process Work Values
  const wvResults = processFramework('work_values', 'work_values');
  const wvTieBreakOrder = [
    'WV_ACHIEVEMENT', 
    'WV_INDEPENDENCE', 
    'WV_RECOGNITION', 
    'WV_RELATIONSHIPS', 
    'WV_SUPPORT', 
    'WV_CONDITIONS'
  ];
  wvResults.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-breaking according to Spec 07
    const indexA = wvTieBreakOrder.indexOf(a.code.toUpperCase());
    const indexB = wvTieBreakOrder.indexOf(b.code.toUpperCase());
    return indexA - indexB; // Lower index means higher priority
  });
  interpreted.work_values = wvResults; // Trả về tất cả 6 values, UI sẽ tự cắt Top 3 nếu là FREE

  return interpreted;
}
