import Link from "next/link";
import { getCurrentAccount } from "@/features/account/current-account";
import { OrganizationForm } from "@/components/provider/organization-form";
import { ImageUpload } from "@/components/media/image-upload";

export default async function ProviderPage() {
  const account = await getCurrentAccount();
  return <main className="stack"><p className="eyebrow">Nha cung cap</p><h1>Doanh nghiep cua ban</h1><OrganizationForm />{account?.roles.includes("provider") ? <><ImageUpload kind="organization" label="Logo doanh nghiep" /><Link className="button" href="/provider/inquiries">Xem yeu cau nhan duoc</Link></> : null}</main>;
}
