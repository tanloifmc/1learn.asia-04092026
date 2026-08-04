"use client";

import { useEffect, useState } from "react";

type SupportRequest = { id: string; subject: string; message: string; status: string; created_at: string; profiles: { display_name: string | null } | null };
const statuses = ["new", "read", "responded", "closed", "spam"];

export function SupportRequestOverview() {
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/support-requests").then(async (response) => {
      if (!response.ok) throw new Error();
      setRequests((await response.json()).requests);
    }).catch(() => setMessage("Khong the tai yeu cau ho tro."));
  }, []);

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/support-requests/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { setMessage("Khong the cap nhat trang thai."); return; }
    setRequests((current) => current?.map((request) => request.id === id ? { ...request, status } : request) ?? null);
  }

  return <section className="stack">{message ? <p role="alert">{message}</p> : null}{requests?.length ? requests.map((request) => <article className="list-item stack" key={request.id}><div><h2>{request.subject}</h2><p>{request.profiles?.display_name || "Nguoi dung"} | {request.status}</p></div><p>{request.message}</p><label>Trang thai<select aria-label={`Trang thai ${request.subject}`} defaultValue={request.status} onChange={(event) => updateStatus(request.id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></article>) : requests ? <p>Chua co yeu cau ho tro.</p> : <p>Dang tai yeu cau ho tro.</p>}</section>;
}
