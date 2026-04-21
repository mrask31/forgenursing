import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Get a sample row to see column names
  const { data, error } = await admin
    .from('student_classes')
    .select('*')
    .limit(1);

  if (error) {
    console.log(`Error: ${error.message}`);
    return;
  }

  if (data && data.length > 0) {
    console.log('student_classes columns:', Object.keys(data[0]).join(', '));
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('student_classes table is empty. Trying to insert a test row to discover required columns...');
    // Try inserting with minimal fields to see what errors
    const { error: insertErr } = await admin
      .from('student_classes')
      .insert({ name: 'test' });
    if (insertErr) {
      console.log(`Insert error (reveals required columns): ${insertErr.message}`);
      console.log(`Details: ${insertErr.details}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
