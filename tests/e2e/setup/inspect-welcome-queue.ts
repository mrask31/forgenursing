import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Check if table exists by querying it
  const { data, error } = await admin
    .from('welcome_email_queue')
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ welcome_email_queue table error: ${error.message}`);
    console.log(`   Code: ${error.code}, Details: ${error.details}`);
    return;
  }

  console.log('✓ welcome_email_queue table exists');

  if (data && data.length > 0) {
    console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
  } else {
    console.log('  (table is empty — no sample row to inspect columns)');
  }

  // Get distinct status values
  const { data: statuses, error: statusError } = await admin
    .from('welcome_email_queue')
    .select('status');

  if (statusError) {
    console.log(`❌ Error querying statuses: ${statusError.message}`);
    return;
  }

  const distinctStatuses = Array.from(new Set((statuses || []).map((r: any) => r.status)));
  console.log(`  Distinct status values: ${distinctStatuses.length > 0 ? distinctStatuses.join(', ') : '(none — table empty)'}`);

  // Count rows
  const { count } = await admin
    .from('welcome_email_queue')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total rows: ${count}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
