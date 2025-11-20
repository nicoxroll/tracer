import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Pause,
  Play,
  Square,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type Exercise = {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
};

type WorkoutSession = {
  id: string;
  routine_id: string;
  completed: boolean;
  duration_minutes: number;
  notes: string;
};

type WorkoutSessionProps = {
  routineId: string;
  routineTitle: string;
  onWorkoutComplete?: () => void;
  onToggleActive: () => void;
};

export default function WorkoutSession({
  routineId,
  routineTitle,
  onWorkoutComplete,
  onToggleActive,
}: WorkoutSessionProps) {
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0); // in seconds
  const [restTime, setRestTime] = useState(0); // in seconds
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("routine_id", routineId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  }, [routineId]);

  const loadExistingSession = useCallback(async () => {
    if (!profile) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .eq("routine_id", routineId)
        .eq("date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSessionId(data.id);
        // If session exists, load progress (this would need additional tracking)
        // For now, we'll start fresh but could load from a progress table
      }
    } catch (error) {
      console.error("Error loading existing session:", error);
    }
  }, [profile, routineId]);

  useEffect(() => {
    loadExercises();
    loadExistingSession();
  }, [loadExercises, loadExistingSession]);

  async function startWorkout() {
    if (!profile) return;

    setSessionStarted(true);
    setIsWorkoutRunning(true);
    onToggleActive();

    if (!sessionId) {
      try {
        const { data, error } = await supabase
          .from("workout_sessions")
          .insert({
            user_id: profile.id,
            routine_id: routineId,
            date: new Date().toISOString().split("T")[0],
            completed: false,
            duration_minutes: 0,
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(data.id);
      } catch (error) {
        console.error("Error creating workout session:", error);
      }
    }
  }

  async function completeWorkout() {
    if (!sessionId) return;

    const totalMinutes = Math.round(workoutTime / 60);

    try {
      const { error } = await supabase
        .from("workout_sessions")
        .update({
          completed: true,
          duration_minutes: totalMinutes,
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Update user stats based on completed exercises
      await updateUserStats();

      setSessionStarted(false);
      setIsWorkoutRunning(false);
      setWorkoutTime(0);
      setRestTime(0);
      setCurrentExerciseIndex(0);
      setCompletedExercises(new Set());
      setIsResting(false);

      onToggleActive();
      onWorkoutComplete?.();
    } catch (error) {
      console.error("Error completing workout:", error);
    }
  }

  async function updateUserStats() {
    if (!profile) return;

    // Simple stat increase based on workout completion
    const statIncrease = Math.min(
      2,
      Math.floor((completedExercises.size / exercises.length) * 3)
    );

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          fuerza: Math.min(100, profile.fuerza + statIncrease),
          resistencia: Math.min(100, profile.resistencia + statIncrease),
          tecnica: Math.min(100, profile.tecnica + statIncrease),
          definicion: Math.min(100, profile.definicion + statIncrease),
          constancia: Math.min(100, profile.constancia + statIncrease),
        })
        .eq("id", profile.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  function toggleExerciseCompletion(exerciseId: string) {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  }

  function startRest(seconds: number) {
    setRestTime(seconds);
    setIsResting(true);
    setIsWorkoutRunning(false);
  }

  function nextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setIsResting(false);
      setRestTime(0);
    }
  }

  function previousExercise() {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
      setIsResting(false);
      setRestTime(0);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  const currentExercise = exercises[currentExerciseIndex];
  const isCompleted = currentExercise
    ? completedExercises.has(currentExercise.id)
    : false;
  const progress =
    exercises.length > 0
      ? (completedExercises.size / exercises.length) * 100
      : 0;

  if (loading) {
    return (
      <div className="w-96 bg-[#141414] border-l border-[#1f1f1f] h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-96 bg-[#141414] border-l border-[#1f1f1f] h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-thin text-white">Entrenamiento</h2>
          <div className="flex items-center gap-2">
            {sessionStarted && (
              <button
                onClick={() => setIsWorkoutRunning(!isWorkoutRunning)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isWorkoutRunning ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
            )}
            <button
              onClick={onToggleActive}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Square className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-light text-white mb-1">{routineTitle}</h3>
          <div className="w-full bg-[#0a0a0a] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {completedExercises.size} de {exercises.length} ejercicios
            completados
          </p>
        </div>

        {/* Timer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-3 text-center">
            <Clock className="w-5 h-5 text-white mx-auto mb-1" />
            <div className="text-lg font-thin text-white">
              {formatTime(workoutTime)}
            </div>
            <div className="text-xs text-gray-400">Entrenamiento</div>
          </div>
          <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-3 text-center">
            <Timer className="w-5 h-5 text-white mx-auto mb-1" />
            <div className="text-lg font-thin text-white">
              {isResting ? formatTime(restTime) : "00:00"}
            </div>
            <div className="text-xs text-gray-400">Descanso</div>
          </div>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!sessionStarted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#0a0a0a] border border-[#1f1f1f] rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-thin text-white mb-2">
              Listo para entrenar
            </h3>
            <p className="text-gray-400 font-light mb-6">
              Comienza tu rutina de {exercises.length} ejercicios
            </p>
            <button
              onClick={startWorkout}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300 text-lg"
            >
              <Play className="w-6 h-6" />
              Iniciar Entrenamiento
            </button>
          </div>
        ) : currentExercise ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={previousExercise}
                  disabled={currentExerciseIndex === 0}
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400">
                  {currentExerciseIndex + 1} de {exercises.length}
                </span>
                <button
                  onClick={nextExercise}
                  disabled={currentExerciseIndex === exercises.length - 1}
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => toggleExerciseCompletion(currentExercise.id)}
                className={`p-2 rounded-full transition-colors ${
                  isCompleted
                    ? "text-green-500 hover:text-green-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-xl font-light text-white mb-2">
                {currentExercise.name}
              </h4>
              {currentExercise.description && (
                <p className="text-gray-400 text-sm font-light mb-4">
                  {currentExercise.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4 text-center">
                  <div className="text-2xl font-thin text-white mb-1">
                    {currentExercise.sets}
                  </div>
                  <div className="text-xs text-gray-400">Series</div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4 text-center">
                  <div className="text-2xl font-thin text-white mb-1">
                    {currentExercise.reps}
                  </div>
                  <div className="text-xs text-gray-400">Repeticiones</div>
                </div>
              </div>
            </div>

            {/* Rest Timer */}
            {isResting ? (
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4 text-center mb-4">
                <div className="text-3xl font-thin text-white mb-2">
                  {formatTime(restTime)}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  Tiempo de descanso
                </div>
                <button
                  onClick={() => {
                    setIsResting(false);
                    setRestTime(0);
                  }}
                  className="px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => startRest(currentExercise.rest_seconds)}
                  className="w-full px-4 py-3 bg-[#1f1f1f] text-white rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300"
                >
                  Iniciar Descanso ({currentExercise.rest_seconds}s)
                </button>

                <button
                  onClick={nextExercise}
                  disabled={currentExerciseIndex === exercises.length - 1}
                  className="w-full px-4 py-3 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentExerciseIndex === exercises.length - 1
                    ? "Finalizar"
                    : "Siguiente Ejercicio"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 font-light">
              No hay ejercicios en esta rutina
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {sessionStarted && (
        <div className="p-6 border-t border-[#1f1f1f]">
          <button
            onClick={completeWorkout}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-sm font-light hover:bg-green-700 transition-all duration-300"
          >
            Finalizar Entrenamiento
          </button>
        </div>
      )}
    </div>
  );
}
