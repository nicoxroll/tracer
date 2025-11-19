import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Play, Clock, Target, Zap, Calendar } from "lucide-react";
import WorkoutSession from "./WorkoutSession";

type Routine = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration_minutes: number;
  is_public: boolean;
  is_default: boolean;
  creator_id: string;
};

export default function Tracking() {
  const { profile } = useAuth();
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [workoutSessionActive, setWorkoutSessionActive] = useState(false);

  useEffect(() => {
    if (profile) {
      loadTodayRoutine();
    }
  }, [profile]);

  async function loadTodayRoutine() {
    try {
      // Get current day in Spanish
      const days = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
      const today = days[new Date().getDay()];

      // Get the routine assigned to today
      const { data: weeklyPlan, error: planError } = await supabase
        .from("weekly_plans")
        .select("routine_id")
        .eq("user_id", profile?.id)
        .eq("day_of_week", today)
        .maybeSingle();

      if (planError) throw planError;

      if (weeklyPlan?.routine_id) {
        // Load the routine details
        const { data: routine, error: routineError } = await supabase
          .from("routines")
          .select("*")
          .eq("id", weeklyPlan.routine_id)
          .maybeSingle();

        if (routineError) throw routineError;
        setTodayRoutine(routine);
      }
    } catch (error) {
      console.error("Error loading today routine:", error);
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-500";
      case "intermediate":
        return "text-yellow-500";
      case "advanced":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Principiante";
      case "intermediate":
        return "Intermedio";
      case "advanced":
        return "Avanzado";
      default:
        return difficulty;
    }
  };

  const handleWorkoutComplete = () => {
    setWorkoutSessionActive(false);
    loadTodayRoutine(); // Reload to update any changes
  };

  const toggleWorkoutSession = () => {
    setWorkoutSessionActive(!workoutSessionActive);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          workoutSessionActive ? "mr-96" : ""
        }`}
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-thin text-white mb-2">
              Seguimiento de Entrenamiento
            </h1>
            <p className="text-gray-400 font-light">
              Tu rutina programada para hoy
            </p>
          </div>

          {todayRoutine ? (
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-thin text-white mb-2">
                  {todayRoutine.title}
                </h2>
                <p className="text-gray-400 font-light">
                  {todayRoutine.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-6 text-center">
                  <Clock className="w-8 h-8 text-white mx-auto mb-3" />
                  <div className="text-2xl font-thin text-white mb-1">
                    {todayRoutine.duration_minutes}
                  </div>
                  <div className="text-sm text-gray-400 font-light">
                    Minutos
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-6 text-center">
                  <Target className="w-8 h-8 text-white mx-auto mb-3" />
                  <div
                    className={`text-2xl font-thin mb-1 ${getDifficultyColor(
                      todayRoutine.difficulty
                    )}`}
                  >
                    {getDifficultyText(todayRoutine.difficulty)}
                  </div>
                  <div className="text-sm text-gray-400 font-light">
                    Dificultad
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-6 text-center">
                  <Zap className="w-8 h-8 text-white mx-auto mb-3" />
                  <div className="text-2xl font-thin text-white mb-1">
                    Listo
                  </div>
                  <div className="text-sm text-gray-400 font-light">Estado</div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={toggleWorkoutSession}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300 text-lg"
                >
                  <Play className="w-6 h-6" />
                  {workoutSessionActive
                    ? "Ocultar Entrenamiento"
                    : "Iniciar Entrenamiento"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-12 text-center">
              <div className="w-16 h-16 bg-[#0a0a0a] border border-[#1f1f1f] rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-thin text-white mb-2">
                No hay rutina programada
              </h2>
              <p className="text-gray-400 font-light mb-6">
                No tienes una rutina asignada para hoy. Ve al Plan Semanal para
                organizar tus entrenamientos.
              </p>
              <Link
                to="/weekly-planner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                Ir al Plan Semanal
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Workout Session Sidebar */}
      {workoutSessionActive && todayRoutine && (
        <WorkoutSession
          routineId={todayRoutine.id}
          routineTitle={todayRoutine.title}
          onWorkoutComplete={handleWorkoutComplete}
          onToggleActive={toggleWorkoutSession}
        />
      )}
    </div>
  );
}
