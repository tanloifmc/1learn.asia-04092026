import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function upgrade() {
  const email = 'tanloifmc@yahoo.com';
  
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) {
    console.error("List users error:", err1);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`User ${email} not found in auth.users`);
    return;
  }
  
  console.log(`Found user: ${user.id}`);
  
  // Update to premium in user_roles table
  const { error: err3 } = await supabase
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'premium' }, { onConflict: 'user_id, role' });
    
  if (err3) console.error("Upsert role error:", err3);
  else console.log("Upgraded role to premium in user_roles");
}

upgrade();
