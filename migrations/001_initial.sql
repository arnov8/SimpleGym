-- ============================================================
-- SimpleGym schema — à exécuter dans le projet Supabase de FoodAnalyzer
-- ============================================================

-- Créer le schéma gym
create schema if not exists gym;

-- Enable UUID extension (déjà active si FoodAnalyzer tourne)
create extension if not exists "uuid-ossp";

-- Exposer le schéma gym à l'API Supabase
-- (à faire UNE FOIS dans Settings > API > Exposed schemas : ajouter "gym")

-- ============================================================
-- Tables
-- ============================================================

create table gym.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default '',
  fitness_level text not null default 'intermediate' check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  equipment_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table gym.sessions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references gym.profiles(id) on delete cascade,
  date date not null default current_date,
  status text not null default 'planned' check (status in ('planned', 'active', 'done', 'cancelled')),
  ai_prompt text not null default '',
  session_name text not null default '',
  muscles_targeted text[] not null default '{}',
  estimated_duration int default 60,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index sessions_profile_date on gym.sessions(profile_id, date desc);

create table gym.exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references gym.sessions(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  sets int not null default 3,
  reps_target text not null default '8-12',
  rest_seconds int not null default 90,
  notes text default '',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index exercises_session on gym.exercises(session_id, order_index);

create table gym.sets_log (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid not null references gym.exercises(id) on delete cascade,
  session_id uuid not null references gym.sessions(id) on delete cascade,
  set_number int not null,
  weight_kg numeric(5,2) default 0,
  reps_done int default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(exercise_id, set_number)
);

create index sets_log_exercise on gym.sets_log(exercise_id);
create index sets_log_session on gym.sets_log(session_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table gym.profiles  enable row level security;
alter table gym.sessions  enable row level security;
alter table gym.exercises enable row level security;
alter table gym.sets_log  enable row level security;

create policy "Users can view own profile"
  on gym.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on gym.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on gym.profiles for insert with check (auth.uid() = id);

create policy "Users can CRUD own sessions"
  on gym.sessions for all using (profile_id = auth.uid());

create policy "Users can CRUD own exercises"
  on gym.exercises for all using (
    session_id in (select id from gym.sessions where profile_id = auth.uid())
  );

create policy "Users can CRUD own sets"
  on gym.sets_log for all using (
    session_id in (select id from gym.sessions where profile_id = auth.uid())
  );

-- ============================================================
-- Auto-create gym profile on signup
-- (si handle_new_user existe déjà pour FoodAnalyzer, on l'étend)
-- ============================================================

create or replace function gym.handle_new_gym_user()
returns trigger language plpgsql security definer set search_path = gym as $$
begin
  insert into gym.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_gym
  after insert on auth.users
  for each row execute function gym.handle_new_gym_user();
