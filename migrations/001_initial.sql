-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null default '',
  fitness_level text not null default 'intermediate' check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  equipment_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sessions
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
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

create index sessions_profile_date on public.sessions(profile_id, date desc);

-- Exercises within a session
create table public.exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  name text not null,
  muscle_group text not null,
  sets int not null default 3,
  reps_target text not null default '8-12',
  rest_seconds int not null default 90,
  notes text default '',
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create index exercises_session on public.exercises(session_id, order_index);

-- Sets log (actual performance during session)
create table public.sets_log (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  set_number int not null,
  weight_kg numeric(5,2) default 0,
  reps_done int default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(exercise_id, set_number)
);

create index sets_log_exercise on public.sets_log(exercise_id);
create index sets_log_session on public.sets_log(session_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.exercises enable row level security;
alter table public.sets_log enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Sessions policies
create policy "Users can CRUD own sessions"
  on public.sessions for all using (profile_id = auth.uid());

-- Exercises policies
create policy "Users can CRUD own exercises"
  on public.exercises for all using (
    session_id in (select id from public.sessions where profile_id = auth.uid())
  );

-- Sets log policies
create policy "Users can CRUD own sets"
  on public.sets_log for all using (
    session_id in (select id from public.sessions where profile_id = auth.uid())
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
