'use client';

import { useTransition } from 'react';
import { toggleTaskCompletion } from '../actions';
import { Check } from 'lucide-react';

interface TaskCheckboxProps {
  taskId: string;
  isCompleted: boolean;
}

export function TaskCheckbox({ taskId, isCompleted }: TaskCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTaskCompletion(taskId, !isCompleted);
    });
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
        isCompleted 
          ? 'bg-primary border-primary text-white' 
          : 'bg-white border-neutral-300 text-transparent hover:border-primary'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Check strokeWidth={3} className="w-4 h-4" />
    </button>
  );
}
