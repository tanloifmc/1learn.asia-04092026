export type GlobalValidity = 'VALID' | 'QUESTIONABLE' | 'INVALID' | 'UNDETERMINED';

export type CapabilityState = 'AVAILABLE' | 'EMPTY' | 'NOT_AVAILABLE' | 'ERROR';

export type AccessState = 'FREE' | 'PREMIUM' | 'PREMIUM_LOCKED';

export interface RiasecDimension {
  readonly code: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
  readonly normalizedScore: number;
  readonly rank: number;
}

export interface RiasecCapability {
  readonly state: CapabilityState;
  readonly dimensions: readonly RiasecDimension[];
  readonly primary: 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | null;
  readonly secondary: 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | null;
  readonly hollandCode: string | null;
  readonly interpretation: string | null;
}

export type BigFiveClassification = 'PROMINENT' | 'MODERATE' | 'LOWER';

export interface BigFiveTrait {
  readonly trait: 'O' | 'C' | 'E' | 'A' | 'N';
  readonly normalizedScore: number;
  readonly classification: BigFiveClassification;
}

export interface BigFiveCapability {
  readonly state: CapabilityState;
  readonly traits: readonly BigFiveTrait[];
  readonly workingStyle: string | null;
  readonly interactionStyle: string | null;
}

export interface WorkValue {
  readonly name: string;
  readonly rank: number;
  readonly normalizedScore: number | null;
  readonly interpretation: string;
}

export interface WorkValuesCapability {
  readonly state: CapabilityState;
  readonly values: readonly WorkValue[];
}

export interface IdentityCapability {
  readonly state: CapabilityState;
  readonly title: string | null;
  readonly explanation: string | null;
}

export interface InterpretationItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sourceDimensions: readonly string[];
  readonly evidence: string | null;
  readonly implication: string | null;
}

export interface InterpretationCapability {
  readonly state: CapabilityState;
  readonly items: readonly InterpretationItem[];
}

export interface PatternItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly sourceSignals: readonly string[];
  readonly implication: string;
}

export interface PatternsCapability {
  readonly state: CapabilityState;
  readonly patterns: readonly PatternItem[];
}

export interface FutureExplorationCapability<T> {
  readonly state: CapabilityState;
  readonly data: readonly T[];
}

export interface ExecutiveSnapshotCapability {
  readonly state: CapabilityState;
  readonly deterministicSummary: readonly string[];
  readonly aiNarrative: string | null; // Optional presentation layer, NOT a dependency
}

export interface ReportData {
  readonly assessmentId: string;
  readonly userId: string;
  readonly generatedAt: string;
  
  readonly validity: GlobalValidity;
  readonly access: AccessState;
  
  readonly identity: IdentityCapability;
  readonly riasec: RiasecCapability;
  readonly bigFive: BigFiveCapability;
  readonly workValues: WorkValuesCapability;
  
  readonly strengths: InterpretationCapability;
  readonly watchOuts: InterpretationCapability;
  readonly environments: InterpretationCapability;
  
  readonly crossDimension: PatternsCapability;
  
  readonly careerExploration: FutureExplorationCapability<never>;
  readonly majorExploration: FutureExplorationCapability<never>;
  readonly universityExploration: FutureExplorationCapability<never>;
  readonly actionPlan: FutureExplorationCapability<never>;
  
  readonly executiveSnapshot: ExecutiveSnapshotCapability;
}
