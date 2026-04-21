import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Find seed user
  const { data: list } = await admin.auth.admin.listUsers();
  const seedUser = list.users.find(u => u.email === 'qa-seed@forgenursing.test');
  
  if (!seedUser) {
    console.log('Seed user not found');
    return;
  }
  console.log(`Seed user ID: ${seedUser.id}`);

  // Check student_classes table
  const { data: classes, error } = await admin
    .from('student_classes')
    .select('*')
    .eq('user_id', seedUser.id);

  if (error) {
    console.log(`Error querying student_classes: ${error.message}`);
    // Try 'classes' table instead
    const { data: classes2, error: error2 } = await admin
      .from('classes')
      .select('*')
      .eq('user_id', seedUser.id);
    if (error2) {
      console.log(`Error querying classes: ${error2.message}`);
    } else {
      console.log(`classes table rows for seed user: ${classes2?.length || 0}`);
      if (classes2 && classes2.length > 0) {
        classes2.forEach(c => console.log(`  - ${c.name || c.code || JSON.stringify(c)}`));
      }
    }
  } else {
    console.log(`student_classes rows for seed user: ${classes?.length || 0}`);
    if (classes && classes.length > 0) {
      classes.forEach(c => console.log(`  - ${JSON.stringify(c)}`));
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
