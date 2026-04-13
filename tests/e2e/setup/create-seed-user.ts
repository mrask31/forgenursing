import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SEED_EMAIL = 'qa-seed@forgenursing.test';
const SEED_PASSWORD = 'ForgeSeedQA!2026';

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list.users.find((u) => u.email === SEED_EMAIL);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user!;
    console.log(`✓ Created seed user: ${SEED_EMAIL}`);
  } else {
    console.log(`✓ Seed user already exists: ${SEED_EMAIL}`);
  }

  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 10);

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      is_beta: true,
      beta_expires_at: farFuture.toISOString(),
      subscription_status: 'active',
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
    })
    .eq('id', user.id);

  if (updateError) throw updateError;
  console.log(`✓ Seed user beta status confirmed (expires ${farFuture.toISOString().split('T')[0]})`);
  console.log(`✓ phi_acknowledged_at and program_level (BSN) set — no post-login modals`);
  console.log(`\nAdd these to .env.test:`);
  console.log(`SEED_USER_EMAIL=${SEED_EMAIL}`);
  console.log(`SEED_USER_PASSWORD=${SEED_PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
