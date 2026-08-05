"use client";

import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/media/image-upload";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Category = { id: string; name: string };
type Post = { id: string; category_id: string | null; title: string; slug: string; excerpt: string | null; body: string; cover_image_url: string | null; status: string; seo_title: string | null; seo_description: string | null };

export function PostManager() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [archivingPostId, setArchivingPostId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/content/posts").then(async (response) => { if (!response.ok) throw new Error(); setPosts((await response.json()).posts); }).catch(() => setMessage("Khong the tai bai viet."));
    fetch("/api/admin/content/categories").then(async (response) => { if (response.ok) setCategories((await response.json()).categories); });
  }, []);
  async function save(formData: FormData) {
    const categoryId = String(formData.get("categoryId") || "");
    const body = { title: formData.get("title"), slug: formData.get("slug"), excerpt: formData.get("excerpt") || null, body: formData.get("body"), categoryId: categoryId || null, coverImageUrl: coverImageUrl || null, status: formData.get("status"), seoTitle: formData.get("seoTitle") || null, seoDescription: formData.get("seoDescription") || null };
    const response = await fetch(editing ? `/api/admin/content/posts/${editing.id}` : "/api/admin/content/posts", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMessage(response.ok ? "Da luu bai viet. Tai lai trang de cap nhat danh sach." : "Khong the luu bai viet.");
    setEditing(null);
    setCoverImageUrl("");
  }
  async function archivePost(id: string) {
    const response = await fetch(`/api/admin/content/posts/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Da luu tru bai viet." : "Khong the luu tru bai viet.");
    if (response.ok) setPosts((current) => current?.map((post) => post.id === id ? { ...post, status: "archived" } : post) ?? null);
    setArchivingPostId(null);
  }
  return <section className="stack"><form action={save} className="form-stack panel"><h2>{editing ? "Sua bai viet" : "Tao bai viet"}</h2><label>Tieu de<input defaultValue={editing?.title ?? ""} name="title" required /></label><label>Slug<input defaultValue={editing?.slug ?? ""} name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Danh muc<select defaultValue={editing?.category_id ?? ""} name="categoryId"><option value="">Khong phan loai</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Tom tat<textarea defaultValue={editing?.excerpt ?? ""} name="excerpt" rows={3} /></label><label>URL anh bia<input name="coverImageUrl" onChange={(event) => setCoverImageUrl(event.target.value)} type="url" value={coverImageUrl} /></label><label>Noi dung<textarea defaultValue={editing?.body ?? ""} name="body" required rows={10} /></label><label>SEO title<input defaultValue={editing?.seo_title ?? ""} name="seoTitle" /></label><label>SEO description<textarea defaultValue={editing?.seo_description ?? ""} name="seoDescription" rows={3} /></label><label>Trang thai<select defaultValue={editing?.status ?? "draft"} name="status"><option value="draft">Ban nhap</option><option value="published">Xuat ban</option></select></label><div className="button-row"><button className="button button--primary" type="submit">Luu bai viet</button>{editing ? <button className="button" onClick={() => { setEditing(null); setCoverImageUrl(""); }} type="button">Huy</button> : null}</div></form><ImageUpload kind="content" label="Tai anh CMS" onUploaded={setCoverImageUrl} />{message ? <p role="status">{message}</p> : null}{posts?.map((post) => <article className="list-item" key={post.id}><h2>{post.title}</h2><p>{post.slug} | {post.status}</p><div className="button-row"><button className="button" onClick={() => { setEditing(post); setCoverImageUrl(post.cover_image_url ?? ""); }} type="button">Sua</button>{post.status !== "archived" ? <button className="button" onClick={() => setArchivingPostId(post.id)} type="button">Luu tru</button> : null}</div></article>)}<ConfirmDialog confirmLabel="Xac nhan luu tru" description="Bai viet se khong con cong khai." onCancel={() => setArchivingPostId(null)} onConfirm={() => archivingPostId ? archivePost(archivingPostId) : undefined} open={Boolean(archivingPostId)} title="Luu tru bai viet?" /></section>;
}
