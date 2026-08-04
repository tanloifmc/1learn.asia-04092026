"use client";

import { useEffect, useState } from "react";

type SupportRequest = { id: string; subject: string; message: string; status: string; created_at: string };

export function SupportRequestForm() {
  const [requests, setRequests] = useState<SupportRequest[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetch("/api/support-requests").then(async (response) => {
      if (!response.ok) throw new Error();
      setRequests((await response.json()).requests);
    }).catch(() => setRequests([]));
  }, []);

  async function sendRequest(formData: FormData) {
    setIsSending(true);
    setMessage(null);
    const response = await fetch("/api/support-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: formData.get("subject"), message: formData.get("message") }),
    });
    setIsSending(false);
    if (!response.ok) {
      setMessage("Khong the gui yeu cau. Hay thu lai sau.");
      return;
    }
    const result = await response.json();
    setRequests((current) => [{ ...result.request, message: String(formData.get("message")), status: "new", created_at: new Date().toISOString() }, ...(current ?? [])]);
    setMessage("Da gui yeu cau ho tro. Quan tri vien da nhan thong bao.");
  }

  return <section className="stack"><form action={sendRequest} className="form-stack panel"><h2>Gui yeu cau ho tro</h2><label>Tieu de<input name="subject" required maxLength={200} /></label><label>Noi dung<textarea name="message" required rows={6} maxLength={5000} /></label><button className="button button--primary" disabled={isSending} type="submit">{isSending ? "Dang gui" : "Gui yeu cau"}</button>{message ? <p role="status">{message}</p> : null}</form><section className="stack" aria-label="Yeu cau da gui"><h2>Yeu cau cua ban</h2>{requests?.length ? requests.map((request) => <article className="list-item" key={request.id}><h3>{request.subject}</h3><p>{request.status}</p><p>{request.message}</p></article>) : requests ? <p>Chua co yeu cau ho tro.</p> : <p>Dang tai yeu cau.</p>}</section></section>;
}
