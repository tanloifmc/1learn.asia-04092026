import { requireAdministrator } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { SettingForm } from "@/components/admin/setting-form";
import { HomeContentForm } from "@/components/admin/home-content-form";
import { BrandingNavigationForm } from "@/components/admin/branding-navigation-form";

export default async function AdminSettingsPage() {
  await requireAdministrator();
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("key, value, is_public, updated_at").order("key");

  return (
    <main className="stack">
      <p className="eyebrow">Cau hinh</p>
      <h1>App settings</h1>
      <HomeContentForm />
      <BrandingNavigationForm />
      <SettingForm />
      <section className="stack" aria-label="Cau hinh hien co">
        {settings?.length ? settings.map((setting) => <article className="list-item" key={setting.key}><h2>{setting.key}</h2><p>{setting.is_public ? "Cong khai" : "Noi bo"}</p><pre>{JSON.stringify(setting.value, null, 2)}</pre></article>) : <p>Chua co cau hinh duoc luu.</p>}
      </section>
    </main>
  );
}
