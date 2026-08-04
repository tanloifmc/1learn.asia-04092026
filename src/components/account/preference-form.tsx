"use client";

import { useEffect, useState } from "react";

export function PreferenceForm() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/account/preferences")
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        return response.json();
      })
      .then(({ preferences }) => {
        if (!active) return;
        setEmailNotifications(preferences.email_notifications);
        setProductUpdates(preferences.product_updates);
      })
      .catch(() => {
        if (active) setMessage("Khong the tai tuy chon.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function save() {
    const response = await fetch("/api/account/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailNotifications, productUpdates }),
    });
    setMessage(response.ok ? "Da luu tuy chon thong bao." : "Khong the luu tuy chon.");
  }

  return <section className="panel stack"><h2>Thong bao</h2><label className="inline-field"><input checked={emailNotifications} disabled={isLoading} onChange={(event) => setEmailNotifications(event.target.checked)} type="checkbox" />Email van hanh</label><label className="inline-field"><input checked={productUpdates} disabled={isLoading} onChange={(event) => setProductUpdates(event.target.checked)} type="checkbox" />Cap nhat san pham</label><button className="button button--primary" disabled={isLoading} onClick={save} type="button">Luu tuy chon</button>{message ? <p role="status">{message}</p> : null}</section>;
}
