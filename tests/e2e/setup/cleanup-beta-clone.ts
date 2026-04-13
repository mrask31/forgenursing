import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list.users.find((u) => u.email === 'qa-beta-clone@forgenursing.test');
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
    console.log('✓ Deleted beta clone user');
  } else {
    console.log('✓ Beta clone user already deleted');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
