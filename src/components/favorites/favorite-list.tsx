"use client";

import { useState } from "react";

type Favorite = { id: string; entity_type: string; entity_id: string; created_at: string };

export function FavoriteList({ initialFavorites }: { initialFavorites: Favorite[] }) {
  const [favorites, setFavorites] = useState(initialFavorites);

  async function removeFavorite(id: string) {
    const response = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    if (response.ok) {
      setFavorites((items) => items.filter((item) => item.id !== id));
    }
  }

  if (favorites.length === 0) {
    return <p>Chua co muc da luu.</p>;
  }

  return (
    <section className="stack">
      {favorites.map((item) => (
        <article className="list-item" key={item.id}>
          <h2>{item.entity_type}</h2>
          <p>{item.entity_id}</p>
          <button type="button" onClick={() => removeFavorite(item.id)}>Bo luu</button>
        </article>
      ))}
    </section>
  );
}
