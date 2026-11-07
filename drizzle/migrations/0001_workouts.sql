create table public.user_favorites (
  user_id uuid not null,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
grant select, insert, delete on public.user_favorites to authenticated;
grant all on public.user_favorites to service_role;
alter table public.user_favorites enable row level security;
create policy "own favorites" on public.user_favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  summary text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.workout_plans (user_id, created_at desc);
grant select, insert, update, delete on public.workout_plans to authenticated;
grant all on public.workout_plans to service_role;
alter table public.workout_plans enable row level security;
create policy "own plans" on public.workout_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  user_id uuid not null,
  day_index int not null,
  title text not null,
  focus text,
  unique (plan_id, day_index)
);
grant select, insert, update, delete on public.workout_days to authenticated;
grant all on public.workout_days to service_role;
alter table public.workout_days enable row level security;
create policy "own days" on public.workout_days for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_day_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.workout_days(id) on delete cascade,
  user_id uuid not null,
  exercise_id text not null,
  position int not null,
  sets int not null default 3 check (sets between 1 and 10),
  reps text not null default '10',
  rest_sec int not null default 60 check (rest_sec between 0 and 600),
  notes text
);
create index on public.workout_day_exercises (day_id, position);
grant select, insert, update, delete on public.workout_day_exercises to authenticated;
grant all on public.workout_day_exercises to service_role;
alter table public.workout_day_exercises enable row level security;
create policy "own day exercises" on public.workout_day_exercises for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day_id uuid references public.workout_days(id) on delete set null,
  title text not null,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.workout_sessions (user_id, started_at desc);
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant all on public.workout_sessions to service_role;
alter table public.workout_sessions enable row level security;
create policy "own sessions" on public.workout_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null,
  exercise_id text not null,
  set_index int not null,
  reps int check (reps is null or reps between 0 and 500),
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg between 0 and 1000),
  completed boolean not null default false,
  skipped boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_index)
);
create index on public.workout_sets (user_id, exercise_id, updated_at desc);
grant select, insert, update, delete on public.workout_sets to authenticated;
grant all on public.workout_sets to service_role;
alter table public.workout_sets enable row level security;
create policy "own sets" on public.workout_sets for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);