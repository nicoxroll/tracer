-- Add sample exercises to existing routines
-- This migration adds exercises to routines that currently exist in the database

-- Get some exercise IDs for common exercises
DO $$
DECLARE
    pushup_id UUID;
    squat_id UUID;
    plank_id UUID;
    deadlift_id UUID;
    bench_press_id UUID;
    pullup_id UUID;
    shoulder_press_id UUID;
    bicep_curl_id UUID;
    tricep_extension_id UUID;
    routine_id UUID;
BEGIN
    -- Get exercise IDs
    SELECT id INTO pushup_id FROM exercise_library WHERE name = 'Fondos en Paralelas' LIMIT 1;
    SELECT id INTO squat_id FROM exercise_library WHERE name = 'Sentadilla con Barra' LIMIT 1;
    SELECT id INTO plank_id FROM exercise_library WHERE name = 'Plancha Abdominal' LIMIT 1;
    SELECT id INTO deadlift_id FROM exercise_library WHERE name = 'Peso Muerto' LIMIT 1;
    SELECT id INTO bench_press_id FROM exercise_library WHERE name = 'Press de Banca con Barra' LIMIT 1;
    SELECT id INTO pullup_id FROM exercise_library WHERE name = 'Dominadas' LIMIT 1;
    SELECT id INTO shoulder_press_id FROM exercise_library WHERE name = 'Press Militar con Barra' LIMIT 1;
    SELECT id INTO bicep_curl_id FROM exercise_library WHERE name = 'Curl de Bíceps con Barra' LIMIT 1;
    SELECT id INTO tricep_extension_id FROM exercise_library WHERE name = 'Extensión de Tríceps en Polea' LIMIT 1;

    -- Add exercises to default routines
    FOR routine_id IN
        SELECT id FROM routines WHERE is_default = true
    LOOP
        -- Add bench press to upper body routines
        IF pushup_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, pushup_id, 3, '8-12', 0, 90, 1, 'Enfócate en la forma correcta')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add squats to lower body routines
        IF squat_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, squat_id, 4, '8-10', 60, 120, 2, 'Mantén la espalda recta')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add deadlifts to full body routines
        IF deadlift_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, deadlift_id, 3, '6-8', 80, 150, 3, 'Calienta bien antes')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add plank for core work
        IF plank_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, plank_id, 3, '30-45 segundos', 0, 60, 4, 'Mantén el core contraído')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    -- Add exercises to user-created routines (if any exist)
    FOR routine_id IN
        SELECT id FROM routines WHERE is_default = false AND creator_id IS NOT NULL LIMIT 5
    LOOP
        -- Add bench press
        IF bench_press_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, bench_press_id, 3, '8-10', 50, 90, 1, 'Calienta con peso ligero')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add pull-ups
        IF pullup_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, pullup_id, 3, '6-8', 0, 120, 2, 'Usa asistencia si es necesario')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add shoulder press
        IF shoulder_press_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, shoulder_press_id, 3, '8-10', 30, 90, 3, 'Mantén el core activado')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add bicep curls
        IF bicep_curl_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, bicep_curl_id, 3, '10-12', 20, 60, 4, 'Controla el movimiento')
            ON CONFLICT DO NOTHING;
        END IF;

        -- Add tricep extensions
        IF tricep_extension_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, weight_kg, rest_seconds, order_index, notes)
            VALUES (routine_id, tricep_extension_id, 3, '10-12', 25, 60, 5, 'Mantén los codos fijos')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

END $$;