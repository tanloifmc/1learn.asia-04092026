"use client";

import { useEffect, useState } from "react";

type Plan = { id: string; code: string; name: string; description: string | null; price_vnd: number; duration_days: number };
type PaymentInstructions = { accountNumber: string | null; bankCode: string | null; transferContent: string };
type PaymentIntent = { id: string; amount_vnd: number; payment_reference: string; expires_at: string; status: string };
type Subscription = { starts_at: string; ends_at: string; is_active: boolean; membership_plans: { name: string; code: string } | null };

export function MembershipPlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans").then(async (response) => { if (!response.ok) throw new Error("Unable to load"); setPlans((await response.json()).plans); }).catch(() => setMessage("Khong the tai danh sach goi."));
    fetch("/api/billing/subscription").then(async (response) => { if (response.status === 401) { setSubscription(null); return; } if (!response.ok) throw new Error("Unable to load subscription"); setSubscription((await response.json()).subscription); }).catch(() => setSubscription(null));
  }, []);

  async function selectPlan(planId: string) {
    setInstructions(null);
    setPaymentIntent(null);
    setMessage(null);
    const response = await fetch("/api/billing/payment-intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId }) });
    if (!response.ok) {
      setMessage(response.status === 401 ? "Hay dang nhap truoc khi chon goi." : "Khong the tao ma thanh toan. Hay thu lai.");
      return;
    }
    const result = await response.json();
    setInstructions(result.instructions);
    setPaymentIntent(result.paymentIntent);
    setMessage(`Da tao yeu cau thanh toan ${result.paymentIntent.amount_vnd.toLocaleString("vi-VN")} VND.`);
  }

  return <section className="stack">{subscription?.is_active ? <section className="panel stack"><h2>Thanh vien hien tai</h2><p><strong>{subscription.membership_plans?.name ?? "Goi thanh vien"}</strong></p><p>Hieu luc den: {new Date(subscription.ends_at).toLocaleDateString("vi-VN")}</p></section> : null}{message ? <p role="status">{message}</p> : null}{plans?.length ? <div className="admin-grid">{plans.map((plan) => <article className="list-item stack" key={plan.id}><h2>{plan.name}</h2><p>{plan.description}</p><p><strong>{plan.price_vnd.toLocaleString("vi-VN")} VND</strong> / {plan.duration_days} ngay</p><button className="button button--primary" onClick={() => selectPlan(plan.id)} type="button">Chon goi</button></article>)}</div> : plans ? <p>Chua co goi thanh vien dang hoat dong.</p> : <p>Dang tai goi thanh vien.</p>}{instructions && paymentIntent ? <section className="panel stack"><h2>Thong tin chuyen khoan</h2><p>So tien: <strong>{paymentIntent.amount_vnd.toLocaleString("vi-VN")} VND</strong></p><p>Ngan hang: {instructions.bankCode ?? "Chua cau hinh"}</p><p>So tai khoan: {instructions.accountNumber ?? "Chua cau hinh"}</p><p>Noi dung: <strong>{instructions.transferContent}</strong></p><p>Hieu luc den: {new Date(paymentIntent.expires_at).toLocaleString("vi-VN")}</p></section> : null}</section>;
}
