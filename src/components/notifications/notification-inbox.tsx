"use client";

import { useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationInbox({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  async function markRead(id: string) {
    const response = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (response.ok) {
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    }
  }

  async function markAllRead() {
    const response = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (response.ok) {
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    }
  }

  return (
    <section className="stack">
      <button type="button" onClick={markAllRead} disabled={!notifications.some((item) => !item.read_at)}>Danh dau tat ca da doc</button>
      {notifications.length === 0 ? <p>Chua co thong bao.</p> : notifications.map((item) => (
        <article className="list-item" key={item.id}>
          <h2>{item.title}</h2>
          {item.body ? <p>{item.body}</p> : null}
          {!item.read_at ? <button type="button" onClick={() => markRead(item.id)}>Danh dau da doc</button> : <p>Da doc</p>}
        </article>
      ))}
    </section>
  );
}
