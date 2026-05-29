import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWorkout, fetchExerciseImage } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { prompt } = await request.json();
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('fitness_level, equipment_notes')
    .eq('id', user.id)
    .single();

  try {
    const workout = await generateWorkout(
      prompt,
      profile?.fitness_level ?? 'intermediate',
      profile?.equipment_notes ?? ''
    );

    // Get exercise images from static mapping (instant, no API call)
    const imageUrls = workout.exercises.map(ex =>
      fetchExerciseImage(ex.name_en || ex.name)
    );

    const today = new Date().toISOString().split('T')[0];
    const { data: session, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        profile_id: user.id,
        date: today,
        status: 'planned',
        ai_prompt: prompt,
        session_name: workout.session_name,
        muscles_targeted: workout.muscles_targeted,
        estimated_duration: workout.estimated_duration,
      })
      .select()
      .single();

    if (sessionErr) throw sessionErr;

    const exercisesPayload = workout.exercises.map((ex, i) => ({
      session_id: session.id,
      name: ex.name,
      name_en: ex.name_en || ex.name,
      muscle_group: ex.muscle_group,
      sets: ex.sets,
      reps_target: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
      image_url: imageUrls[i] || '',
      order_index: i,
    }));

    const { data: exercises, error: exErr } = await supabase
      .from('exercises')
      .insert(exercisesPayload)
      .select();

    if (exErr) throw exErr;

    const setsPayload = exercises.flatMap(ex =>
      Array.from({ length: ex.sets }, (_, i) => ({
        exercise_id: ex.id,
        session_id: session.id,
        set_number: i + 1,
        weight_kg: 0,
        reps_done: 0,
        completed: false,
      }))
    );

    await supabase.from('sets_log').insert(setsPayload);

    return NextResponse.json({ session: { ...session, exercises } });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 });
  }
}
