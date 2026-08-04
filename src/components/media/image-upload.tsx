"use client";

import { useState } from "react";

export function ImageUpload({ kind, label }: { kind: "avatar" | "organization" | "content"; label: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    const response = await fetch("/api/media/upload", { method: "POST", body: formData });
    setIsUploading(false);
    setMessage(response.ok ? "Da tai anh len. Tai lai trang de xem anh moi." : "Khong the tai anh. Chi nhan JPEG, PNG, WebP toi da 5 MB.");
  }
  return <section className="panel stack"><h2>{label}</h2><label>Chon anh<input accept="image/jpeg,image/png,image/webp" disabled={isUploading} onChange={(event) => upload(event.target.files?.[0])} type="file" /></label>{message ? <p role="status">{message}</p> : null}</section>;
}
