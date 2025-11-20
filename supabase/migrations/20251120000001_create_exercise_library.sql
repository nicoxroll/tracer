/*
  # Exercise Library Schema

  ## New Tables

  ### exercise_library
  - `id` (uuid, primary key)
  - `name` (text) - Exercise name
  - `description` (text) - Detailed description
  - `image_url` (text) - URL to exercise illustration
  - `exercise_type` (text) - 'strength', 'cardio', 'flexibility', 'plyometric'
  - `equipment` (text) - 'barbell', 'dumbbell', 'machine', 'bodyweight', 'cable', etc.
  - `muscle_groups` (text array) - Primary and secondary muscle groups
  - `difficulty` (text) - 'beginner', 'intermediate', 'advanced'
  - `instructions` (text array) - Step by step instructions
  - `created_at` (timestamptz)

  ### routine_exercises (replaces exercises table functionality)
  - `id` (uuid, primary key)
  - `routine_id` (uuid, references routines)
  - `exercise_id` (uuid, references exercise_library)
  - `sets` (integer)
  - `reps` (text)
  - `weight_kg` (decimal) - Weight to use
  - `rest_seconds` (integer)
  - `order_index` (integer)
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - Exercise library is readable by all authenticated users
  - Only admins can modify exercise library
  - Users can create routine_exercises for their own routines
*/

-- Create exercise library table
CREATE TABLE IF NOT EXISTS exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  exercise_type text DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'plyometric')),
  equipment text DEFAULT 'bodyweight',
  muscle_groups text[] DEFAULT '{}',
  difficulty text DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exercise library"
  ON exercise_library FOR SELECT
  TO authenticated
  USING (true);

-- Create routine exercises table
CREATE TABLE IF NOT EXISTS routine_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  sets integer DEFAULT 3,
  reps text DEFAULT '10',
  weight_kg decimal DEFAULT 0,
  rest_seconds integer DEFAULT 60,
  order_index integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routine exercises of accessible routines"
  ON routine_exercises FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND (routines.is_public = true OR routines.is_default = true OR routines.creator_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert routine exercises to own routines"
  ON routine_exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update routine exercises in own routines"
  ON routine_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete routine exercises from own routines"
  ON routine_exercises FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_exercises.routine_id
      AND routines.creator_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle_groups ON exercise_library USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library(equipment);
CREATE INDEX IF NOT EXISTS idx_exercise_library_type ON exercise_library(exercise_type);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);

-- Insert comprehensive exercise library
INSERT INTO exercise_library (name, description, image_url, exercise_type, equipment, muscle_groups, difficulty, instructions) VALUES
-- PECHO
('Press de Banca con Barra', 'Ejercicio fundamental para desarrollar el pecho, hombros y tríceps', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'strength', 'barbell', ARRAY['pecho', 'tríceps', 'hombros'], 'intermediate', ARRAY['Acuéstate en el banco con los pies firmes en el suelo', 'Agarra la barra con las manos ligeramente más anchas que los hombros', 'Baja la barra controladamente hasta el pecho', 'Empuja la barra hacia arriba hasta extender los brazos']),
('Press de Banca con Mancuernas', 'Permite mayor rango de movimiento y trabajo unilateral', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', 'strength', 'dumbbell', ARRAY['pecho', 'tríceps', 'hombros'], 'intermediate', ARRAY['Acuéstate en el banco con una mancuerna en cada mano', 'Inicia con los brazos extendidos sobre el pecho', 'Baja las mancuernas controladamente', 'Empuja hacia arriba hasta la posición inicial']),
('Press Inclinado con Barra', 'Enfatiza la parte superior del pecho', 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', 'strength', 'barbell', ARRAY['pecho superior', 'hombros', 'tríceps'], 'intermediate', ARRAY['Ajusta el banco a 30-45 grados', 'Agarra la barra con agarre medio-ancho', 'Baja la barra a la parte superior del pecho', 'Empuja hacia arriba explosivamente']),
('Press Declinado', 'Trabaja la parte inferior del pecho', 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400', 'strength', 'barbell', ARRAY['pecho inferior', 'tríceps'], 'intermediate', ARRAY['Colócate en el banco declinado', 'Baja la barra a la parte inferior del pecho', 'Empuja hacia arriba manteniendo control']),
('Aperturas con Mancuernas', 'Aislamiento del pecho con énfasis en el estiramiento', 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400', 'strength', 'dumbbell', ARRAY['pecho'], 'beginner', ARRAY['Acuéstate con mancuernas sobre el pecho', 'Baja los brazos en arco amplio', 'Mantén una ligera flexión en los codos', 'Regresa a la posición inicial']),
('Fondos en Paralelas', 'Ejercicio de peso corporal para pecho y tríceps', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400', 'strength', 'bodyweight', ARRAY['pecho', 'tríceps', 'hombros'], 'advanced', ARRAY['Sujeta las barras paralelas', 'Baja el cuerpo inclinándote hacia adelante', 'Sube hasta extender los brazos']),
('Cruces en Polea', 'Aislamiento del pecho con tensión constante', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 'strength', 'cable', ARRAY['pecho'], 'beginner', ARRAY['Sujeta las poleas a la altura de los hombros', 'Da un paso adelante para tensión', 'Cruza las manos frente al pecho', 'Regresa controladamente']),
('Press con Máquina', 'Ejercicio guiado para principiantes', 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400', 'strength', 'machine', ARRAY['pecho', 'tríceps'], 'beginner', ARRAY['Ajusta el asiento a la altura correcta', 'Agarra los mangos', 'Empuja hacia adelante', 'Regresa controladamente']),

-- ESPALDA
('Dominadas', 'Ejercicio rey para la espalda', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400', 'strength', 'bodyweight', ARRAY['dorsales', 'bíceps', 'hombros'], 'advanced', ARRAY['Cuelga de la barra con agarre amplio', 'Tira hacia arriba hasta que la barbilla pase la barra', 'Baja controladamente']),
('Remo con Barra', 'Desarrollo de grosor en la espalda', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'strength', 'barbell', ARRAY['dorsales', 'trapecio', 'bíceps'], 'intermediate', ARRAY['Inclínate hacia adelante con la espalda recta', 'Agarra la barra con agarre prono', 'Tira la barra hacia el abdomen', 'Baja controladamente']),
('Peso Muerto', 'Ejercicio compuesto para todo el cuerpo', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', 'strength', 'barbell', ARRAY['espalda baja', 'glúteos', 'isquiotibiales', 'trapecio'], 'advanced', ARRAY['Coloca los pies al ancho de caderas', 'Agarra la barra con las manos fuera de las piernas', 'Levanta manteniendo la espalda recta', 'Baja controladamente']),
('Remo con Mancuerna', 'Trabajo unilateral de la espalda', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', 'strength', 'dumbbell', ARRAY['dorsales', 'trapecio', 'bíceps'], 'beginner', ARRAY['Apoya una rodilla en el banco', 'Tira la mancuerna hacia la cadera', 'Mantén el codo cerca del cuerpo', 'Baja controladamente']),
('Jalón al Pecho', 'Alternativa a las dominadas', 'https://images.unsplash.com/photo-1584863231364-2edc166de576?w=400', 'strength', 'cable', ARRAY['dorsales', 'bíceps'], 'beginner', ARRAY['Siéntate y agarra la barra amplia', 'Tira hacia el pecho', 'Controla la subida', 'Mantén el torso estable']),
('Remo en Polea Baja', 'Trabajo de espalda media', 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400', 'strength', 'cable', ARRAY['dorsales', 'trapecio medio'], 'beginner', ARRAY['Siéntate con los pies apoyados', 'Tira del mango hacia el abdomen', 'Aprieta las escápulas', 'Extiende controladamente']),
('Pull Over con Mancuerna', 'Expansión de la caja torácica', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', 'strength', 'dumbbell', ARRAY['dorsales', 'pecho', 'tríceps'], 'intermediate', ARRAY['Acuéstate perpendicular al banco', 'Sujeta una mancuerna sobre el pecho', 'Baja detrás de la cabeza', 'Sube manteniendo los brazos semi-extendidos']),
('Face Pull', 'Salud del hombro y desarrollo de deltoides posteriores', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', 'strength', 'cable', ARRAY['deltoides posterior', 'trapecio', 'manguito rotador'], 'beginner', ARRAY['Ajusta la polea a la altura de la cara', 'Tira hacia la cara separando las manos', 'Contrae las escápulas', 'Regresa controladamente']),

-- PIERNAS
('Sentadilla con Barra', 'Rey de los ejercicios de piernas', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', 'strength', 'barbell', ARRAY['cuádriceps', 'glúteos', 'isquiotibiales'], 'intermediate', ARRAY['Coloca la barra en la parte superior de la espalda', 'Baja manteniendo la espalda recta', 'Desciende hasta que los muslos estén paralelos', 'Sube empujando con los talones']),
('Sentadilla Frontal', 'Mayor énfasis en cuádriceps', 'https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=400', 'strength', 'barbell', ARRAY['cuádriceps', 'core'], 'advanced', ARRAY['Coloca la barra sobre los deltoides frontales', 'Mantén los codos elevados', 'Baja manteniendo el torso vertical', 'Sube explosivamente']),
('Prensa de Piernas', 'Ejercicio seguro para cargar peso', 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400', 'strength', 'machine', ARRAY['cuádriceps', 'glúteos'], 'beginner', ARRAY['Coloca los pies en la plataforma', 'Baja la plataforma controladamente', 'Empuja hasta casi extender las piernas']),
('Zancadas con Mancuernas', 'Trabajo unilateral de piernas', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 'strength', 'dumbbell', ARRAY['cuádriceps', 'glúteos'], 'intermediate', ARRAY['Da un paso largo hacia adelante', 'Baja la rodilla trasera casi hasta el suelo', 'Empuja con el talón delantero para subir', 'Alterna las piernas']),
('Peso Muerto Rumano', 'Enfoque en isquiotibiales y glúteos', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', 'strength', 'barbell', ARRAY['isquiotibiales', 'glúteos', 'espalda baja'], 'intermediate', ARRAY['Sujeta la barra con agarre prono', 'Inclínate hacia adelante con las piernas semi-flexionadas', 'Baja la barra por las piernas', 'Sube contrayendo glúteos']),
('Curl de Pierna', 'Aislamiento de isquiotibiales', 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400', 'strength', 'machine', ARRAY['isquiotibiales'], 'beginner', ARRAY['Acuéstate boca abajo en la máquina', 'Flexiona las piernas llevando los talones a los glúteos', 'Baja controladamente']),
('Extensión de Cuádriceps', 'Aislamiento de cuádriceps', 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400', 'strength', 'machine', ARRAY['cuádriceps'], 'beginner', ARRAY['Siéntate en la máquina', 'Extiende las piernas completamente', 'Baja controladamente sin soltar la tensión']),
('Elevación de Gemelos de Pie', 'Desarrollo de pantorrillas', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', 'strength', 'machine', ARRAY['gemelos'], 'beginner', ARRAY['Colócate en la máquina con los hombros bajo las almohadillas', 'Eleva los talones lo más alto posible', 'Baja hasta sentir estiramiento']),
('Sentadilla Búlgara', 'Ejercicio unilateral avanzado', 'https://images.unsplash.com/photo-1566241477600-ac026ad43874?w=400', 'strength', 'dumbbell', ARRAY['cuádriceps', 'glúteos'], 'advanced', ARRAY['Coloca un pie en un banco detrás de ti', 'Baja flexionando la pierna delantera', 'Mantén el torso erguido', 'Sube empujando con el talón']),
('Hip Thrust', 'Activación máxima de glúteos', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', 'strength', 'barbell', ARRAY['glúteos', 'isquiotibiales'], 'intermediate', ARRAY['Apoya la espalda superior en un banco', 'Coloca la barra sobre las caderas', 'Empuja las caderas hacia arriba', 'Aprieta los glúteos en la parte superior']),

-- HOMBROS
('Press Militar con Barra', 'Desarrollo general de hombros', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'strength', 'barbell', ARRAY['deltoides', 'tríceps'], 'intermediate', ARRAY['De pie con la barra a la altura de los hombros', 'Empuja la barra hacia arriba', 'Extiende completamente los brazos', 'Baja controladamente']),
('Press con Mancuernas Sentado', 'Mayor rango de movimiento', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400', 'strength', 'dumbbell', ARRAY['deltoides', 'tríceps'], 'beginner', ARRAY['Siéntate con respaldo', 'Empuja las mancuernas hacia arriba', 'Junta las mancuernas en la parte superior', 'Baja controladamente']),
('Elevaciones Laterales', 'Aislamiento de deltoides lateral', 'https://images.unsplash.com/photo-1584863231364-2edc166de576?w=400', 'strength', 'dumbbell', ARRAY['deltoides lateral'], 'beginner', ARRAY['De pie con mancuernas a los lados', 'Eleva los brazos lateralmente', 'Sube hasta la altura de los hombros', 'Baja controladamente']),
('Elevaciones Frontales', 'Trabajo de deltoides frontal', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', 'strength', 'dumbbell', ARRAY['deltoides frontal'], 'beginner', ARRAY['Sujeta las mancuernas frente a los muslos', 'Eleva los brazos al frente', 'Sube hasta la altura de los hombros', 'Baja con control']),
('Pájaros con Mancuernas', 'Deltoides posterior', 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400', 'strength', 'dumbbell', ARRAY['deltoides posterior'], 'intermediate', ARRAY['Inclínate hacia adelante', 'Eleva las mancuernas lateralmente', 'Aprieta las escápulas', 'Baja controladamente']),
('Press Arnold', 'Ejercicio completo de hombros', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', 'strength', 'dumbbell', ARRAY['deltoides', 'tríceps'], 'intermediate', ARRAY['Inicia con mancuernas frente al pecho', 'Gira las manos mientras empujas arriba', 'Termina con palmas hacia adelante', 'Regresa invirtiendo el movimiento']),
('Remo al Mentón', 'Desarrollo de trapecios y deltoides', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', 'strength', 'barbell', ARRAY['trapecio', 'deltoides'], 'intermediate', ARRAY['Agarra la barra con agarre estrecho', 'Tira hacia arriba manteniendo cerca del cuerpo', 'Sube hasta la altura del mentón', 'Baja controladamente']),

-- BRAZOS
('Curl de Bíceps con Barra', 'Ejercicio fundamental para bíceps', 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400', 'strength', 'barbell', ARRAY['bíceps'], 'beginner', ARRAY['De pie con la barra en las manos', 'Flexiona los codos llevando la barra al pecho', 'Mantén los codos fijos', 'Baja controladamente']),
('Curl con Mancuernas', 'Trabajo alternado o simultáneo', 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400', 'strength', 'dumbbell', ARRAY['bíceps'], 'beginner', ARRAY['De pie con mancuernas', 'Flexiona un brazo o ambos', 'Rota la muñeca al subir', 'Baja con control']),
('Curl Martillo', 'Trabaja bíceps y antebrazo', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 'strength', 'dumbbell', ARRAY['bíceps', 'antebrazo'], 'beginner', ARRAY['Mancuernas con agarre neutro', 'Flexiona manteniendo las palmas enfrentadas', 'Contrae en la parte superior', 'Baja controladamente']),
('Curl Predicador', 'Aislamiento estricto del bíceps', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', 'strength', 'barbell', ARRAY['bíceps'], 'intermediate', ARRAY['Apoya los brazos en el banco predicador', 'Flexiona hasta contraer completamente', 'Baja hasta casi extender', 'Mantén tensión constante']),
('Press Francés', 'Extensión de tríceps acostado', 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400', 'strength', 'barbell', ARRAY['tríceps'], 'intermediate', ARRAY['Acostado con barra sobre la frente', 'Extiende los brazos hacia arriba', 'Mantén los codos fijos', 'Baja solo los antebrazos']),
('Extensión de Tríceps en Polea', 'Aislamiento con tensión constante', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'strength', 'cable', ARRAY['tríceps'], 'beginner', ARRAY['Sujeta la cuerda o barra', 'Empuja hacia abajo', 'Extiende completamente', 'Sube controladamente']),
('Fondos para Tríceps', 'Ejercicio de peso corporal', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400', 'strength', 'bodyweight', ARRAY['tríceps', 'pecho'], 'intermediate', ARRAY['Apoya las manos en banco o barras', 'Mantén el cuerpo vertical', 'Baja flexionando los codos', 'Empuja hasta extender']),
('Patada de Tríceps', 'Aislamiento del tríceps', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', 'strength', 'dumbbell', ARRAY['tríceps'], 'beginner', ARRAY['Inclínate con una mancuerna', 'Mantén el brazo pegado al cuerpo', 'Extiende hacia atrás', 'Contrae el tríceps']),

-- CORE
('Plancha Abdominal', 'Ejercicio isométrico fundamental', 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400', 'strength', 'bodyweight', ARRAY['core', 'abdominales'], 'beginner', ARRAY['Posición de flexión sobre antebrazos', 'Mantén el cuerpo en línea recta', 'Contrae el abdomen', 'Mantén la posición']),
('Crunch Abdominal', 'Trabajo de abdominales superiores', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', 'strength', 'bodyweight', ARRAY['abdominales superiores'], 'beginner', ARRAY['Acostado con rodillas flexionadas', 'Eleva el torso superior', 'Contrae el abdomen', 'Baja sin tocar completamente']),
('Elevación de Piernas', 'Trabajo de abdominales inferiores', 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400', 'strength', 'bodyweight', ARRAY['abdominales inferiores'], 'intermediate', ARRAY['Acostado o colgado de barra', 'Eleva las piernas manteniendo control', 'Sube hasta 90 grados', 'Baja sin balancear']),
('Russian Twist', 'Trabajo de oblicuos', 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400', 'strength', 'bodyweight', ARRAY['oblicuos', 'core'], 'intermediate', ARRAY['Siéntate con piernas elevadas', 'Rota el torso de lado a lado', 'Toca el suelo a cada lado', 'Mantén el equilibrio']),
('Plancha Lateral', 'Fortalecimiento de oblicuos', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', 'strength', 'bodyweight', ARRAY['oblicuos', 'core'], 'intermediate', ARRAY['Apóyate sobre un antebrazo', 'Eleva las caderas', 'Mantén el cuerpo alineado', 'Aguanta la posición']),
('Mountain Climbers', 'Ejercicio dinámico de core', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', 'strength', 'bodyweight', ARRAY['core', 'cardio'], 'intermediate', ARRAY['Posición de plancha alta', 'Lleva rodillas al pecho alternadamente', 'Mantén caderas estables', 'Muévete de forma rápida']),
('Rueda Abdominal', 'Ejercicio avanzado de core', 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400', 'strength', 'equipment', ARRAY['core', 'abdominales'], 'advanced', ARRAY['Arrodillado con rueda', 'Rueda hacia adelante extendiendo', 'Mantén la espalda recta', 'Regresa usando el core']),

-- CARDIO
('Burpees', 'Ejercicio de cuerpo completo', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'cardio', 'bodyweight', ARRAY['cuerpo completo', 'cardio'], 'intermediate', ARRAY['Inicia de pie', 'Baja a posición de flexión', 'Haz una flexión', 'Salta hacia arriba']),
('Saltos de Caja', 'Ejercicio pliométrico', 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400', 'plyometric', 'equipment', ARRAY['piernas', 'cardio'], 'intermediate', ARRAY['Párate frente a una caja', 'Salta sobre ella', 'Aterriza suavemente', 'Baja con control']),
('Sprints', 'Carrera de alta intensidad', 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=400', 'cardio', 'bodyweight', ARRAY['piernas', 'cardio'], 'intermediate', ARRAY['Corre a máxima velocidad', 'Mantén por intervalos cortos', 'Descansa entre series']),
('Jumping Jacks', 'Ejercicio cardiovascular básico', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', 'cardio', 'bodyweight', ARRAY['cuerpo completo', 'cardio'], 'beginner', ARRAY['Salta abriendo piernas y brazos', 'Regresa a posición inicial', 'Mantén ritmo constante']),
('Battle Ropes', 'Ejercicio de alta intensidad', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', 'cardio', 'equipment', ARRAY['hombros', 'core', 'cardio'], 'advanced', ARRAY['Sujeta las cuerdas', 'Haz ondas alternadas o simultáneas', 'Mantén core activo', 'Controla la respiración']),

-- FUNCIONAL
('Swing con Kettlebell', 'Ejercicio de potencia', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', 'strength', 'kettlebell', ARRAY['glúteos', 'isquiotibiales', 'core'], 'intermediate', ARRAY['Piernas separadas con kettlebell entre ellas', 'Balancea entre las piernas', 'Empuja con caderas hacia adelante', 'Controla el regreso']),
('Turkish Get-Up', 'Ejercicio complejo funcional', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', 'strength', 'kettlebell', ARRAY['cuerpo completo', 'core'], 'advanced', ARRAY['Acostado con kettlebell arriba', 'Levántate siguiendo secuencia', 'Mantén kettlebell estable', 'Regresa con control']),
('Farmer Walk', 'Ejercicio de carga', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', 'strength', 'dumbbell', ARRAY['antebrazo', 'trapecio', 'core'], 'beginner', ARRAY['Sujeta pesas pesadas a los lados', 'Camina manteniendo postura', 'Mantén hombros hacia atrás', 'Aprieta el core']),
('Thruster', 'Combinación de sentadilla y press', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400', 'strength', 'barbell', ARRAY['piernas', 'hombros', 'cuerpo completo'], 'advanced', ARRAY['Sentadilla frontal', 'Al subir, empuja la barra arriba', 'Combina ambos movimientos fluidamente', 'Mantén ritmo constante']);
