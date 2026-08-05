"use client";

import { useEffect, useState } from "react";

type ManagedRole = "editor" | "admin";
type User = { id: string; display_name: string | null; phone: string | null; created_at: string; user_roles: { role: string }[] | null };

export function UserManagement({ currentUserId, canManageAdministrators }: { currentUserId: string; canManageAdministrators: boolean }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        setUsers((await response.json()).users);
      })
      .catch(() => setMessage("Khong the tai danh sach nguoi dung."));
  }, []);

  async function setRole(userId: string, role: ManagedRole, action: "add" | "remove") {
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, action }),
    });
    if (!response.ok) {
      setMessage("Khong the cap nhat quyen. Kiem tra quyen admin cua ban.");
      return;
    }
    setUsers((current) => current?.map((user) => user.id === userId ? {
      ...user,
      user_roles: action === "add"
        ? [...(user.user_roles ?? []), { role }]
        : (user.user_roles ?? []).filter((entry) => entry.role !== role),
    } : user) ?? null);
    setMessage(action === "add" ? `Da cap quyen ${role}.` : `Da thu hoi quyen ${role}.`);
  }

  return (
    <section className="stack">
      {message ? <p role="status">{message}</p> : null}
      {users?.length ? users.map((user) => {
        const roles = user.user_roles?.map(({ role }) => role) ?? [];
        const isEditor = roles.includes("editor");
        const isAdministrator = roles.includes("admin");
        const isProtectedSuperAdmin = roles.includes("super_admin");
        const canManageThisAdministrator = canManageAdministrators && user.id !== currentUserId && !isProtectedSuperAdmin;
        return (
          <article className="list-item stack" key={user.id}>
            <h2>{user.display_name || "Chua dat ten"}</h2>
            <p>Vai tro: {roles.join(", ") || "user"}</p>
            <div className="button-row">
              <button className="button" onClick={() => setRole(user.id, "editor", isEditor ? "remove" : "add")} type="button">
                {isEditor ? "Thu hoi editor" : "Cap editor"}
              </button>
              {canManageThisAdministrator ? (
                <button className="button" onClick={() => setRole(user.id, "admin", isAdministrator ? "remove" : "add")} type="button">
                  {isAdministrator ? "Thu hoi admin" : "Cap admin"}
                </button>
              ) : null}
            </div>
          </article>
        );
      }) : users ? <p>Chua co nguoi dung.</p> : <p>Dang tai nguoi dung.</p>}
    </section>
  );
}
