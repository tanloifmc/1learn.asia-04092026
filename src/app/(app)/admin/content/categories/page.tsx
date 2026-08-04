import { CategoryManager } from "@/components/admin/category-manager";
import { requireContentManager } from "@/lib/auth/authorization";
export default async function CategoriesPage() { await requireContentManager(); return <main className="stack"><p className="eyebrow">CMS</p><h1>Danh muc</h1><CategoryManager /></main>; }
