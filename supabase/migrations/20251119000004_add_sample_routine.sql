-- Create a sample routine with exercises for demonstration
INSERT INTO routines (creator_id, title, description, difficulty, duration_minutes, is_default, is_public) VALUES
((SELECT id FROM profiles LIMIT 1), 'Rutina Full Body Básica', 'Rutina completa para principiantes que trabaja todo el cuerpo', 'beginner', 30, true, true);

-- Add exercises to the sample routine
INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index) VALUES
((SELECT id FROM routines WHERE title = 'Rutina Full Body Básica' LIMIT 1), 'Push-ups', 'Flexiones de brazos clásicas para pecho, hombros y tríceps', 3, '8-10', 60, 1),
((SELECT id FROM routines WHERE title = 'Rutina Full Body Básica' LIMIT 1), 'Squats', 'Sentadillas para trabajar piernas y glúteos', 3, '12-15', 45, 2),
((SELECT id FROM routines WHERE title = 'Rutina Full Body Básica' LIMIT 1), 'Plank', 'Tabla para fortalecer el core', 3, '20-30 segundos', 30, 3),
((SELECT id FROM routines WHERE title = 'Rutina Full Body Básica' LIMIT 1), 'Lunges', 'Zancadas alternas para piernas', 3, '8 por pierna', 45, 4),
((SELECT id FROM routines WHERE title = 'Rutina Full Body Básica' LIMIT 1), 'Superman', 'Ejercicio para espalda y glúteos', 3, '10-12', 30, 5);