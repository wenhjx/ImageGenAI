import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.SUPABASE_URL) {
  console.error('[Supabase] SUPABASE_URL is not set');
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set');
}

export const supabase: SupabaseClient = createClient(env.SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
    },
  },
});
