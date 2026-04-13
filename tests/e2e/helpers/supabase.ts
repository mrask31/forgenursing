import { createClient } from '@supabase/supabase-js';

export const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function getProfileByEmail(email: string) {
  const { data: user } = await admin.auth.admin.listUsers();
  const found = user.users.find((u) => u.email === email);
  if (!found) return null;
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', found.id)
    .single();
  return { auth: found, profile: data };
}

export async function deleteUserByEmail(email: string) {
  const { data: list } = await admin.auth.admin.listUsers();
  const u = list.users.find((x) => x.email === email);
  if (u) await admin.auth.admin.deleteUser(u.id);
}

export async function getBetaCount(): Promise<number> {
  const { data, error } = await admin.rpc('get_beta_user_count');
  if (error) throw error;
  return Number(data);
}
