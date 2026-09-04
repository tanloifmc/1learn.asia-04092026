'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentAccount } from '@/features/account/current-account';
import { revalidatePath } from 'next/cache';

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
  const supabase = await createClient();
  const account = await getCurrentAccount();
  
  if (!account) return { error: 'Unauthorized' };

  if (isCompleted) {
    await supabase.from('task_completions').insert({
      student_id: account.userId,
      task_id: taskId,
      completion_type: 'self_reported'
    });
  } else {
    await supabase
      .from('task_completions')
      .delete()
      .eq('student_id', account.userId)
      .eq('task_id', taskId);
  }

  revalidatePath('/journey');
  revalidatePath('/dashboard'); // Progress affects dashboard as well
}
