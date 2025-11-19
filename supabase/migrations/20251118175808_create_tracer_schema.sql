/*
  # Tracer Fitness App Schema

  ## Overview
  Complete database schema for Tracer fitness tracking application with user roles, routines, workout tracking, and social features.

  ## New Tables

  ### profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `username` (text, unique)
  - `full_name` (text)
  - `role` (text) - 'trainer' or 'coach'
  - `bio` (text)
  - `avatar_url` (text)
  - `coach_id` (uuid) - reference to coach if user is a trainer
  - `fuerza` (integer, 0-100) - Strength stat
  - `resistencia` (integer, 0-100) - Endurance stat
  - `tecnica` (integer, 0-100) - Technique stat
  - `definicion` (integer, 0-100) - Definition stat
  - `constancia` (integer, 0-100) - Consistency stat
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### routines
  - `id` (uuid, primary key)
  - `creator_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `difficulty` (text) - 'beginner', 'intermediate', 'advanced'
  - `duration_minutes` (integer)
  - `is_public` (boolean) - if routine is shared publicly
  - `is_default` (boolean) - if routine is a platform default
  - `tags` (text array)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### exercises
  - `id` (uuid, primary key)
  - `routine_id` (uuid, references routines)
  - `name` (text)
  - `description` (text)
  - `sets` (integer)
  - `reps` (text) - can be "10-12" or "30 seconds"
  - `rest_seconds` (integer)
  - `order_index` (integer)
  - `created_at` (timestamptz)

  ### workout_sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `routine_id` (uuid, references routines)
  - `date` (date)
  - `completed` (boolean)
  - `duration_minutes` (integer)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### posts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `routine_id` (uuid, references routines, nullable) - if sharing a routine
  - `post_type` (text) - 'routine', 'goal', 'achievement'
  - `likes_count` (integer)
  - `created_at` (timestamptz)

  ### post_likes
  - `id` (uuid, primary key)
  - `post_id` (uuid, references posts)
  - `user_id` (uuid, references profiles)
  - `created_at` (timestamptz)
  - Unique constraint on (post_id, user_id)

  ### comments
  - `id` (uuid, primary key)
  - `post_id` (uuid, references posts)
  - `user_id` (uuid, references profiles)
  - `content` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can read their own profile and public profiles
  - Users can update their own profile
  - Users can create routines and manage their own routines
  - Public routines are readable by all authenticated users
  - Coaches can view their trainers' data
  - Social features have appropriate read/write permissions
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'trainer' CHECK (role IN ('trainer', 'coach')),
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  coach_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  fuerza integer DEFAULT 50 CHECK (fuerza >= 0 AND fuerza <= 100),
  resistencia integer DEFAULT 50 CHECK (resistencia >= 0 AND resistencia <= 100),
  tecnica integer DEFAULT 50 CHECK (tecnica >= 0 AND tecnica <= 100),
  definicion integer DEFAULT 50 CHECK (definicion >= 0 AND definicion <= 100),
  constancia integer DEFAULT 50 CHECK (constancia >= 0 AND constancia <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  difficulty text DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer DEFAULT 30,
  is_public boolean DEFAULT false,
  is_default boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public and default routines"
  ON routines FOR SELECT
  TO authenticated
  USING (is_public = true OR is_default = true OR creator_id = auth.uid());

CREATE POLICY "Users can insert own routines"
  ON routines FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  sets integer DEFAULT 3,
  reps text DEFAULT '10',
  rest_seconds integer DEFAULT 60,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exercises of accessible routines"
  ON exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = exercises.routine_id
      AND (routines.is_public = true OR routines.is_default = true OR routines.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert exercises to own routines"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in own routines"
  ON exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from own routines"
  ON exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

-- Workout sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean DEFAULT false,
  duration_minutes integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workout sessions"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view trainers workout sessions"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = workout_sessions.user_id
      AND profiles.coach_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout sessions"
  ON workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own workout sessions"
  ON workout_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own workout sessions"
  ON workout_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  post_type text DEFAULT 'goal' CHECK (post_type IN ('routine', 'goal', 'achievement')),
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all post likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own post likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own post likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_coach_id ON profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_routines_creator_id ON routines(creator_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_public ON routines(is_public);
CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);