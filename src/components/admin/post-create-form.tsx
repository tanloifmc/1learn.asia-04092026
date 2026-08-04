"use client";

import { useState } from "react";

export function PostCreateForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function createPost(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const response = await fetch("/api/admin/content/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"), slug: formData.get("slug"), excerpt: formData.get("excerpt") || null,
        body: formData.get("body"), status: formData.get("status"),
      }),
    });
    setIsSaving(false);
    setMessage(response.ok ? "Da luu bai viet. Tai lai trang de xem danh sach moi." : "Khong the luu bai viet. Kiem tra truong bat buoc va slug.");
  }

  return (
    <form action={createPost} className="form-stack panel">
      <h2>Tao bai viet</h2>
      <label>Tieu de<input name="title" required maxLength={180} /></label>
      <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={180} /></label>
      <label>Tom tat<textarea name="excerpt" maxLength={500} rows={3} /></label>
      <label>Noi dung<textarea name="body" required rows={8} /></label>
      <label>Trang thai<select name="status" defaultValue="draft"><option value="draft">Ban nhap</option><option value="published">Xuat ban</option></select></label>
      <button className="button button--primary" disabled={isSaving} type="submit">{isSaving ? "Dang luu" : "Luu bai viet"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
