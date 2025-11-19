-- Add sample exercises to existing routines
-- First, let's add some exercises to the default routines that might exist

-- Insert exercises for routines (this will work if routines exist)
-- Note: This assumes some routines exist. In a real scenario, you'd want to check for existing routines first

-- For demonstration purposes, we'll create exercises that can be associated with routines
-- In a production app, you'd want to create these exercises when routines are created

-- Example exercises for different types of workouts
INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Push-ups',
  'Classic push-up exercise targeting chest, shoulders, and triceps',
  3,
  '10-12',
  60,
  1
FROM routines r 
WHERE r.title ILIKE '%push%' OR r.title ILIKE '%upper%' OR r.is_default = true
LIMIT 1;

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Squats',
  'Bodyweight squats for lower body strength',
  3,
  '15-20',
  45,
  2
FROM routines r 
WHERE r.title ILIKE '%squat%' OR r.title ILIKE '%lower%' OR r.title ILIKE '%full%' OR r.is_default = true
LIMIT 1;

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Plank',
  'Core stability exercise',
  3,
  '30-45 seconds',
  30,
  3
FROM routines r 
WHERE r.title ILIKE '%core%' OR r.title ILIKE '%abs%' OR r.title ILIKE '%full%' OR r.is_default = true
LIMIT 1;

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Pull-ups',
  'Upper body pulling exercise',
  3,
  '6-8',
  90,
  1
FROM routines r 
WHERE r.title ILIKE '%pull%' OR r.title ILIKE '%upper%' OR r.is_default = true
LIMIT 1;

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Lunges',
  'Unilateral lower body exercise',
  3,
  '10 per leg',
  45,
  2
FROM routines r 
WHERE r.title ILIKE '%lunge%' OR r.title ILIKE '%lower%' OR r.is_default = true
LIMIT 1;

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) 
SELECT 
  r.id,
  'Burpees',
  'Full body conditioning exercise',
  3,
  '8-10',
  60,
  1
FROM routines r 
WHERE r.title ILIKE '%burpee%' OR r.title ILIKE '%hiit%' OR r.title ILIKE '%conditioning%' OR r.is_default = true
LIMIT 1;