import Link from "next/link";
import { getPublicHomeContent } from "@/features/settings/public-settings";
export default async function HomePage() { const content = await getPublicHomeContent(); return <main className="home-main"><p className="eyebrow">{content.eyebrow}</p><h1>{content.title}</h1><p className="home-main__description">{content.description}</p><Link className="button button--primary" href={content.primaryCtaHref}>{content.primaryCtaLabel}</Link></main>; }
