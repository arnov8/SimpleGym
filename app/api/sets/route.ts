import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { set_id, weight_kg, reps_done, completed } = await request.json();
  if (!set_id) return NextResponse.json({ error: 'set_id requis' }, { status: 400 });

  const updatePayload: Record<string, unknown> = {};
  if (weight_kg !== undefined) updatePayload.weight_kg = weight_kg;
  if (reps_done !== undefined) updatePayload.reps_done = reps_done;
  if (completed !== undefined) {
    updatePayload.completed = completed;
    updatePayload.completed_at = completed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from('sets_log')
    .update(updatePayload)
    .eq('id', set_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
