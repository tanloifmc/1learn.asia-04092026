"use client";

import { useEffect, useState } from "react";

type LinkItem = { label: string; href: string };
type Settings = Record<string, unknown>;

const defaults = {
  branding: { appName: "Core Platform" },
  header_navigation: [{ label: "Trang chu", href: "/" }, { label: "Blog", href: "/blog" }],
  footer_navigation: [{ label: "Lien he", href: "/contact" }, { label: "Quyen rieng tu", href: "/pages/privacy" }],
  social_links: [] as LinkItem[],
};

function linksToText(links: LinkItem[]) {
  return links.map((link) => `${link.label} | ${link.href}`).join("\n");
}

function parseLinks(value: FormDataEntryValue | null, requiresInternal: boolean) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((item) => item.trim());
      return { label, href: requiresInternal && href && !href.startsWith("/") ? `/${href}` : href };
    });
}

export function BrandingNavigationForm() {
  const [settings, setSettings] = useState(defaults);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load settings");
        const result = await response.json();
        const values = Object.fromEntries(result.settings.map((setting: { key: string; value: unknown }) => [setting.key, setting.value])) as Settings;
        setSettings({
          branding: values.branding && typeof values.branding === "object" ? values.branding as { appName: string } : defaults.branding,
          header_navigation: Array.isArray(values.header_navigation) ? values.header_navigation as LinkItem[] : defaults.header_navigation,
          footer_navigation: Array.isArray(values.footer_navigation) ? values.footer_navigation as LinkItem[] : defaults.footer_navigation,
          social_links: Array.isArray(values.social_links) ? values.social_links as LinkItem[] : defaults.social_links,
        });
      })
      .catch(() => setMessage("Khong the tai cau hinh hien tai."))
      .finally(() => setIsLoading(false));
  }, []);

  async function save(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const entries = [
      { key: "branding", value: { appName: formData.get("appName") } },
      { key: "header_navigation", value: parseLinks(formData.get("headerNavigation"), true) },
      { key: "footer_navigation", value: parseLinks(formData.get("footerNavigation"), true) },
      { key: "social_links", value: parseLinks(formData.get("socialLinks"), false) },
    ];
    const results = await Promise.all(entries.map((entry) => fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, isPublic: true }),
    })));
    setIsSaving(false);
    setMessage(results.every((response) => response.ok) ? "Da luu branding va navigation." : "Khong the luu mot hoac nhieu setting.");
  }

  if (isLoading) return <section className="panel"><p>Dang tai branding va navigation...</p></section>;

  return (
    <form action={save} className="form-stack panel">
      <h2>Branding va navigation</h2>
      <label>Ten ung dung<input defaultValue={settings.branding.appName} name="appName" required /></label>
      <label>Header links<textarea defaultValue={linksToText(settings.header_navigation)} name="headerNavigation" rows={4} /></label>
      <label>Footer links<textarea defaultValue={linksToText(settings.footer_navigation)} name="footerNavigation" rows={4} /></label>
      <label>Social links<textarea defaultValue={linksToText(settings.social_links)} name="socialLinks" rows={3} /></label>
      <button className="button button--primary" disabled={isSaving} type="submit">{isSaving ? "Dang luu" : "Luu branding va menu"}</button>
      {message ? <p role="status">{message}</p> : null}
    </form>
  );
}
