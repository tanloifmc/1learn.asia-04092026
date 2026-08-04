"use client";

import { useState } from "react";

export function ImageUpload({ kind, label, onUploaded }: { kind: "avatar" | "organization" | "content"; label: string; onUploaded?: (url: string) => void }) {
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
    const result = await response.json().catch(() => null);
    setIsUploading(false);
    if (response.ok && result?.url) {
      onUploaded?.(result.url);
      setMessage(kind === "content" ? "Da tai anh len va gan vao URL anh bia." : "Da tai anh len. Tai lai trang de xem anh moi.");
      return;
    }
    setMessage("Khong the tai anh. Chi nhan JPEG, PNG, WebP toi da 5 MB.");
  }
  return <section className="panel stack"><h2>{label}</h2><label>Chon anh<input accept="image/jpeg,image/png,image/webp" disabled={isUploading} onChange={(event) => upload(event.target.files?.[0])} type="file" /></label>{message ? <p role="status">{message}</p> : null}</section>;
}
