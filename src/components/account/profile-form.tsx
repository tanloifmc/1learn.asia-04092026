"use client";

import { FormEvent, useState } from "react";

type ProfileFormProps = {
  displayName: string;
  phone: string;
  locale: string;
  timezone: string;
};

export function ProfileForm({ displayName, phone, locale, timezone }: ProfileFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: formData.get("displayName"),
        phone: formData.get("phone"),
        locale: formData.get("locale"),
        timezone: formData.get("timezone"),
      }),
    });

    setMessage(response.ok ? "Da cap nhat ho so." : "Khong the cap nhat ho so. Vui long thu lai.");
    setIsSubmitting(false);
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label>Ten hien thi<input name="displayName" defaultValue={displayName} required /></label>
      <label>So dien thoai<input name="phone" defaultValue={phone} /></label>
      <label>Ngon ngu<input name="locale" defaultValue={locale} required /></label>
      <label>Mui gio<input name="timezone" defaultValue={timezone} required /></label>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dang luu..." : "Luu thay doi"}</button>
    </form>
  );
}
