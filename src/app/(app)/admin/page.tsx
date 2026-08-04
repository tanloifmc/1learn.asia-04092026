import Link from "next/link";
import { requireContentManager } from "@/lib/auth/authorization";

export default async function AdminPage() {
  const account = await requireContentManager();
  const isAdministrator = account.roles.some((role) => role === "admin" || role === "super_admin");

  return (
    <main className="stack">
      <p className="eyebrow">Dieu hanh ung dung</p>
      <h1>Quan tri</h1>
      <p>Ban dang dang nhap voi quyen: {account.roles.join(", ")}.</p>
      <section className="admin-grid" aria-label="Chuc nang quan tri">
        <Link className="list-item" href="/admin/content/posts"><h2>Quan ly bai viet</h2><p>Tao, xuat ban va luu tru noi dung.</p></Link>
        {isAdministrator ? <Link className="list-item" href="/admin/settings"><h2>Cau hinh ung dung</h2><p>Quan ly du lieu thuong hieu va cau hinh cong khai.</p></Link> : null}
      </section>
    </main>
  );
}
