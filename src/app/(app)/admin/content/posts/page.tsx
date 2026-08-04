import Link from "next/link";
import { requireContentManager } from "@/lib/auth/authorization";
import { PostManager } from "@/components/admin/post-manager";

export default async function AdminPostsPage() {
  await requireContentManager();
  return (
    <main className="stack">
      <p className="eyebrow">CMS</p>
      <h1>Bai viet</h1>
      <Link className="button button--primary" href="/blog">Xem blog cong khai</Link>
      <PostManager />
    </main>
  );
}
