"use client";

import { useEffect, useState } from "react";

type User = { id: string; display_name: string | null; phone: string | null; created_at: string; user_roles: { role: string }[] | null };

export function UserManagement() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/users").then(async (response) => { if (!response.ok) throw new Error("load"); setUsers((await response.json()).users); }).catch(() => setMessage("Khong the tai danh sach nguoi dung.")); }, []);
  async function setEditor(userId: string, action: "add" | "remove") {
    const response = await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "editor", action }) });
    if (!response.ok) { setMessage("Khong the cap nhat quyen. Kiem tra quyen admin cua ban."); return; }
    setUsers((current) => current?.map((user) => user.id === userId ? { ...user, user_roles: action === "add" ? [...(user.user_roles ?? []), { role: "editor" }] : (user.user_roles ?? []).filter((entry) => entry.role !== "editor") } : user) ?? null);
    setMessage(action === "add" ? "Da cap quyen editor." : "Da thu hoi quyen editor.");
  }
  return <section className="stack">{message ? <p role="status">{message}</p> : null}{users?.length ? users.map((user) => { const isEditor = user.user_roles?.some(({ role }) => role === "editor") ?? false; return <article className="list-item stack" key={user.id}><h2>{user.display_name || "Chua dat ten"}</h2><p>Vai tro: {user.user_roles?.map(({ role }) => role).join(", ") || "user"}</p><button className="button" onClick={() => setEditor(user.id, isEditor ? "remove" : "add")} type="button">{isEditor ? "Thu hoi editor" : "Cap editor"}</button></article>; }) : users ? <p>Chua co nguoi dung.</p> : <p>Dang tai nguoi dung.</p>}</section>;
}
