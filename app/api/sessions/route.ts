import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const { data, error } = await supabase
    .from('sessions')
    .select('id, date, session_name, status, muscles_targeted, estimated_duration, completed_at, created_at')
    .eq('profile_id', user.id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
