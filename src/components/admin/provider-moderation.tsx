"use client";

import { useEffect, useState } from "react";

type Provider = { id: string; name: string; slug: string; status: string; contact_email: string | null };
export function ProviderModeration() {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/providers").then(async (response) => { if (!response.ok) throw new Error("load"); setProviders((await response.json()).providers); }).catch(() => setMessage("Khong the tai danh sach nha cung cap.")); }, []);
  async function setStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/providers/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setMessage(response.ok ? "Da cap nhat trang thai. Tai lai trang de xem du lieu moi." : "Khong the cap nhat trang thai.");
  }
  return <section className="stack">{message ? <p role="status">{message}</p> : null}{providers?.length ? providers.map((provider) => <article className="list-item stack" key={provider.id}><h2>{provider.name}</h2><p>{provider.slug} | {provider.status}</p><div className="button-row"><button className="button button--primary" onClick={() => setStatus(provider.id, "approved")} type="button">Duyet</button><button className="button" onClick={() => setStatus(provider.id, "rejected")} type="button">Tu choi</button><button className="button" onClick={() => setStatus(provider.id, "suspended")} type="button">Tam dung</button></div></article>) : providers ? <p>Chua co nha cung cap.</p> : <p>Dang tai nha cung cap.</p>}</section>;
}
