import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export type TargetRequirement = Database['public']['Tables']['target_requirements']['Row'];

export class RequirementEngine {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseClient: ReturnType<typeof createClient<Database>>) {
    this.supabase = supabaseClient;
  }

  /**
   * Fetches all verified/published requirements for a specific target program or career.
   */
  async getVerifiedRequirements(targetType: 'university_major' | 'career', targetId: string): Promise<TargetRequirement[]> {
    const { data, error } = await this.supabase
      .from('target_requirements')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .in('status', ['verified', 'published'])
      .eq('is_production_eligible', true);

    if (error) {
      console.error("Error fetching target requirements:", error);
      throw new Error(`Failed to fetch requirements for ${targetType} ${targetId}`);
    }

    return data || [];
  }
}
