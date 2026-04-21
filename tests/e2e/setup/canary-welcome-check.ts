import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CANARY_EMAIL = `qa-welcome-canary-${Date.now()}@forgenursing.test`;

async function main() {
  let userId: string | null = null;

  try {
    // Create user via admin API
    const { data, error } = await admin.auth.admin.createUser({
      email: CANARY_EMAIL,
      password: 'CanaryTest!2026',
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;
    console.log(`✓ Created canary user: ${CANARY_EMAIL} (id: ${userId})`);

    // Query welcome_email_queue immediately
    const { data: row1, error: err1 } = await admin
      .from('welcome_email_queue')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (err1) {
      console.log(`❌ Error querying welcome_email_queue: ${err1.message}`);
    } else if (row1) {
      console.log(`\n=== IMMEDIATE CHECK (t=0) ===`);
      console.log(`  Row found: YES`);
      console.log(`  Status: ${row1.status}`);
      console.log(`  Created at: ${row1.created_at}`);
      console.log(`  Sent at: ${row1.sent_at || 'null'}`);
    } else {
      console.log(`\n=== IMMEDIATE CHECK (t=0) ===`);
      console.log(`  Row found: NO — trigger did not fire for admin-created user`);
      console.log(`  (This is expected if the trigger only fires on signup-flow profile creation)`);
    }

    // Wait 60 seconds
    console.log(`\nWaiting 60 seconds...`);
    await new Promise(r => setTimeout(r, 60_000));

    // Query again
    const { data: row2, error: err2 } = await admin
      .from('welcome_email_queue')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (err2) {
      console.log(`❌ Error querying welcome_email_queue: ${err2.message}`);
    } else if (row2) {
      console.log(`=== AFTER 60s CHECK ===`);
      console.log(`  Row found: YES`);
      console.log(`  Status: ${row2.status}`);
      console.log(`  Sent at: ${row2.sent_at || 'null'}`);
      if (row1 && row2.status !== row1.status) {
        console.log(`  ⚠️ STATUS CHANGED from '${row1.status}' to '${row2.status}'`);
      } else if (row1) {
        console.log(`  Status unchanged from '${row1.status}'`);
      }
    } else {
      console.log(`=== AFTER 60s CHECK ===`);
      console.log(`  Row found: NO`);
    }

  } finally {
    // Cleanup
    if (userId) {
      // Delete queue row first (if exists)
      await admin.from('welcome_email_queue').delete().eq('user_id', userId);
      await admin.auth.admin.deleteUser(userId);
      console.log(`\n✓ Cleaned up canary user and queue row`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
