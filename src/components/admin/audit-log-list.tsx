"use client";

import { useEffect, useState } from "react";

type AuditLog = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string; metadata: Record<string, unknown> | null };
export function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/audit-logs").then(async (response) => { if (!response.ok) throw new Error("load"); setLogs((await response.json()).auditLogs); }).catch(() => setError("Khong the tai nhat ky he thong.")); }, []);
  return <section className="stack">{error ? <p role="alert">{error}</p> : null}{logs?.length ? logs.map((log) => <article className="list-item" key={log.id}><h2>{log.action}</h2><p>{log.entity_type} | {log.entity_id ?? "-"} | {new Date(log.created_at).toLocaleString("vi-VN")}</p><pre>{JSON.stringify(log.metadata ?? {}, null, 2)}</pre></article>) : logs ? <p>Chua co nhat ky.</p> : <p>Dang tai nhat ky.</p>}</section>;
}
