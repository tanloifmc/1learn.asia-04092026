import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GlobalValidity } from '@/types/report';

export function ValidityBanner({ validity }: { validity: GlobalValidity }) {
  if (validity !== 'QUESTIONABLE') return null;
  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
            Lưu ý về độ tin cậy
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Một số tín hiệu cho thấy kết quả có thể chưa hoàn toàn ổn định. Bạn vẫn có thể tham khảo báo cáo này như một góc nhìn khám phá bản thân.
          </p>
        </div>
      </div>
    </div>
  );
}
