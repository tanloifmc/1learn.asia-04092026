import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data } = await supabase.from("university_majors").select("*").limit(1);
  if (data && data[0]) console.log("university_majors cols:", Object.keys(data[0]));
}
main().catch(console.error);
