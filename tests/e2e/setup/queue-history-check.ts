import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Check if updated_at column exists by querying all columns
  const { data: sample, error: sampleErr } = await admin
    .from('welcome_email_queue')
    .select('*')
    .limit(1);

  if (sampleErr) {
    console.log(`❌ Error: ${sampleErr.message}`);
    return;
  }

  const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
  console.log(`Columns: ${columns.join(', ')}`);

  const hasUpdatedAt = columns.includes('updated_at');
  const timeColumn = hasUpdatedAt ? 'updated_at' : 'sent_at';

  // Get all rows from last 7 days, grouped by status
  const { data: rows, error } = await admin
    .from('welcome_email_queue')
    .select('status, created_at, sent_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`\n=== WELCOME EMAIL QUEUE — ALL ${rows?.length || 0} ROWS ===`);
  console.log(`Status breakdown:`);

  const statusCounts: Record<string, number> = {};
  const sentRows: Array<{ status: string; created_at: string; sent_at: string | null }> = [];

  for (const row of rows || []) {
    statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
    if (row.sent_at) {
      sentRows.push(row);
    }
  }

  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }

  // Show sent_at timestamps to look for hourly patterns
  if (sentRows.length > 0) {
    console.log(`\n=== SENT TIMESTAMPS (looking for hourly cron pattern) ===`);
    for (const row of sentRows.slice(0, 20)) {
      const sentDate = new Date(row.sent_at!);
      console.log(`  sent_at: ${row.sent_at} (minute: ${sentDate.getMinutes()}, second: ${sentDate.getSeconds()})`);
    }
  } else {
    console.log(`\nNo rows have sent_at set.`);
  }

  // Show pending rows
  const pendingRows = (rows || []).filter(r => r.status === 'pending');
  if (pendingRows.length > 0) {
    console.log(`\n=== PENDING ROWS (${pendingRows.length}) ===`);
    for (const row of pendingRows.slice(0, 10)) {
      console.log(`  created_at: ${row.created_at}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
