"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Plan = { id: string; code: string; name: string; description: string | null; price_amount: number; currency: string; duration_days: number };
type Subscription = { starts_at: string; ends_at: string; is_active: boolean; membership_plans: { name: string; code: string } | null };

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function MembershipPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans").then(async (response) => { if (!response.ok) throw new Error("Unable to load"); setPlans((await response.json()).plans); }).catch(() => setMessage("Khong the tai danh sach goi."));
    fetch("/api/billing/subscription").then(async (response) => { if (response.status === 401) { setSubscription(null); return; } if (!response.ok) throw new Error("Unable to load subscription"); setSubscription((await response.json()).subscription); }).catch(() => setSubscription(null));
  }, []);

  return <section className="stack">{subscription?.is_active ? <section className="panel stack"><h2>Thanh vien hien tai</h2><p><strong>{subscription.membership_plans?.name ?? "Goi thanh vien"}</strong></p><p>Hieu luc den: {new Date(subscription.ends_at).toLocaleDateString("vi-VN")}</p></section> : null}{message ? <p role="status">{message}</p> : null}{plans?.length ? <div className="admin-grid">{plans.map((plan) => <article className="list-item stack" key={plan.id}><h2>{plan.name}</h2><p>{plan.description}</p><p><strong>{formatMoney(plan.price_amount, plan.currency)}</strong> / {plan.duration_days} ngay</p><Link className="button button--primary" href="/contact">Lien he de kich hoat</Link></article>)}</div> : plans ? <p>Chua co goi thanh vien dang hoat dong.</p> : <p>Dang tai goi thanh vien.</p>}</section>;
}
