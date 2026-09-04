import React from 'react';
import Link from 'next/link';

export function StatusBadge({ status, label }: { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral', label: string }) {
  const styles = {
    success: { bg: '#D1FAE5', color: '#065F46' },
    warning: { bg: '#FEF3C7', color: '#92400E' },
    danger:  { bg: '#FEE2E2', color: '#991B1B' },
    info:    { bg: '#DBEAFE', color: '#1E40AF' },
    neutral: { bg: 'var(--surface-alt)', color: 'var(--text-secondary)' },
  };
  
  const current = styles[status] || styles.neutral;
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: current.bg, color: current.color }}
    >
      {label}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: string }) {
  const isHigh = level.toLowerCase() === 'high' || level.toLowerCase() === 'cao';
  return <StatusBadge status={isHigh ? 'success' : 'warning'} label={`Độ tin cậy: ${isHigh ? 'Cao' : 'Trung bình'}`} />;
}

export function MatchScore({ score, label = "Phù hợp" }: { score: number, label?: string }) {
  return (
    <div 
      className="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap" 
      style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary-dark)' }}
    >
      {label}: {Math.round(score)}%
    </div>
  );
}

export function EmptyState({ title, description, actionText, actionHref }: { title: string, description: string, actionText?: string, actionHref?: string }) {
  return (
    <div className="border border-dashed border-neutral-300 p-8 text-center bg-white rounded-lg">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-500 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && actionHref && (
        <Link href={actionHref} className="btn btn--primary">
          {actionText}
        </Link>
      )}
    </div>
  );
}

export function LoadingState({ text = "Đang tải dữ liệu..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-neutral-500">
      <div className="w-8 h-8 border-4 border-primary-soft border-t-primary rounded-full animate-spin mb-4"></div>
      <p>{text}</p>
    </div>
  );
}
