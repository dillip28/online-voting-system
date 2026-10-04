import { supabase } from '@/lib/supabaseClient';
import type { Position } from '@/types';
import { mapPositionRow } from '@/services/electionService';

interface PositionRow {
  id: string;
  election_id: string;
  name: string;
  description: string | null;
  display_order: number;
  max_selections: number;
}

export async function getPositions(electionId: string): Promise<Position[]> {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('election_id', electionId)
    .order('display_order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapPositionRow(r as PositionRow));
}

export async function addPosition(electionId: string, data: {
  title: string;
  description?: string;
  maxSelections?: number;
}): Promise<Position | null> {
  const { count } = await supabase
    .from('positions')
    .select('id', { count: 'exact', head: true })
    .eq('election_id', electionId);

  const { data: row, error } = await supabase
    .from('positions')
    .insert({
      election_id: electionId,
      name: data.title,
      description: data.description || '',
      max_selections: data.maxSelections || 1,
      display_order: count ?? 0,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from('elections')
    .update({ total_positions: (count ?? 0) + 1 })
    .eq('id', electionId);

  return mapPositionRow(row as PositionRow);
}

export async function updatePosition(electionId: string, positionId: string, data: {
  title?: string;
  description?: string;
  maxSelections?: number;
  order?: number;
}): Promise<Position | null> {
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.name = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.maxSelections !== undefined) update.max_selections = data.maxSelections;
  if (data.order !== undefined) update.display_order = data.order;

  const { data: row, error } = await supabase
    .from('positions')
    .update(update)
    .eq('id', positionId)
    .eq('election_id', electionId)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  return row ? mapPositionRow(row as PositionRow) : null;
}

export async function deletePosition(electionId: string, positionId: string): Promise<boolean> {
  const { count } = await supabase
    .from('candidates')
    .select('id', { count: 'exact', head: true })
    .eq('position_id', positionId);
  if ((count ?? 0) > 0) return false;

  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('id', positionId)
    .eq('election_id', electionId);
  if (error) throw new Error(error.message);

  const { count: remaining } = await supabase
    .from('positions')
    .select('id', { count: 'exact', head: true })
    .eq('election_id', electionId);
  await supabase.from('elections').update({ total_positions: remaining ?? 0 }).eq('id', electionId);
  return true;
}

export async function reorderPositions(electionId: string, positionIds: string[]): Promise<boolean> {
  const results = await Promise.all(
    positionIds.map((id, i) =>
      supabase.from('positions').update({ display_order: i }).eq('id', id).eq('election_id', electionId)
    )
  );
  const failed = results.some((r) => r.error);
  if (failed) throw new Error('Failed to reorder positions');
  return true;
}
