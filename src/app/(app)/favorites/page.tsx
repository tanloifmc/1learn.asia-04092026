import { redirect } from "next/navigation";
import { FavoriteList } from "@/components/favorites/favorite-list";
import { getAuthenticatedSession } from "@/lib/auth/server-session";

export default async function FavoritesPage() {
  const { supabase, userId } = await getAuthenticatedSession();
  if (!userId) redirect("/login");

  const { data } = await supabase
    .from("favorites")
    .select("id, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false });

  return <main><h1>Muc da luu</h1><FavoriteList initialFavorites={data ?? []} /></main>;
}
