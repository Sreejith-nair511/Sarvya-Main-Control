import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client — uses anon key, respects RLS
export const supabase = createClient(url, anon);

// Server-only admin client — bypasses RLS (only use in API routes / server actions)
export function getAdminClient() {
  if (typeof window !== 'undefined') throw new Error('Admin client must only be used server-side');
  return createClient(url, svc, { auth: { persistSession: false } });
}
