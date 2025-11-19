-- Create challenges table
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  difficulty text default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text default 'general' check (category in ('strength', 'endurance', 'technique', 'consistency', 'general')),
  target_value integer not null,
  stat_type text not null check (stat_type in ('fuerza', 'resistencia', 'tecnica', 'definicion', 'constancia')),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table challenges enable row level security;

create policy "Users can view all challenges"
  on challenges for select
  to authenticated
  using (true);

-- Create user_challenges table for tracking progress
create table if not exists user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  challenge_id uuid references challenges(id) on delete cascade not null,
  progress integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, challenge_id)
);

alter table user_challenges enable row level security;

create policy "Users can view own challenges"
  on user_challenges for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own challenges"
  on user_challenges for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own challenges"
  on user_challenges for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Insert some default challenges
insert into challenges (title, description, difficulty, category, target_value, stat_type) values
('Fuerza Inicial', 'Alcanza 50 puntos de fuerza', 'beginner', 'strength', 50, 'fuerza'),
('Fuerza Intermedia', 'Alcanza 70 puntos de fuerza', 'intermediate', 'strength', 70, 'fuerza'),
('Fuerza Avanzada', 'Alcanza 90 puntos de fuerza', 'advanced', 'strength', 90, 'fuerza'),
('Resistencia Básica', 'Alcanza 50 puntos de resistencia', 'beginner', 'endurance', 50, 'resistencia'),
('Resistencia Media', 'Alcanza 70 puntos de resistencia', 'intermediate', 'endurance', 70, 'resistencia'),
('Resistencia Elite', 'Alcanza 90 puntos de resistencia', 'advanced', 'endurance', 90, 'resistencia'),
('Técnica Principiante', 'Alcanza 50 puntos de técnica', 'beginner', 'technique', 50, 'tecnica'),
('Técnica Experta', 'Alcanza 70 puntos de técnica', 'intermediate', 'technique', 70, 'tecnica'),
('Técnica Maestra', 'Alcanza 90 puntos de técnica', 'advanced', 'technique', 90, 'tecnica'),
('Consistencia Diaria', 'Alcanza 50 puntos de constancia', 'beginner', 'consistency', 50, 'constancia'),
('Consistencia Constante', 'Alcanza 70 puntos de constancia', 'intermediate', 'consistency', 70, 'constancia'),
('Consistencia Legendaria', 'Alcanza 90 puntos de constancia', 'advanced', 'consistency', 90, 'constancia'),
('Definición Inicial', 'Alcanza 50 puntos de definición', 'beginner', 'general', 50, 'definicion'),
('Definición Avanzada', 'Alcanza 70 puntos de definición', 'intermediate', 'general', 70, 'definicion'),
('Definición Perfecta', 'Alcanza 90 puntos de definición', 'advanced', 'general', 90, 'definicion');