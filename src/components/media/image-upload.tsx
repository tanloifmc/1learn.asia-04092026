"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";

export function ImageUpload({ kind, label, onUploaded, defaultImageUrl }: { kind: "avatar" | "organization" | "content"; label: string; onUploaded?: (url: string) => void; defaultImageUrl?: string }) {
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(defaultImageUrl);

  async function upload(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    const result = await response.json().catch(() => null);
    setIsUploading(false);
    if (response.ok && result?.url) {
      setImageUrl(result.url);
      onUploaded?.(result.url);
      setMessage({ 
        text: "Đã tải ảnh lên thành công.", 
        type: "success" 
      });
      return;
    }
    setMessage({ 
      text: "Không thể tải ảnh. Chỉ nhận JPEG, PNG, WebP tối đa 5 MB.", 
      type: "error" 
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input 
          accept="image/jpeg,image/png,image/webp" 
          disabled={isUploading} 
          onChange={(event) => upload(event.target.files?.[0])} 
          type="file"
          id={`upload-${kind}`}
          className="hidden"
        />
        <label 
          htmlFor={`upload-${kind}`}
          className={`flex flex-col items-center justify-center w-full min-h-[8rem] h-auto border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden relative ${
            isUploading 
              ? "border-[#0E1B3D]/10 bg-[#0E1B3D]/5" 
              : "border-[#B89862]/30 bg-[#B89862]/5 hover:bg-[#B89862]/10 hover:border-[#B89862]/60"
          }`}
        >
          {imageUrl && !isUploading ? (
            <div className="absolute inset-0 w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Uploaded media" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <UploadCloud className="w-8 h-8 text-white mb-2" />
                <p className="text-sm font-bold text-white">Nhấn để thay đổi ảnh</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-[#B89862] animate-spin mb-3" />
              ) : (
                <UploadCloud className="w-8 h-8 text-[#B89862] mb-3" />
              )}
              <p className="text-sm font-bold text-[#0E1B3D] z-10">
                {isUploading ? "Đang tải ảnh lên..." : "Nhấn để chọn ảnh tải lên"}
              </p>
              <p className="text-xs text-[#0E1B3D]/50 mt-1 z-10">PNG, JPG, WebP (Tối đa 5MB)</p>
            </div>
          )}
        </label>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
