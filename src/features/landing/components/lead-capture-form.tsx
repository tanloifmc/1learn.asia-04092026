"use client";

import { useState } from "react";
import { captureLeadAction } from "../actions/capture-lead";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { StatusMessage } from "@/components/ui/status-message";

export function LeadCaptureForm({ source = "landing_hero" }: { source?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    formData.append("source", source);
    
    const result = await captureLeadAction(formData);
    
    if (result.success) {
      setStatus({ type: "success", message: result.message || "Thành công!" });
      (event.target as HTMLFormElement).reset();
    } else {
      setStatus({ type: "error", message: result.error || "Có lỗi xảy ra" });
    }
    
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-800 text-center">Đăng ký nhận thông tin sớm</h3>
      
      {status && (
        <StatusMessage tone={status.type}>{status.message}</StatusMessage>
      )}
      
      <FormField label="Họ và tên">
        <input name="fullName" required placeholder="Nguyễn Văn A" className="w-full border rounded p-2" />
      </FormField>
      <FormField label="Email">
        <input name="email" type="email" required placeholder="email@example.com" className="w-full border rounded p-2" />
      </FormField>
      
      <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
        {isSubmitting ? "Đang gửi..." : "Đăng ký ngay"}
      </Button>
    </form>
  );
}
