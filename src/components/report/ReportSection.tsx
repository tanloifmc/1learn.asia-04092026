import React from 'react';

interface ReportSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ReportSection({ title, description, children, className = '' }: ReportSectionProps) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      {(title || description) && (
        <div className="flex flex-col gap-2">
          {title && <h2 className="text-2xl font-serif font-bold text-[#0E1B3D]">{title}</h2>}
          {description && <p className="text-gray-600 leading-relaxed">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
