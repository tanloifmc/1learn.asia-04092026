"use client";

import { useState } from "react";

export function SettingForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveSetting(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    let value: Record<string, unknown>;
    try {
      const parsed = JSON.parse(String(formData.get("value")));
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("invalid");
      value = parsed as Record<string, unknown>;
    } catch {
      setIsSaving(false);
      setMessage("Gia tri phai la JSON object hop le.");
      return;
    }

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: formData.get("key"), value, isPublic: formData.get("isPublic") === "on" }),
    });
    setIsSaving(false);
    setMessage(response.ok ? "Da luu cau hinh. Tai lai trang de xem du lieu moi." : "Khong the luu cau hinh. Kiem tra ten key va quyen tai khoan.");
  }

  return (
    <form action={saveSetting} className="form-stack panel">
      <h2>Them hoac cap nhat setting</h2>
      <label>Key<input name="key" required pattern="[a-z][a-z0-9_]*" maxLength={100} /></label>
      <label>Gia tri JSON<textarea name="value" required rows={6} defaultValue={'{\n  "value": ""\n}'} /></label>
      <label className="inline-field"><input name="isPublic" type="checkbox" />Cho phep doc cong khai</label>
      <button className="button button--primary" disabled={isSaving} type="submit">{isSaving ? "Dang luu" : "Luu cau hinh"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
