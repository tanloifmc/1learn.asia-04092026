import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from("membership_plans")
    .update({ price_amount: 149000 })
    .eq("code", "PREMIUM_1Y")
    .select();

  if (error) {
    console.error("Error updating price:", error);
  } else {
    console.log("Updated successfully:", data);
  }
}

run();
