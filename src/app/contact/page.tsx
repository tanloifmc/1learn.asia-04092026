import Link from "next/link";
import { SupportRequestForm } from "@/components/support/support-request-form";
import { getCurrentAccount } from "@/lib/auth/current-account";

export default async function ContactPage() {
  const account = await getCurrentAccount();
  return <main className="stack"><p className="eyebrow">Ho tro</p><h1>Lien he</h1>{account ? <SupportRequestForm /> : <section className="panel stack"><p>Dang nhap de gui va theo doi yeu cau ho tro cua ban.</p><Link className="button button--primary" href="/login?next=/contact">Dang nhap</Link></section>}</main>;
}
