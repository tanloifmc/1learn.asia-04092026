import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/features/account/current-account";
import { createClient } from "@/lib/supabase/server";

export default async function SentInquiriesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const supabase = await createClient();
  const { data: inquiries } = await supabase.from("inquiries").select("id, subject, message, status, created_at, organizations(name, slug)").eq("sender_user_id", account.userId).order("created_at", { ascending: false });
  return <main className="stack"><p className="eyebrow">Yeu cau</p><h1>Yeu cau da gui</h1>{inquiries?.length ? inquiries.map((inquiry) => <article className="list-item" key={inquiry.id}><h2>{inquiry.subject}</h2><p>{inquiry.message}</p><p>Trang thai: {inquiry.status}</p></article>) : <p>Ban chua gui yeu cau nao.</p>}</main>;
}
