-- Add experience and level system to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level text DEFAULT 'E' CHECK (level IN ('E', 'D', 'C', 'B', 'A', 'S'));

-- Create experience_history table to track experience gains
CREATE TABLE IF NOT EXISTS experience_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  experience_gained integer NOT NULL,
  reason text NOT NULL, -- 'workout_completed', 'challenge_completed', etc.
  related_id uuid, -- could reference workout_session, challenge, etc.
  created_at timestamptz DEFAULT now()
);

ALTER TABLE experience_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own experience history"
  ON experience_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own experience history"
  ON experience_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_experience_history_user_id ON experience_history(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_history_created_at ON experience_history(created_at DESC);