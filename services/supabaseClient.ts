import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

const getEnv = (key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value : '';
};

export const hasSupabaseConfig = (): boolean =>
  Boolean(getEnv('VITE_SUPABASE_URL') && getEnv('VITE_SUPABASE_ANON_KEY'));

export const getSupabaseClient = (): SupabaseClient | null => {
  if (client !== undefined) {
    return client;
  }

  if (!hasSupabaseConfig()) {
    client = null;
    return client;
  }

  client = createClient(getEnv('VITE_SUPABASE_URL'), getEnv('VITE_SUPABASE_ANON_KEY'), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
};

