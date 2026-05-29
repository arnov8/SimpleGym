export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionStatus = 'planned' | 'active' | 'done' | 'cancelled';

export interface Profile {
  id: string;
  display_name: string;
  fitness_level: FitnessLevel;
  equipment_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  profile_id: string;
  date: string;
  status: SessionStatus;
  ai_prompt: string;
  session_name: string;
  muscles_targeted: string[];
  estimated_duration: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  session_id: string;
  name: string;
  name_en: string;
  muscle_group: string;
  sets: number;
  reps_target: string;
  rest_seconds: number;
  notes: string;
  image_url: string;
  order_index: number;
  sets_log?: SetLog[];
}

export interface SetLog {
  id: string;
  exercise_id: string;
  session_id: string;
  set_number: number;
  weight_kg: number;
  reps_done: number;
  completed: boolean;
  completed_at: string | null;
}

export interface GeneratedExercise {
  name: string;
  name_en: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
}

export interface GeneratedWorkout {
  session_name: string;
  muscles_targeted: string[];
  estimated_duration: number;
  exercises: GeneratedExercise[];
}
