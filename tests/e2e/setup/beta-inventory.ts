import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Total beta users
  const { count: totalBeta } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true);

  // Beta users with subscription_status IS NULL
  const { count: betaNull } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)
    .is('subscription_status', null);

  // Beta users with subscription_status = 'active'
  const { count: betaActive } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)
    .eq('subscription_status', 'active');

  // Beta users with subscription_status = 'trialing'
  const { count: betaTrialing } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)
    .eq('subscription_status', 'trialing');

  // Beta users with beta_expires_at > NOW()
  const { count: betaNotExpired } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)
    .gt('beta_expires_at', new Date().toISOString());

  console.log('=== BETA USER INVENTORY (aggregate counts only) ===');
  console.log(`Total beta users:                    ${totalBeta}`);
  console.log(`  subscription_status IS NULL:        ${betaNull}`);
  console.log(`  subscription_status = 'active':     ${betaActive}`);
  console.log(`  subscription_status = 'trialing':   ${betaTrialing}`);
  console.log(`  beta_expires_at > NOW() (not expired): ${betaNotExpired}`);
  console.log('===================================================');

  if ((betaNull ?? 0) > 0) {
    console.log(`\n⚠️  ${betaNull} beta user(s) have subscription_status=NULL.`);
    console.log(`   These users would be redirected to /checkout on login.`);
  } else {
    console.log(`\n✓ No beta users have subscription_status=NULL.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
