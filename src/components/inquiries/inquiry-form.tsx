"use client";

import { useState } from "react";

export function InquiryForm({ organizationId }: { organizationId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function sendInquiry(formData: FormData) {
    setIsSending(true);
    setMessage(null);
    const response = await fetch("/api/inquiries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, subject: formData.get("subject"), message: formData.get("message") }),
    });
    setIsSending(false);
    setMessage(response.ok ? "Da gui yeu cau. Nha cung cap se nhan thong bao." : "Khong the gui yeu cau. Hay dang nhap va thu lai.");
  }

  return <form action={sendInquiry} className="form-stack panel"><h2>Gui yeu cau</h2><label>Tieu de<input name="subject" required maxLength={180} /></label><label>Noi dung<textarea name="message" required rows={6} /></label><button className="button button--primary" disabled={isSending} type="submit">{isSending ? "Dang gui" : "Gui yeu cau"}</button>{message ? <p role="status">{message}</p> : null}</form>;
}
