"use client";

import { useEffect, useState } from "react";

type Inquiry = { id: string; subject: string; message: string; status: string; created_at: string };

export default function ProviderInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/provider/inquiries").then(async (response) => { if (!response.ok) throw new Error("Unable to load"); setInquiries((await response.json()).inquiries); }).catch(() => setError("Khong the tai yeu cau. Kiem tra quyen provider va cau hinh server.")); }, []);
  async function updateStatus(id: string, status: string) { const response = await fetch(`/api/provider/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (!response.ok) { setError("Khong the cap nhat trang thai."); return; } setInquiries((current) => current?.map((inquiry) => inquiry.id === id ? { ...inquiry, status } : inquiry) ?? null); }
  return <main className="stack"><p className="eyebrow">Nha cung cap</p><h1>Yeu cau nhan duoc</h1>{error ? <p role="alert">{error}</p> : null}{inquiries?.length ? inquiries.map((inquiry) => <article className="list-item stack" key={inquiry.id}><h2>{inquiry.subject}</h2><p>{inquiry.message}</p><p>Trang thai: {inquiry.status}</p><div className="button-row"><button className="button" onClick={() => updateStatus(inquiry.id, "read")} type="button">Da doc</button><button className="button" onClick={() => updateStatus(inquiry.id, "responded")} type="button">Da phan hoi</button><button className="button" onClick={() => updateStatus(inquiry.id, "closed")} type="button">Dong</button></div></article>) : inquiries ? <p>Chua co yeu cau.</p> : <p>Dang tai yeu cau.</p>}</main>;
}
