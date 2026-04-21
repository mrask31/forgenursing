import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const now = new Date().toISOString();

  // actively_leaking: non-beta, trialing, trial expired
  const { count: activelyLeaking } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', false)
    .eq('subscription_status', 'trialing')
    .lt('trial_ends_at', now);

  // legitimate_trial_users: non-beta, trialing, trial NOT expired
  const { count: legitimateTrial } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', false)
    .eq('subscription_status', 'trialing')
    .gte('trial_ends_at', now);

  // trialing_with_null_expiry: non-beta, trialing, trial_ends_at IS NULL
  const { count: trialingNullExpiry } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', false)
    .eq('subscription_status', 'trialing')
    .is('trial_ends_at', null);

  // beta_users_in_trialing_state
  const { count: betaTrialing } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_beta', true)
    .eq('subscription_status', 'trialing');

  console.log('=== TRIAL EXPIRY EXPOSURE AUDIT (aggregate counts only) ===');
  console.log(`actively_leaking (non-beta, trialing, expired):     ${activelyLeaking}`);
  console.log(`legitimate_trial_users (non-beta, trialing, active): ${legitimateTrial}`);
  console.log(`trialing_with_null_expiry (non-beta, trialing, null): ${trialingNullExpiry}`);
  console.log(`beta_users_in_trialing_state:                        ${betaTrialing}`);
  console.log('============================================================');
}

main().catch((e) => { console.error(e); process.exit(1); });
