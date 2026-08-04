import { StaticPageManager } from "@/components/admin/static-page-manager";
import { requireContentManager } from "@/lib/auth/authorization";
export default async function PagesPage() { await requireContentManager(); return <main className="stack"><p className="eyebrow">CMS</p><h1>Trang tinh</h1><StaticPageManager /></main>; }
