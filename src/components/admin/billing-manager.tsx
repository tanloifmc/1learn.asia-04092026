"use client";

import { useCallback, useEffect, useState } from "react";

type Plan = { id: string; code: string; name: string; description: string | null; price_amount: number; currency: string; duration_days: number; is_active: boolean };
type User = { id: string; display_name: string | null };
type Subscription = { id: string; user_id: string; starts_at: string; ends_at: string; is_active: boolean; membership_plans: { name: string; code: string } | null };

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function BillingManager() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plansResponse, usersResponse, subscriptionsResponse] = await Promise.all([fetch("/api/admin/billing/plans"), fetch("/api/admin/users"), fetch("/api/admin/billing/subscriptions")]);
      if (!plansResponse.ok || !usersResponse.ok || !subscriptionsResponse.ok) throw new Error("load");
      const [plansData, usersData, subscriptionsData] = await Promise.all([plansResponse.json(), usersResponse.json(), subscriptionsResponse.json()]);
      setPlans(plansData.plans);
      setUsers(usersData.users);
      setSubscriptions(subscriptionsData.subscriptions);
    } catch {
      setMessage("Khong the tai du lieu membership.");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  async function savePlan(formData: FormData) {
    const response = await fetch(editing ? `/api/admin/billing/plans/${editing.id}` : "/api/admin/billing/plans", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: formData.get("code"), name: formData.get("name"), description: formData.get("description") || null, priceAmount: Number(formData.get("priceAmount")), currency: formData.get("currency"), durationDays: Number(formData.get("durationDays")), isActive: formData.get("isActive") === "on" }) });
    setMessage(response.ok ? "Da luu goi thanh vien." : "Khong the luu goi thanh vien.");
    if (response.ok) { setEditing(null); await loadData(); }
  }

  async function activateSubscription(formData: FormData) {
    const response = await fetch("/api/admin/billing/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: formData.get("userId"), planId: formData.get("planId") }) });
    setMessage(response.ok ? "Da cap hoac gia han membership." : "Khong the cap membership.");
    if (response.ok) await loadData();
  }

  async function setSubscriptionState(id: string, isActive: boolean) {
    const response = await fetch(`/api/admin/billing/subscriptions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    setMessage(response.ok ? "Da cap nhat membership." : "Khong the cap nhat membership.");
    if (response.ok) await loadData();
  }

  async function deletePlan(id: string) {
    if (!window.confirm("Xoa goi thanh vien nay? Gói da co membership se khong the xoa.")) return;
    const response = await fetch(`/api/admin/billing/plans/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Da xoa goi thanh vien." : "Khong the xoa goi da co membership hoac khong ton tai.");
    if (response.ok) await loadData();
  }

  return <section className="stack"><form action={savePlan} className="form-stack panel"><h2>{editing ? "Sua goi thanh vien" : "Tao goi thanh vien"}</h2><label>Code<input defaultValue={editing?.code ?? ""} name="code" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Ten goi<input defaultValue={editing?.name ?? ""} name="name" required /></label><label>Mo ta<textarea defaultValue={editing?.description ?? ""} name="description" rows={3} /></label><label>Gia<input defaultValue={editing?.price_amount ?? ""} min="1" name="priceAmount" required type="number" /></label><label>Ma tien te<input defaultValue={editing?.currency ?? "VND"} maxLength={3} name="currency" pattern="[A-Za-z]{3}" required /></label><label>So ngay<input defaultValue={editing?.duration_days ?? ""} min="1" name="durationDays" required type="number" /></label><label className="inline-field"><input defaultChecked={editing?.is_active ?? true} name="isActive" type="checkbox" />Dang hoat dong</label><div className="button-row"><button className="button button--primary" type="submit">Luu goi</button>{editing ? <button className="button" onClick={() => setEditing(null)} type="button">Huy</button> : null}</div></form>{message ? <p role="status">{message}</p> : null}<section className="stack"><h2>Cap membership</h2><form action={activateSubscription} className="form-stack panel"><label>Nguoi dung<select name="userId" required>{users?.map((user) => <option key={user.id} value={user.id}>{user.display_name || user.id}</option>)}</select></label><label>Goi thanh vien<select name="planId" required>{plans?.filter((plan) => plan.is_active).map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><button className="button button--primary" disabled={!users?.length || !plans?.some((plan) => plan.is_active)} type="submit">Cap hoac gia han</button></form></section><section className="stack"><h2>Goi thanh vien</h2>{plans?.map((plan) => <article className="list-item" key={plan.id}><h2>{plan.name}</h2><p>{formatMoney(plan.price_amount, plan.currency)} | {plan.duration_days} ngay | {plan.is_active ? "Hoat dong" : "Tam dung"}</p><div className="button-row"><button className="button" onClick={() => setEditing(plan)} type="button">Sua</button><button className="button" onClick={() => deletePlan(plan.id)} type="button">Xoa goi</button></div></article>)}</section><section className="stack"><h2>Membership hien tai</h2>{subscriptions?.map((subscription) => <article className="list-item" key={subscription.id}><h2>{subscription.membership_plans?.name ?? "Goi thanh vien"}</h2><p>{subscription.user_id}</p><p>{new Date(subscription.starts_at).toLocaleDateString("vi-VN")} den {new Date(subscription.ends_at).toLocaleDateString("vi-VN")} | {subscription.is_active ? "Hoat dong" : "Da dung"}</p><button className="button" onClick={() => setSubscriptionState(subscription.id, !subscription.is_active)} type="button">{subscription.is_active ? "Dung" : "Kich hoat lai"}</button></article>)}</section></section>;
}
