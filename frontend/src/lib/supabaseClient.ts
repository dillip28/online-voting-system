import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Supabase features are disabled.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseKey ?? 'placeholder-key'
);

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase env vars are not configured.' };
  }
  try {
    const { error } = await supabase.from('_health_check_nonexistent').select('*').limit(1);
    if (error && error.code === 'PGRST301') {
      return { ok: true, message: 'Connected to Supabase.' };
    }
    if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      return { ok: false, message: `Network error: ${error.message}` };
    }
    return { ok: true, message: `Connected to Supabase. (${error?.message ?? 'ok'})` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}
