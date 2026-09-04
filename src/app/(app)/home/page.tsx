import { redirect } from "next/navigation";

// /home now redirects to /dashboard — the canonical student dashboard URL.
export default function HomeRedirect() {
  redirect("/dashboard");
}
