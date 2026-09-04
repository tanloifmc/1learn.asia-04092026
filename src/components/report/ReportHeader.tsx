import React from 'react';

interface ReportHeaderProps {
  title: string;
  generatedAt: string;
  description?: string;
}

export function ReportHeader({ title, generatedAt, description }: ReportHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#0E1B3D] mb-4">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-gray-600 mb-2 max-w-2xl mx-auto">
          {description}
        </p>
      )}
      <p className="text-sm text-gray-500 font-medium">
        Ngày hoàn thành: {new Date(generatedAt).toLocaleDateString('vi-VN')}
      </p>
    </div>
  );
}
