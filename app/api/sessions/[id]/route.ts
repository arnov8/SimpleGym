import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data, error } = await supabase
    .from('sessions')
    .select('*, exercises(*, sets_log(*))')
    .eq('id', id)
    .eq('profile_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 });

  // Sort exercises and their sets
  if (data.exercises) {
    data.exercises.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
    for (const ex of data.exercises) {
      if (ex.sets_log) ex.sets_log.sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number);
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from('sessions')
    .update(body)
    .eq('id', id)
    .eq('profile_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
