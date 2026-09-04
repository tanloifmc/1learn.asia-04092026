import { Gap } from './gap-analysis';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PrioritizedGap extends Gap {
  priorityScore: number;
  priorityLevel: PriorityLevel;
}

export class PriorityEngine {
  
  /**
   * Assigns a priority score and level to each gap.
   */
  prioritize(gaps: Gap[], currentGrade: number): PrioritizedGap[] {
    return gaps.map(gap => {
      const score = this.calculatePriorityScore(gap, currentGrade);
      return {
        ...gap,
        priorityScore: score,
        priorityLevel: this.getPriorityLevel(score)
      };
    }).sort((a, b) => b.priorityScore - a.priorityScore); // Highest score first
  }

  private calculatePriorityScore(gap: Gap, currentGrade: number): number {
    let score = 0;
    
    // 1. Base Importance factor
    const importanceFactor = {
      'critical': 100,
      'high': 75,
      'medium': 50,
      'low': 25
    }[gap.requirement.importance] || 50;

    score += importanceFactor;

    // 2. Gap Magnitude factor
    score += (gap.gapMagnitude * 10);

    // 3. Urgency / Grade factor
    // The closer to grade 12, the higher the urgency for unresolved gaps
    const yearsLeft = 12 - currentGrade; 
    if (yearsLeft === 0) {
      score *= 1.5; // High urgency in grade 12
    } else if (yearsLeft === 1) {
      score *= 1.2;
    } else {
      score *= 1.0; // Grade 10 or below
    }

    return score;
  }

  private getPriorityLevel(score: number): PriorityLevel {
    if (score >= 120) return 'critical';
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }
}
