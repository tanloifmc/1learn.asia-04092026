"use client";

import { useEffect, useState } from "react";

type User = { id: string; display_name: string | null; phone: string | null; created_at: string; user_roles: { role: string }[] | null };

export function UserManagement() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { fetch("/api/admin/users").then(async (response) => { if (!response.ok) throw new Error("load"); setUsers((await response.json()).users); }).catch(() => setMessage("Khong the tai danh sach nguoi dung.")); }, []);
  async function addEditor(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}/role`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "editor", action: "add" }) });
    setMessage(response.ok ? "Da cap quyen editor. Tai lai trang de cap nhat danh sach." : "Khong the cap quyen. Kiem tra quyen admin cua ban.");
  }
  return <section className="stack">{message ? <p role="status">{message}</p> : null}{users?.length ? users.map((user) => <article className="list-item stack" key={user.id}><h2>{user.display_name || "Chua dat ten"}</h2><p>Vai tro: {user.user_roles?.map(({ role }) => role).join(", ") || "user"}</p><button className="button" onClick={() => addEditor(user.id)} type="button">Cap editor</button></article>) : users ? <p>Chua co nguoi dung.</p> : <p>Dang tai nguoi dung.</p>}</section>;
}
