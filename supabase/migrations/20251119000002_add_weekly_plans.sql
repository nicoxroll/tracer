-- Create weekly_plans table for storing user weekly routine assignments
create table if not exists weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  day_of_week text not null check (day_of_week in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
  routine_id uuid references routines(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_of_week)
);

alter table weekly_plans enable row level security;

create policy "Users can view own weekly plans"
  on weekly_plans for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own weekly plans"
  on weekly_plans for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own weekly plans"
  on weekly_plans for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own weekly plans"
  on weekly_plans for delete
  to authenticated
  using (user_id = auth.uid());