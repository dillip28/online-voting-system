import { supabase } from '@/lib/supabaseClient';
import type { SystemSettings } from '@/types';

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data.data as SystemSettings) : null;
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ id: 1, data: settings, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}
