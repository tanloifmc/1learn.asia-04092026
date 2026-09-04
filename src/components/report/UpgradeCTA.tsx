import React from 'react';
import { ArrowRight } from 'lucide-react';

interface UpgradeCTAProps {
  onClick?: () => void;
}

export function UpgradeCTA({ onClick }: UpgradeCTAProps) {
  return (
    <button 
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0E1B3D] text-white rounded-xl font-bold hover:bg-opacity-90 transition-all hover:-translate-y-0.5 uppercase tracking-wide shadow-lg shadow-blue-900/20"
    >
      Khám phá hồ sơ chuyên sâu
      <ArrowRight className="w-5 h-5" />
    </button>
  );
}
