"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type Filters = { action: string; entityType: string };
const pageSize = 25;

export function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [filters, setFilters] = useState<Filters>({ action: "", entityType: "" });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ action: "", entityType: "" });
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilters: Filters, offset: number, append: boolean) => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset) });
    if (nextFilters.action) params.set("action", nextFilters.action);
    if (nextFilters.entityType) params.set("entityType", nextFilters.entityType);

    try {
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error("load");
      const data = await response.json() as { auditLogs: AuditLog[]; nextOffset: number | null };
      setLogs((current) => append ? [...(current ?? []), ...data.auditLogs] : data.auditLogs);
      setNextOffset(data.nextOffset);
    } catch {
      setError("Khong the tai nhat ky he thong.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => load({ action: "", entityType: "" }, 0, false));
  }, [load]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(filters);
    void load(filters, 0, false);
  }

  function resetFilters() {
    const emptyFilters = { action: "", entityType: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    void load(emptyFilters, 0, false);
  }

  return (
    <section className="stack">
      <form className="form-stack panel" onSubmit={applyFilters}>
        <h2>Loc nhat ky</h2>
        <label>Hanh dong<input onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))} placeholder="role.remove" value={filters.action} /></label>
        <label>Loai doi tuong<input onChange={(event) => setFilters((current) => ({ ...current, entityType: event.target.value }))} placeholder="user_role" value={filters.entityType} /></label>
        <div className="button-row">
          <button className="button button--primary" disabled={isLoading} type="submit">Loc</button>
          <button className="button" disabled={isLoading || (!filters.action && !filters.entityType)} onClick={resetFilters} type="button">Xoa loc</button>
        </div>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {logs?.length ? logs.map((log) => <article className="list-item" key={log.id}><h2>{log.action}</h2><p>{log.entity_type} | {log.entity_id ?? "-"} | {new Date(log.created_at).toLocaleString("vi-VN")}</p><pre>{JSON.stringify(log.metadata ?? {}, null, 2)}</pre></article>) : logs && !isLoading ? <p>Chua co nhat ky phu hop.</p> : <p>Dang tai nhat ky.</p>}
      {nextOffset !== null ? <button className="button" disabled={isLoading} onClick={() => void load(appliedFilters, nextOffset, true)} type="button">{isLoading ? "Dang tai..." : "Tai them"}</button> : null}
    </section>
  );
}
