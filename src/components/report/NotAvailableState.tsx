import React from 'react';
import { Lock } from 'lucide-react';

interface NotAvailableStateProps {
  title?: string;
  message?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export function NotAvailableState({ 
  title = "Coming Next", 
  message = "Phần khám phá nghề nghiệp sẽ kết nối hồ sơ của bạn với dữ liệu nghề nghiệp khi hệ thống hoàn tất.",
  ctaText = "Khám phá hồ sơ của bạn",
  onCtaClick
}: NotAvailableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
      <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">{message}</p>
      {onCtaClick && (
        <button 
          onClick={onCtaClick}
          className="px-6 py-3 bg-[#0E1B3D] text-white rounded-lg font-medium hover:bg-opacity-90 transition-opacity uppercase text-sm tracking-wide"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
}
