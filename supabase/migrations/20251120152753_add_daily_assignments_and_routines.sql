-- Create daily_assignments table for storing specific date assignments
create table if not exists daily_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  routine_id uuid references routines(id) on delete cascade,
  is_recurring boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Create daily_routines table for storing modified routines for specific days
create table if not exists daily_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null,
  title text not null,
  description text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- Create daily_routine_exercises table for storing modified exercises for daily routines
create table if not exists daily_routine_exercises (
  id uuid primary key default gen_random_uuid(),
  daily_routine_id uuid references daily_routines(id) on delete cascade not null,
  exercise_id uuid references exercise_library(id) on delete cascade not null,
  sets integer default 3,
  reps text default '10',
  weight_kg numeric default 0,
  rest_seconds integer default 60,
  order_index integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table daily_assignments enable row level security;
alter table daily_routines enable row level security;
alter table daily_routine_exercises enable row level security;

-- Policies for daily_assignments
create policy "Users can view own daily assignments"
  on daily_assignments for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own daily assignments"
  on daily_assignments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own daily assignments"
  on daily_assignments for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own daily assignments"
  on daily_assignments for delete
  to authenticated
  using (user_id = auth.uid());

-- Policies for daily_routines
create policy "Users can view own daily routines"
  on daily_routines for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own daily routines"
  on daily_routines for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own daily routines"
  on daily_routines for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own daily routines"
  on daily_routines for delete
  to authenticated
  using (user_id = auth.uid());

-- Policies for daily_routine_exercises
create policy "Users can view own daily routine exercises"
  on daily_routine_exercises for select
  to authenticated
  using (exists (
    select 1 from daily_routines
    where id = daily_routine_exercises.daily_routine_id
    and user_id = auth.uid()
  ));

create policy "Users can insert own daily routine exercises"
  on daily_routine_exercises for insert
  to authenticated
  with check (exists (
    select 1 from daily_routines
    where id = daily_routine_exercises.daily_routine_id
    and user_id = auth.uid()
  ));

create policy "Users can update own daily routine exercises"
  on daily_routine_exercises for update
  to authenticated
  using (exists (
    select 1 from daily_routines
    where id = daily_routine_exercises.daily_routine_id
    and user_id = auth.uid()
  ))
  with check (exists (
    select 1 from daily_routines
    where id = daily_routine_exercises.daily_routine_id
    and user_id = auth.uid()
  ));

create policy "Users can delete own daily routine exercises"
  on daily_routine_exercises for delete
  to authenticated
  using (exists (
    select 1 from daily_routines
    where id = daily_routine_exercises.daily_routine_id
    and user_id = auth.uid()
  ));

-- Create indexes for better performance
create index idx_daily_assignments_user_date on daily_assignments(user_id, date);
create index idx_daily_routines_user_date on daily_routines(user_id, date);
create index idx_daily_routine_exercises_routine on daily_routine_exercises(daily_routine_id);
