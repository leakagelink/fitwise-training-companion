create type public.app_role as enum ('admin','coach','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age int check (age is null or (age between 13 and 100)),
  gender text,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  target_weight_kg numeric(5,1),
  goal text check (goal is null or goal in ('fat_loss','weight_gain','muscle_gain','maintenance')),
  diet_type text check (diet_type is null or diet_type in ('vegetarian','non_vegetarian','eggetarian','vegan')),
  allergies text[] not null default '{}',
  medical_conditions text,
  activity_level text,
  workout_location text check (workout_location is null or workout_location in ('gym','home')),
  experience_level text,
  equipment text[] not null default '{}',
  workout_frequency int,
  workout_duration_min int,
  food_preferences text,
  health_consent_at timestamptz,
  onboarded_at timestamptz,
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null default current_date,
  water_ml int not null default 0 check (water_ml between 0 and 15000),
  sleep_hours numeric(3,1) check (sleep_hours is null or sleep_hours between 0 and 24),
  energy_level int check (energy_level is null or energy_level between 1 and 5),
  workout_done boolean not null default false,
  diet_followed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
create index on public.daily_checkins (user_id, date desc);
grant select, insert, update, delete on public.daily_checkins to authenticated;
grant all on public.daily_checkins to service_role;
alter table public.daily_checkins enable row level security;
create policy "own checkins" on public.daily_checkins for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  weight_kg numeric(5,1) not null check (weight_kg between 20 and 400),
  logged_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index on public.weight_logs (user_id, logged_on desc);
grant select, insert, update, delete on public.weight_logs to authenticated;
grant all on public.weight_logs to service_role;
alter table public.weight_logs enable row level security;
create policy "own weights" on public.weight_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null default 'daily',
  for_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, for_date)
);
grant select, insert, update, delete on public.ai_recommendations to authenticated;
grant all on public.ai_recommendations to service_role;
alter table public.ai_recommendations enable row level security;
create policy "own recs" on public.ai_recommendations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger t_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_checkins before update on public.daily_checkins for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();