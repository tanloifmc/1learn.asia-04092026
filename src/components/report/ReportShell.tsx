import React from 'react';

interface ReportShellProps {
  children: React.ReactNode;
}

export function ReportShell({ children }: ReportShellProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-24 space-y-12">
        {children}
      </main>
    </div>
  );
}
