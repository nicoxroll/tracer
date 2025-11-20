import {
  Award,
  Calendar,
  Dumbbell,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { useWorkout } from "../contexts/WorkoutContext";
import { supabase } from "../lib/supabase";

export default function Home() {
  const { profile } = useAuth();
  const { startWorkout } = useWorkout();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    completedWorkouts: 0,
    currentStreak: 0,
    totalRoutines: 0,
    trainersCount: 0,
  });
  const [todayRoutine, setTodayRoutine] = useState<any>(null);
  const [todayStatus, setTodayStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadStats();
      loadTodayRoutine();
    }
  }, [profile]);

  async function loadStats() {
    if (!profile) return;

    try {
      setLoading(true);

      const { data: workouts } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", profile.id);

      const { data: routines } = await supabase
        .from("routines")
        .select("*")
        .eq("creator_id", profile.id);

      let trainersCount = 0;
      if (profile.role === "coach") {
        const { data: trainers } = await supabase
          .from("profiles")
          .select("id")
          .eq("coach_id", profile.id);
        trainersCount = trainers?.length || 0;
      }

      const completed = workouts?.filter((w) => w.completed).length || 0;

      setStats({
        totalWorkouts: workouts?.length || 0,
        completedWorkouts: completed,
        currentStreak: 0,
        totalRoutines: routines?.length || 0,
        trainersCount,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTodayRoutine() {
    if (!profile) return;

    try {
      // Get today's day name in Spanish
      const today = new Date();
      const dayNames = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
      ];
      const todayName = dayNames[today.getDay()];

      // Get weekly plan for today
      const { data: weeklyPlan } = await supabase
        .from("weekly_plans")
        .select("routine_id")
        .eq("user_id", profile.id)
        .eq("day_of_week", todayName)
        .single();

      if (weeklyPlan?.routine_id) {
        // Get routine details
        const { data: routine } = await supabase
          .from("routines")
          .select("*")
          .eq("id", weeklyPlan.routine_id)
          .single();

        setTodayRoutine(routine);

        // Get today's workout status
        const { data: workoutSession } = await supabase
          .from("workout_sessions")
          .select("completed")
          .eq("user_id", profile.id)
          .eq("date", today.toISOString().split("T")[0])
          .single();

        if (workoutSession) {
          setTodayStatus(workoutSession.completed ? "completed" : "in_progress");
        } else {
          setTodayStatus("pending");
        }
      } else {
        setTodayRoutine(null);
        setTodayStatus(null);
      }
    } catch (error) {
      console.error("Error loading today routine:", error);
      setTodayRoutine(null);
      setTodayStatus(null);
    }
  }

  async function startTodayWorkout() {
    if (!todayRoutine || !profile) return;

    try {
      // Load exercises for the routine
      const { data: exercises } = await supabase
        .from("exercises")
        .select("*")
        .eq("routine_id", todayRoutine.id)
        .order("order_index", { ascending: true });

      if (exercises && exercises.length > 0) {
        startWorkout(todayRoutine, exercises);
      }
    } catch (error) {
      console.error("Error starting workout:", error);
    }
  }

  const completionRate =
    stats.totalWorkouts > 0
      ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100)
      : 0;

  const getRank = (value: number): string => {
    if (value >= 90) return "S";
    if (value >= 80) return "A";
    if (value >= 70) return "B";
    if (value >= 60) return "C";
    if (value >= 50) return "D";
    return "E";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-thin text-white mb-2">
          Bienvenido, {profile?.full_name}
        </h1>
        <p className="text-gray-400 font-light">Tu centro de comando fitness</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-sm" />
              </div>
              <div className="text-3xl font-thin text-white mb-1">
                {stats.totalWorkouts}
              </div>
              <div className="text-sm text-gray-400 font-light">
                Entrenamientos Totales
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-gray-400" />
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-sm" />
              </div>
              <div className="text-3xl font-thin text-white mb-1">
                {stats.completedWorkouts}
              </div>
              <div className="text-sm text-gray-400 font-light">
                Completados
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-sm" />
              </div>
              <div className="text-3xl font-thin text-white mb-1">
                {stats.totalRoutines}
              </div>
              <div className="text-sm text-gray-400 font-light">
                Rutinas Creadas
              </div>
            </div>

            {profile?.role === "coach" ? (
              <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-sm" />
                </div>
                <div className="text-3xl font-thin text-white mb-1">
                  {stats.trainersCount}
                </div>
                <div className="text-sm text-gray-400 font-light">
                  Trainers a Cargo
                </div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-sm" />
                </div>
                <div className="text-3xl font-thin text-white mb-1">
                  {completionRate}%
                </div>
                <div className="text-sm text-gray-400 font-light">
                  Tasa de Éxito
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-gray-400" />
                <h2 className="text-2xl font-thin text-white">
                  Rutina de Hoy
                </h2>
              </div>

              <div className="space-y-4">
                {todayRoutine ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-light text-white">
                        {todayRoutine.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-light ${
                        todayStatus === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : todayStatus === "in_progress"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {todayStatus === "completed"
                          ? "Completado"
                          : todayStatus === "in_progress"
                          ? "En Progreso"
                          : "Pendiente"}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm font-light">
                      {todayRoutine.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span className="capitalize">{todayRoutine.difficulty}</span>
                      <span>{todayRoutine.duration_minutes} min</span>
                    </div>

                    {todayStatus !== "completed" && (
                      <button
                        onClick={startTodayWorkout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
                      >
                        <Dumbbell className="w-4 h-4" />
                        Iniciar Entrenamiento
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-light">
                      No hay rutina planificada para hoy
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-gray-400" />
                <h2 className="text-2xl font-thin text-white">
                  Comparación de Estadísticas
                </h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={[
                      {
                        stat: "Fuerza",
                        value: profile?.fuerza || 0,
                        rank: getRank(profile?.fuerza || 0),
                      },
                      {
                        stat: "Resistencia",
                        value: profile?.resistencia || 0,
                        rank: getRank(profile?.resistencia || 0),
                      },
                      {
                        stat: "Técnica",
                        value: profile?.tecnica || 0,
                        rank: getRank(profile?.tecnica || 0),
                      },
                      {
                        stat: "Velocidad",
                        value: profile?.definicion || 0,
                        rank: getRank(profile?.definicion || 0),
                      },
                      {
                        stat: "Constancia",
                        value: profile?.constancia || 0,
                        rank: getRank(profile?.constancia || 0),
                      },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="stat" />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickFormatter={(value) => {
                        if (value >= 90) return "S";
                        if (value >= 80) return "A";
                        if (value >= 70) return "B";
                        if (value >= 60) return "C";
                        if (value >= 50) return "D";
                        return "E";
                      }}
                    />
                    <Radar
                      name="Estadísticas"
                      dataKey="value"
                      stroke="#ffffff"
                      fill="#ffffff"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
