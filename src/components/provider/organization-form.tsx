"use client";

import { useEffect, useState } from "react";

type Organization = { name: string; slug: string; description: string | null; contact_email: string | null; contact_phone: string | null; website_url: string | null; status: string };

export function OrganizationForm() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/provider/organization").then(async (response) => {
      if (response.ok) setOrganization((await response.json()).organization);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  async function saveOrganization(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const body = {
      name: formData.get("name"), slug: formData.get("slug"), description: formData.get("description") || null,
      contactEmail: formData.get("contactEmail") || null, contactPhone: formData.get("contactPhone") || null,
      websiteUrl: formData.get("websiteUrl") || null,
    };
    const response = await fetch("/api/provider/organization", { method: organization ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (!response.ok) {
      setMessage("Khong the luu ho so. Kiem tra slug, email va website.");
      return;
    }
    const nextOrganization = (await response.json()).organization as Organization;
    setOrganization(nextOrganization);
    setMessage("Da luu ho so nha cung cap.");
  }

  async function submitForReview() {
    const response = await fetch("/api/provider/submit-for-review", { method: "POST" });
    setMessage(response.ok ? "Ho so da gui de duyet." : "Chua the gui duyet. Hay luu ho so truoc.");
    if (response.ok && organization) setOrganization({ ...organization, status: "pending_review" });
  }

  if (isLoading) return <p>Dang tai ho so nha cung cap.</p>;
  return (
    <section className="stack">
      <form action={saveOrganization} className="form-stack panel">
        <h2>{organization ? "Ho so doanh nghiep" : "Tao ho so doanh nghiep"}</h2>
        <label>Ten doanh nghiep<input name="name" required defaultValue={organization?.name ?? ""} /></label>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={organization?.slug ?? ""} /></label>
        <label>Mo ta<textarea name="description" rows={5} defaultValue={organization?.description ?? ""} /></label>
        <label>Email lien he<input name="contactEmail" type="email" defaultValue={organization?.contact_email ?? ""} /></label>
        <label>So dien thoai<input name="contactPhone" defaultValue={organization?.contact_phone ?? ""} /></label>
        <label>Website<input name="websiteUrl" type="url" defaultValue={organization?.website_url ?? ""} /></label>
        <button className="button button--primary" disabled={isSaving} type="submit">{isSaving ? "Dang luu" : "Luu ho so"}</button>
      </form>
      {organization ? <section className="panel stack"><p>Trang thai: <strong>{organization.status}</strong></p><button className="button" disabled={organization.status !== "draft"} onClick={submitForReview} type="button">Gui duyet</button></section> : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
