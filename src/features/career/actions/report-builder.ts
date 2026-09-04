import { ReportData, GlobalValidity, AccessState } from "../../../types/report";
import { interpretProfile } from "./interpretation-engine";
import { RIASEC_IDENTITY_LABELS } from "../data/presentation-dictionary";

export class ReportBlockedError extends Error {
  constructor(public validity: GlobalValidity) {
    super(`Report blocked due to validity state: ${validity}`);
    this.name = 'ReportBlockedError';
  }
}

export interface ProfileFeatures {
  meta?: {
    validity?: string;
    source_assessments?: string[];
  };
  interests?: {
    primary_code?: string;
    ranked_dimensions?: string[];
    scores?: Record<string, number>;
  };
  personality?: {
    scores?: Record<string, number>;
  };
  work_values?: {
    scores?: Record<string, number>;
  };
  [key: string]: any;
}

export function buildReportData(
  studentId: string,
  assessmentId: string,
  profileFeatures: {
    meta?: { validity?: string; source_assessments?: string[] };
    interests?: { primary_code?: string; ranked_dimensions?: string[]; scores?: Record<string, number> };
    personality?: { scores?: Record<string, number> };
    work_values?: { scores?: Record<string, number> };
  },
  accessState: AccessState = 'FREE'
): ReportData {
  const rawValidity = profileFeatures.meta?.validity;
  let validity: GlobalValidity = 'UNDETERMINED';
  
  if (rawValidity === 'VALID') validity = 'VALID';
  else if (rawValidity === 'QUESTIONABLE') validity = 'QUESTIONABLE';
  else if (rawValidity === 'INVALID') validity = 'INVALID';
  
  // Validity Gate
  if (validity === 'INVALID' || validity === 'UNDETERMINED') {
    throw new ReportBlockedError(validity);
  }

  const interpreted = interpretProfile(profileFeatures);

  // RIASEC Mapping
  const hollandCode = profileFeatures.interests?.primary_code || null;
  const rankedDimensions = profileFeatures.interests?.ranked_dimensions;
  
  if (!hollandCode || !rankedDimensions || rankedDimensions.length < 6) {
    throw new Error('GAP: Missing deterministic Holland Code or full ranked dimensions from source');
  }

  const riasecPrimary = hollandCode[0] as 'R'|'I'|'A'|'S'|'E'|'C';
  const riasecSecondary = hollandCode[1] as 'R'|'I'|'A'|'S'|'E'|'C';
  
  const scores = profileFeatures.interests?.scores || {};
  const riasecDimensions = rankedDimensions.map((code, index) => ({
    code: code as 'R'|'I'|'A'|'S'|'E'|'C',
    normalizedScore: scores[code] || 0,
    rank: index + 1
  }));

  // Big Five Mapping
  const bigFiveTraits = interpreted.personality.map(t => {
    // DB Code format is BF_O, BF_C, etc. Strip the prefix for the frontend.
    const traitRaw = t.code.replace('BF_', '');
    return {
      trait: traitRaw as 'O'|'C'|'E'|'A'|'N',
      normalizedScore: t.score,
      classification: (t.level.toUpperCase()) as 'PROMINENT'|'MODERATE'|'LOWER'
    };
  });

  // Work Values Mapping
  const workValues = interpreted.work_values.map((t, index) => ({
    name: t.code,
    rank: index + 1,
    normalizedScore: t.score,
    interpretation: t.insight || ''
  }));

  const toInterpretationItem = (title: string, desc: string, source: string, index: number) => ({
    id: `${title.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    title,
    description: desc,
    sourceDimensions: [source], // Provenance injected here!
    evidence: null,
    implication: null
  });

  const identityMatch = hollandCode ? (RIASEC_IDENTITY_LABELS[hollandCode] || RIASEC_IDENTITY_LABELS[riasecPrimary]) : null;

  return {
    assessmentId,
    userId: studentId,
    generatedAt: new Date().toISOString(),
    validity,
    access: accessState,
    
    // Q1 RESOLVED: Identity mapping using exact Holland Code fallback to Primary Code
    identity: {
      state: identityMatch ? 'AVAILABLE' : 'EMPTY',
      title: identityMatch ? identityMatch.title : null,
      explanation: identityMatch ? identityMatch.explanation : null
    },
    
    riasec: {
      state: riasecDimensions.length === 6 ? 'AVAILABLE' : 'ERROR',
      dimensions: riasecDimensions,
      primary: riasecPrimary,
      secondary: riasecSecondary,
      hollandCode,
      // Q2 APPROVED: interpretation = primary RIASEC dimension insight (1:1 deterministic mapping)
      // Provenance: RIASEC score → ranking → primary dimension → dictionary insight → ReportData
      interpretation: interpreted.interests.primary[0]?.insight ?? null
    },
    
    bigFive: {
      state: bigFiveTraits.length > 0 ? 'AVAILABLE' : 'EMPTY',
      traits: bigFiveTraits,
      workingStyle: interpreted.workingStyle,
      interactionStyle: interpreted.interactionStyle
    },
    
    workValues: {
      state: workValues.length > 0 ? 'AVAILABLE' : 'EMPTY',
      values: accessState === 'FREE' ? workValues.slice(0, 3) : workValues
    },
    
    strengths: {
      state: interpreted.all_strengths.length > 0 ? 'AVAILABLE' : 'EMPTY',
      items: interpreted.all_strengths.map((s, i) => toInterpretationItem("Thế mạnh", s.description, s.source, i))
    },
    
    watchOuts: {
      state: interpreted.all_watch_outs.length > 0 ? 'AVAILABLE' : 'EMPTY',
      items: interpreted.all_watch_outs.map((w, i) => toInterpretationItem("Lưu ý", w.description, w.source, i))
    },
    
    environments: {
      state: interpreted.all_environments.length > 0 ? 'AVAILABLE' : 'EMPTY',
      items: interpreted.all_environments.map((t, i) => toInterpretationItem("Môi trường", t.description, t.source, i))
    },
    
    crossDimension: {
      state: 'EMPTY',
      patterns: []
    },
    
    careerExploration: { state: 'NOT_AVAILABLE', data: [] as never[] },
    majorExploration: { state: 'NOT_AVAILABLE', data: [] as never[] },
    universityExploration: { state: 'NOT_AVAILABLE', data: [] as never[] },
    actionPlan: { state: 'NOT_AVAILABLE', data: [] as never[] },
    
    // Q3 RESOLVED: Executive Snapshot assembly (1-3 sentences)
    executiveSnapshot: (() => {
      const snapshot: string[] = [];
      
      if (hollandCode && riasecPrimary) {
        const identityData = RIASEC_IDENTITY_LABELS[hollandCode] || RIASEC_IDENTITY_LABELS[riasecPrimary];
        if (identityData) {
          snapshot.push(`Bạn là một ${identityData.title} (nhóm ${hollandCode}).`);
        }
      }

      const maxProminentTrait = bigFiveTraits
        .filter(t => t.classification === 'PROMINENT')
        .sort((a, b) => b.normalizedScore - a.normalizedScore)[0];
        
      if (maxProminentTrait) {
        const traitDetail = interpreted.personality.find(t => t.code.replace('BF_', '') === maxProminentTrait.trait);
        if (traitDetail && traitDetail.meaning) {
          // Meaning is usually "Mức độ Cởi mở cao". Lowercasing first letter.
          const lowerMeaning = traitDetail.meaning.charAt(0).toLowerCase() + traitDetail.meaning.slice(1);
          snapshot.push(`Trong hồ sơ tính cách, ${lowerMeaning} là điểm đặc trưng nổi bật nhất của bạn.`);
        }
      }

      const topWorkValue = workValues.find(w => w.rank === 1);
      if (topWorkValue) {
        const wvDetail = interpreted.work_values.find(w => w.code === topWorkValue.name);
        if (wvDetail && wvDetail.meaning) {
           const name = wvDetail.meaning.replace('Coi trọng ', '').replace('Sự ', 'sự ').replace('Mối ', 'mối ').replace('Điều kiện ', 'điều kiện ');
           snapshot.push(`Trong công việc, bạn ưu tiên nhất là ${name}.`);
        }
      }

      return {
        state: snapshot.length > 0 ? 'AVAILABLE' as const : 'NOT_AVAILABLE' as const,
        deterministicSummary: snapshot,
        aiNarrative: null
      };
    })()
  };
}
