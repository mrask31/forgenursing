import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CLONE_EMAIL = 'qa-beta-clone@forgenursing.test';
const CLONE_PASSWORD = 'ForgeBetaClone!2026';

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list.users.find((u) => u.email === CLONE_EMAIL);

  if (user) {
    await admin.auth.admin.deleteUser(user.id);
    console.log(`✓ Deleted existing clone user for clean state`);
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: CLONE_EMAIL,
    password: CLONE_PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  user = data.user!;
  console.log(`✓ Created beta clone user: ${CLONE_EMAIL}`);

  // Mirror what a REAL beta user looks like in production:
  // is_beta = true, beta_expires_at = 80 days from now, subscription_status = NULL
  // PHI and program already acknowledged (so modals don't interfere with the test)
  const betaExpiry = new Date();
  betaExpiry.setDate(betaExpiry.getDate() + 80);

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      is_beta: true,
      beta_expires_at: betaExpiry.toISOString(),
      subscription_status: null,
      trial_ends_at: null,
      phi_acknowledged_at: new Date().toISOString(),
      program_level: 'BSN',
    })
    .eq('id', user.id);

  if (updateError) throw updateError;
  console.log(`✓ Profile set to mirror real beta user (subscription_status: NULL)`);
  console.log(`\nClone credentials:`);
  console.log(`BETA_CLONE_EMAIL=${CLONE_EMAIL}`);
  console.log(`BETA_CLONE_PASSWORD=${CLONE_PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
