-- Create weight tracking table
CREATE TABLE IF NOT EXISTS weight_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE weight_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight tracking"
  ON weight_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own weight tracking"
  ON weight_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own weight tracking"
  ON weight_tracking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own weight tracking"
  ON weight_tracking FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_weight_tracking_user_id ON weight_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_tracking_date ON weight_tracking(date);