import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  
  if (!users || users.users.length === 0) {
    console.log("No users found.");
    return;
  }
  
  console.log(`Found ${users.users.length} users. Triggering fetch via REST...`);
  
  // To re-trigger matching engine, it's easier if we just update valid_until or something?
  // No, we can just run the server action logic locally here, or make a POST request to an API route.
  // There is no exposed API route for buildStudentProfile. We'd need to invoke the TS code.
  // I will write a simple TS script that imports the server actions and runs them.
}

run();
