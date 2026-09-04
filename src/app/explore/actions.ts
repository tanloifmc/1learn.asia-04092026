'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleSavedItem(itemType: 'career' | 'major' | 'university', itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if it exists
  const { data: existing } = await supabase
    .from('student_saved_items')
    .select('id')
    .eq('student_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .single();

  if (existing) {
    // Unsave
    await supabase
      .from('student_saved_items')
      .delete()
      .eq('id', existing.id);
  } else {
    // Save
    await supabase
      .from('student_saved_items')
      .insert({
        student_id: user.id,
        item_type: itemType,
        item_id: itemId,
      });
  }

  revalidatePath('/explore');
  return { success: true };
}
