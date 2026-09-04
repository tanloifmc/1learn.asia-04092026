import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RedeemTokenForm } from "@/components/parent/redeem-token-form";

export default async function ParentLinkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if they are a parent role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "parent") {
    // Optionally redirect non-parents, or show error
    // redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8 w-full">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">
              Parent Dashboard
            </div>
            <h2 className="block mt-1 text-2xl leading-tight font-bold text-black mb-6">
              Link Student Account
            </h2>
            <p className="mt-2 text-gray-500 mb-8">
              Enter the 8-character token provided by your student to link their account to your dashboard.
            </p>
            
            <RedeemTokenForm parentId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
