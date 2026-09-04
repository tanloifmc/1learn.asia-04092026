import React from 'react';

type BaseCardProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Surface({ children, className = '', style }: BaseCardProps) {
  return (
    <div className={`p-6 rounded-lg bg-surface border border-border ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Card({ children, className = '', style }: BaseCardProps) {
  return (
    <div className={`p-6 rounded-lg bg-surface border border-border shadow-sm ${className}`} style={style}>
      {children}
    </div>
  );
}

export function ElevatedCard({ children, className = '', style }: BaseCardProps) {
  return (
    <div className={`p-6 rounded-xl bg-surface border border-border shadow-md ${className}`} style={style}>
      {children}
    </div>
  );
}

export function InsightCard({ title, children, className = '' }: { title: string } & BaseCardProps) {
  return (
    <div className={`p-5 rounded-lg border-l-4 bg-primary-soft border-primary ${className}`}>
      <h3 className="font-semibold text-lg mb-2 text-primary-dark">{title}</h3>
      <div className="text-sm text-text-secondary">
        {children}
      </div>
    </div>
  );
}

export function MetricCard({ title, value, meaning, action }: { title: string, value: string | React.ReactNode, meaning: string, action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="text-3xl font-bold text-primary leading-none">{value}</div>
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      <div className="text-sm text-text-secondary leading-relaxed">{meaning}</div>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
