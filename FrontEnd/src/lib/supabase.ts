import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const usesMockApi = import.meta.env.VITE_USE_MOCK !== 'false';

export function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.',
    );
  }

  supabaseClient ??= createClient(supabaseUrl, supabasePublishableKey);
  return supabaseClient;
}