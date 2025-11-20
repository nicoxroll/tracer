import {
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type ExerciseLibrary = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  exercise_type: string;
  equipment: string;
  muscle_groups: string[];
  difficulty: string;
  instructions: string[];
};

type Routine = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  duration_minutes: number;
  is_public: boolean;
  is_default: boolean;
  creator_id: string;
  profiles?: {
    username: string;
  };
};

type DailyAssignment = {
  id: string;
  user_id: string;
  date: string;
  routine_id: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
};

type DailyRoutine = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string;
  difficulty: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
};

type DailyRoutineExercise = {
  id: string;
  daily_routine_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  weight_kg: number;
  rest_seconds: number;
  order_index: number;
  notes: string;
  exercise_library?: ExerciseLibrary;
};

type WeeklyPlan = {
  [key: string]: string | null; // day: routine_id
};

type WorkoutStatus = {
  [key: string]:
    | "pending"
    | "in_progress"
    | "completed"
    | "skipped"
    | "incomplete"
    | null;
};

export default function WeeklyPlanner() {
  const { profile } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>({});
  const [dailyAssignments, setDailyAssignments] = useState<DailyAssignment[]>(
    []
  );
  const [workoutStatuses, setWorkoutStatuses] = useState<WorkoutStatus>({});
  const [viewMode, setViewMode] = useState<"month" | "stats">("month");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | string | null>(null);
  const [selectedDayExercises, setSelectedDayExercises] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [applyToAllWeeks, setApplyToAllWeeks] = useState(false);
  const [editingDailyRoutine, setEditingDailyRoutine] =
    useState<DailyRoutine | null>(null);
  const [dailyRoutineExercises, setDailyRoutineExercises] = useState<
    DailyRoutineExercise[]
  >([]);

  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  const loadRoutines = useCallback(async () => {
    try {
      // Load all accessible routines: own, public, and default
      const { data, error } = await supabase
        .from("routines")
        .select(
          `
          *,
          profiles:creator_id (username)
        `
        )
        .or(`creator_id.eq.${profile?.id},is_public.eq.true,is_default.eq.true`)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error loading routines:", error);
    }
  }, [profile?.id]);

  const loadWeeklyPlan = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_plans")
        .select("*")
        .eq("user_id", profile?.id);

      if (error) throw error;

      const plan: WeeklyPlan = {};
      data?.forEach((item) => {
        plan[item.day_of_week] = item.routine_id;
      });

      setWeeklyPlan(plan);
    } catch (error) {
      console.error("Error loading weekly plan:", error);
    }
  }, [profile?.id]);

  const loadDailyAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("daily_assignments")
        .select("*")
        .eq("user_id", profile?.id);

      if (error) throw error;
      setDailyAssignments(data || []);
    } catch (error) {
      console.error("Error loading daily assignments:", error);
    }
  }, [profile?.id]);

  const loadWorkoutStatuses = useCallback(async () => {
    if (!profile) return;

    try {
      // Get workout sessions for the current week (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .gte("date", weekAgo.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) throw error;

      // Map sessions to days
      const statuses: WorkoutStatus = {};
      const dayMap = {
        0: "Domingo",
        1: "Lunes",
        2: "Martes",
        3: "Miércoles",
        4: "Jueves",
        5: "Viernes",
        6: "Sábado",
      };

      sessions?.forEach((session) => {
        const sessionDate = new Date(session.date);
        const dayName = dayMap[sessionDate.getDay() as keyof typeof dayMap];

        if (session.completed) {
          statuses[dayName] = "completed";
        } else if (sessionDate.toDateString() === new Date().toDateString()) {
          // If it's today and not completed, it might be in progress
          statuses[dayName] = "in_progress";
        } else {
          // If it's in the past and not completed, it was skipped or incomplete
          statuses[dayName] = "incomplete";
        }
      });

      // For days with assigned routines but no sessions, mark as pending
      days.forEach((day) => {
        if (weeklyPlan[day] && !statuses[day]) {
          const today = new Date();
          const dayIndex = days.indexOf(day);
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() - today.getDay() + dayIndex);

          if (targetDate < today) {
            // Past day with no session = skipped
            statuses[day] = "skipped";
          } else if (targetDate.toDateString() === today.toDateString()) {
            // Today = pending
            statuses[day] = "pending";
          }
        }
      });

      setWorkoutStatuses(statuses);
    } catch (error) {
      console.error("Error loading workout statuses:", error);
    }
  }, [profile, weeklyPlan]);

  // Load statistics data
  const loadStatsData = useCallback(async () => {
    if (!profile) return;

    try {
      // Get workout sessions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .eq("user_id", profile.id)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      // Process data for charts
      const dailyStats = [];
      const statusDistribution = {
        completed: 0,
        in_progress: 0,
        pending: 0,
        skipped: 0,
        incomplete: 0,
      };

      // Group by day
      const dayMap =
        sessions?.reduce((acc: any, session) => {
          const date = session.date;
          if (!acc[date]) {
            acc[date] = { completed: 0, total: 0 };
          }
          acc[date].total++;
          if (session.completed) acc[date].completed++;
          return acc;
        }, {}) || {};

      // Create daily chart data
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayData = dayMap[dateStr] || { completed: 0, total: 0 };

        dailyStats.push({
          date: date.toLocaleDateString("es-ES", {
            weekday: "short",
          }),
          completed: dayData.completed,
          total: dayData.total,
        });
      }

      // Calculate status distribution based on current week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weekSessions =
        sessions?.filter((s) => new Date(s.date) >= weekAgo) || [];
      weekSessions.forEach((session) => {
        if (session.completed) statusDistribution.completed++;
        else if (
          new Date(session.date).toDateString() === new Date().toDateString()
        ) {
          statusDistribution.in_progress++;
        } else {
          statusDistribution.incomplete++;
        }
      });

      // Add pending workouts (assigned but no session)
      days.forEach((day) => {
        if (
          weeklyPlan[day] &&
          !weekSessions.some((s) => {
            const sessionDate = new Date(s.date);
            return days[sessionDate.getDay()] === day;
          })
        ) {
          statusDistribution.pending++;
        }
      });

      const statusData = Object.entries(statusDistribution).map(
        ([status, count]) => ({
          name: status,
          value: count,
          color:
            status === "completed"
              ? "#10b981"
              : status === "in_progress"
              ? "#3b82f6"
              : status === "pending"
              ? "#f59e0b"
              : status === "skipped"
              ? "#ef4444"
              : "#f97316",
        })
      );

      setStatsData({
        dailyStats,
        statusData: statusData.filter((item) => item.value > 0),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [profile, weeklyPlan]);

  useEffect(() => {
    if (profile) {
      loadRoutines();
      loadWeeklyPlan();
      loadDailyAssignments();
      loadWorkoutStatuses();
      if (viewMode === "stats") {
        loadStatsData();
      }
    }
  }, [
    profile,
    loadRoutines,
    loadWeeklyPlan,
    loadDailyAssignments,
    loadWorkoutStatuses,
    viewMode,
    loadStatsData,
  ]);

  // Assign routine to a day
  async function assignRoutine(
    day: string,
    routineId: string | null,
    date?: Date,
    applyToAllWeeks: boolean = false
  ) {
    if (!profile) return;

    try {
      if (date) {
        // Specific date assignment
        const dateStr = date.toISOString().split("T")[0];

        if (routineId) {
          // Create or update daily assignment
          const { error } = await supabase.from("daily_assignments").upsert(
            {
              user_id: profile.id,
              date: dateStr,
              routine_id: routineId,
              is_recurring: applyToAllWeeks,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,date",
            }
          );

          if (error) throw error;
        } else {
          // Delete daily assignment
          const { error } = await supabase
            .from("daily_assignments")
            .delete()
            .eq("user_id", profile.id)
            .eq("date", dateStr);

          if (error) throw error;
        }

        // If applying to all weeks, also update the weekly plan
        if (applyToAllWeeks) {
          const dayName = days[date.getDay()];
          const { error } = await supabase.from("weekly_plans").upsert(
            {
              user_id: profile.id,
              day_of_week: dayName,
              routine_id: routineId,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,day_of_week",
            }
          );

          if (error) throw error;

          // Update local weekly plan
          setWeeklyPlan((prev) => ({
            ...prev,
            [dayName]: routineId,
          }));
        } else {
          // Update local daily assignments
          setDailyAssignments((prev) => {
            const existingIndex = prev.findIndex(
              (assignment) => assignment.date === dateStr
            );

            if (routineId) {
              const newAssignment: DailyAssignment = {
                id: existingIndex >= 0 ? prev[existingIndex].id : "",
                user_id: profile.id,
                date: dateStr,
                routine_id: routineId,
                is_recurring: false,
                created_at:
                  existingIndex >= 0
                    ? prev[existingIndex].created_at
                    : new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newAssignment;
                return updated;
              } else {
                return [...prev, newAssignment];
              }
            } else {
              // Remove assignment
              return prev.filter((assignment) => assignment.date !== dateStr);
            }
          });
        }
      } else {
        // Weekly assignment (legacy)
        if (routineId) {
          const { error } = await supabase.from("weekly_plans").upsert(
            {
              user_id: profile.id,
              day_of_week: day,
              routine_id: routineId,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id,day_of_week",
            }
          );

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("weekly_plans")
            .delete()
            .eq("user_id", profile.id)
            .eq("day_of_week", day);

          if (error) throw error;
        }

        // Update local state
        setWeeklyPlan((prev) => ({
          ...prev,
          [day]: routineId,
        }));
      }

      // Reload workout statuses to reflect changes
      loadWorkoutStatuses();
      // Reload daily assignments if we modified them
      if (date) {
        loadDailyAssignments();
      }
    } catch (error) {
      console.error("Error assigning routine:", error);
    }
  }

  const getRoutineById = (id: string) => routines.find((r) => r.id === id);

  // Month calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDayStatus = (date: Date) => {
    const dayName = days[date.getDay()];
    const dateStr = date.toISOString().split("T")[0];

    // Check for daily assignment first (takes priority)
    const dailyAssignment = dailyAssignments.find(
      (assignment) => assignment.date === dateStr
    );

    let routineId = null;
    if (dailyAssignment) {
      routineId = dailyAssignment.routine_id;
    } else {
      // Fall back to weekly plan
      routineId = weeklyPlan[dayName];
    }

    const status = workoutStatuses[dayName];
    const hasRoutine = !!routineId;

    if (!hasRoutine) {
      return { status: null, routine: null };
    }

    return {
      status,
      routine: getRoutineById(routineId!),
    };
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500/50";
      case "in_progress":
        return "bg-blue-500/20 border-blue-500/50";
      case "pending":
        return "bg-yellow-500/20 border-yellow-500/50";
      case "skipped":
        return "bg-red-500/20 border-red-500/50";
      case "incomplete":
        return "bg-orange-500/20 border-orange-500/50";
      default:
        return "bg-gray-500/20 border-gray-500/50";
    }
  };

  // Load exercises for selected day
  const loadDayExercises = useCallback(
    async (day: Date | string) => {
      let routineId: string | null = null;

      if (typeof day === "string") {
        // Weekly view - use weekly plan
        routineId = weeklyPlan[day];
      } else {
        // Monthly view - check daily assignment first, then weekly plan
        const dateStr = day.toISOString().split("T")[0];
        const dailyAssignment = dailyAssignments.find(
          (assignment) => assignment.date === dateStr
        );

        if (dailyAssignment) {
          routineId = dailyAssignment.routine_id;
        } else {
          const dayName = days[day.getDay()];
          routineId = weeklyPlan[dayName];
        }
      }

      if (!routineId) {
        setSelectedDayExercises([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("routine_exercises")
          .select(
            `
            *,
            exercise_library (*)
          `
          )
          .eq("routine_id", routineId)
          .order("order_index", { ascending: true });

        if (error) throw error;
        setSelectedDayExercises(data || []);
      } catch (error) {
        console.error("Error loading exercises:", error);
        setSelectedDayExercises([]);
      }
    },
    [weeklyPlan, dailyAssignments]
  );

  // Update workout status manually
  const updateWorkoutStatus = useCallback(
    async (dayName: string, newStatus: string, date?: Date) => {
      if (!profile) return;

      try {
        const today = new Date();
        let targetDate: Date;

        if (date) {
          targetDate = date;
        } else {
          // Find the date for this day of the week
          const dayIndex = days.indexOf(dayName);
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() - today.getDay() + dayIndex);
        }

        // Check if session exists
        const { data: existingSession } = await supabase
          .from("workout_sessions")
          .select("*")
          .eq("user_id", profile.id)
          .eq("date", targetDate.toISOString().split("T")[0])
          .single();

        if (existingSession) {
          // Update existing session
          const { error } = await supabase
            .from("workout_sessions")
            .update({
              completed: newStatus === "completed",
            })
            .eq("id", existingSession.id);

          if (error) throw error;

          // Award experience if completed and wasn't completed before
          if (newStatus === "completed" && !existingSession.completed) {
            await awardExperience(10, "workout_completed", existingSession.id);
          }
        } else {
          // Create new session (this can happen for past days when manually updating status)
          // Find the routine_id for this specific date
          let routineIdForSession = null;

          if (date) {
            // Check daily assignments first
            const dailyAssignment = dailyAssignments.find(
              (assignment) =>
                assignment.date === date.toISOString().split("T")[0]
            );
            if (dailyAssignment) {
              routineIdForSession = dailyAssignment.routine_id;
            }
          }

          // Fall back to weekly plan if no daily assignment
          if (!routineIdForSession) {
            routineIdForSession = weeklyPlan[dayName];
          }

          const { error } = await supabase.from("workout_sessions").insert({
            user_id: profile.id,
            routine_id: routineIdForSession,
            date: targetDate.toISOString().split("T")[0],
            completed: newStatus === "completed",
          });

          if (error) throw error;

          // Award experience if completed
          if (newStatus === "completed") {
            const { data: newSession } = await supabase
              .from("workout_sessions")
              .select("id")
              .eq("user_id", profile.id)
              .eq("date", targetDate.toISOString().split("T")[0])
              .single();

            if (newSession) {
              await awardExperience(10, "workout_completed", newSession.id);
            }
          }
        }

        // Reload statuses
        loadWorkoutStatuses();
      } catch (error) {
        console.error("Error updating workout status:", error);
      }
    },
    [profile, weeklyPlan, loadWorkoutStatuses]
  );

  // Award experience and update level
  const awardExperience = useCallback(
    async (amount: number, reason: string, relatedId?: string) => {
      if (!profile) return;

      try {
        // Get current experience
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("experience, level")
          .eq("id", profile.id)
          .single();

        if (!currentProfile) return;

        const newExperience = (currentProfile.experience || 0) + amount;
        const newLevel = calculateLevel(newExperience);

        // Update profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            experience: newExperience,
            level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (updateError) throw updateError;

        // Record experience gain
        const { error: historyError } = await supabase
          .from("experience_history")
          .insert({
            user_id: profile.id,
            experience_gained: amount,
            reason,
            related_id: relatedId,
          });

        if (historyError) throw historyError;
      } catch (error) {
        console.error("Error awarding experience:", error);
      }
    },
    [profile]
  );

  // Calculate level based on experience
  const calculateLevel = (experience: number) => {
    if (experience >= 1600) return "S";
    if (experience >= 800) return "A";
    if (experience >= 400) return "B";
    if (experience >= 200) return "C";
    if (experience >= 50) return "D";
    return "E";
  };

  // Get XP needed for next level
  const getNextLevelXP = (currentLevel: string) => {
    switch (currentLevel) {
      case "E":
        return 50;
      case "D":
        return 100;
      case "C":
        return 200;
      case "B":
        return 400;
      case "A":
        return 800;
      case "S":
        return 1600; // Max level
      default:
        return 50;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-thin text-white mb-2">Seguimiento</h1>
          <p className="text-gray-400 font-light">
            Organiza tus entrenamientos
          </p>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("month")}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 ${
            viewMode === "month"
              ? "bg-white text-[#0a0a0a]"
              : "bg-[#141414] border border-[#1f1f1f] text-gray-400 hover:text-white"
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Vista Mensual
        </button>
        <button
          onClick={() => setViewMode("stats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 ${
            viewMode === "stats"
              ? "bg-white text-[#0a0a0a]"
              : "bg-[#141414] border border-[#1f1f1f] text-gray-400 hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Estadísticas
        </button>
      </div>

      {viewMode === "month" && (
        <>
          {/* Monthly Calendar */}
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-thin text-white">
                {currentMonth.toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-light text-gray-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={index} className="aspect-square" />;
                }

                const dayStatus = getDayStatus(date);
                const isToday =
                  date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={index}
                    className={`aspect-square border rounded-sm p-2 transition-all duration-300 cursor-pointer hover:scale-105 relative group ${
                      dayStatus.status
                        ? `${getStatusColor(dayStatus.status)} border-2`
                        : "border-[#1f1f1f] hover:border-white/50"
                    } ${isToday ? "ring-2 ring-white/50" : ""}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="text-sm font-light text-white mb-1">
                        {date.getDate()}
                      </div>
                      {dayStatus.routine && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="text-xs text-gray-300 font-light truncate">
                            {dayStatus.routine.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dayStatus.routine.duration_minutes}min
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Status Buttons - Show on hover for days with routines */}
                    {dayStatus.routine && (
                      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-sm flex items-center justify-center">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWorkoutStatus(
                                days[date.getDay()],
                                "pending",
                                date
                              );
                            }}
                            className={`w-6 h-6 rounded-sm border text-xs font-light transition-all duration-200 ${
                              dayStatus.status === "pending"
                                ? "bg-yellow-500 text-black border-yellow-500"
                                : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                            }`}
                            title="Marcar como pendiente"
                          >
                            P
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWorkoutStatus(
                                days[date.getDay()],
                                "in_progress",
                                date
                              );
                            }}
                            className={`w-6 h-6 rounded-sm border text-xs font-light transition-all duration-200 ${
                              dayStatus.status === "in_progress"
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white"
                            }`}
                            title="Marcar como en progreso"
                          >
                            E
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWorkoutStatus(
                                days[date.getDay()],
                                "completed",
                                date
                              );
                            }}
                            className={`w-6 h-6 rounded-sm border text-xs font-light transition-all duration-200 ${
                              dayStatus.status === "completed"
                                ? "bg-green-500 text-white border-green-500"
                                : "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white"
                            }`}
                            title="Marcar como completado"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateWorkoutStatus(
                                days[date.getDay()],
                                "skipped",
                                date
                              );
                            }}
                            className={`w-6 h-6 rounded-sm border text-xs font-light transition-all duration-200 ${
                              dayStatus.status === "skipped"
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
                            }`}
                            title="Marcar como saltado"
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Click handler for opening details modal */}
                    <div
                      className="absolute inset-0"
                      onClick={() => {
                        setSelectedDay(date);
                        loadDayExercises(date);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-[#1f1f1f]">
              <h3 className="text-sm font-light text-white mb-3">Leyenda</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded-sm"></div>
                  <span className="text-xs text-gray-400 font-light">
                    Completado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500/20 border border-blue-500/50 rounded-sm"></div>
                  <span className="text-xs text-gray-400 font-light">
                    En progreso
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/50 rounded-sm"></div>
                  <span className="text-xs text-gray-400 font-light">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500/50 rounded-sm"></div>
                  <span className="text-xs text-gray-400 font-light">
                    Saltado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500/20 border border-orange-500/50 rounded-sm"></div>
                  <span className="text-xs text-gray-400 font-light">
                    Incompleto
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === "stats" && (
        <>
          {/* Statistics View */}
          <div className="space-y-6">
            {/* Experience and Level */}
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-thin text-white">
                  Progreso y Nivel
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-thin text-white">
                      {profile?.level || "E"}
                    </div>
                    <div className="text-sm text-gray-400">Nivel</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-thin text-white">
                      {profile?.experience || 0}
                    </div>
                    <div className="text-sm text-gray-400">XP</div>
                  </div>
                </div>
              </div>

              {/* Experience Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Nivel {profile?.level || "E"}</span>
                  <span>
                    {profile?.experience || 0} /{" "}
                    {getNextLevelXP(profile?.level || "E")} XP
                  </span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((profile?.experience || 0) /
                          getNextLevelXP(profile?.level || "E")) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {statsData &&
              statsData.dailyStats &&
              statsData.dailyStats.length > 0 && (
                <>
                  {/* Daily Activity Chart */}
                  <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
                    <h3 className="text-xl font-thin text-white mb-4">
                      Actividad Diaria (Últimos 30 días)
                    </h3>
                    <div style={{ width: "100%", height: "300px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData.dailyStats}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1f1f1f"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#9ca3af"
                            fontSize={12}
                          />
                          <YAxis stroke="#9ca3af" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#141414",
                              border: "1px solid #1f1f1f",
                              borderRadius: "4px",
                            }}
                          />
                          <Bar
                            dataKey="completed"
                            fill="#10b981"
                            name="Completados"
                          />
                          <Bar
                            dataKey="total"
                            fill="#3b82f6"
                            name="Asignados"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  {statsData.statusData && statsData.statusData.length > 0 && (
                    <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
                      <h3 className="text-xl font-thin text-white mb-4">
                        Distribución de Estados (Esta semana)
                      </h3>
                      <div style={{ width: "100%", height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statsData.statusData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {statsData.statusData.map(
                                (entry: any, index: number) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                )
                              )}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </>
      )}

      {/* Day Details Modal */}
      {selectedDay && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDay(null);
            }
          }}
        >
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-thin text-white">
                {typeof selectedDay === "string"
                  ? selectedDay
                  : selectedDay.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </h2>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {(() => {
              let dayName: string;
              let dayDate: Date;
              let isPastDay: boolean;
              let dayStatus: { status: string | null; routine: any };

              if (typeof selectedDay === "string") {
                dayName = selectedDay;
                dayDate = new Date();
                // Find the date for this day of the week
                const today = new Date();
                const dayIndex = days.indexOf(dayName);
                dayDate = new Date(today);
                dayDate.setDate(today.getDate() - today.getDay() + dayIndex);
                isPastDay =
                  dayDate < new Date() &&
                  !dayDate.toDateString().includes(new Date().toDateString());
                const status = workoutStatuses[dayName];
                const hasRoutine = !!weeklyPlan[dayName];
                dayStatus = {
                  status,
                  routine: hasRoutine
                    ? getRoutineById(weeklyPlan[dayName]!)
                    : null,
                };
              } else {
                dayDate = selectedDay;
                dayName = days[selectedDay.getDay()];
                isPastDay =
                  selectedDay < new Date() &&
                  !selectedDay
                    .toDateString()
                    .includes(new Date().toDateString());
                dayStatus = getDayStatus(selectedDay);
              }

              return (
                <div className="space-y-6">
                  {/* Show if day is in the past */}
                  {isPastDay && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-sm p-4">
                      <div className="flex items-center gap-2 text-yellow-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-light">
                          Este día ya pasó. Los cambios se guardan como
                          registros históricos.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Routine Selection */}
                  <div>
                    <label className="block text-sm font-light text-gray-400 mb-2">
                      Rutina Asignada
                    </label>
                    <select
                      value={dayStatus.routine?.id || ""}
                      onChange={(e) =>
                        assignRoutine(
                          dayName,
                          e.target.value || null,
                          typeof selectedDay === "object"
                            ? selectedDay
                            : undefined,
                          applyToAllWeeks
                        )
                      }
                      disabled={isPastDay}
                      className={`w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white ${
                        isPastDay ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">Sin rutina</option>
                      {routines.map((routine) => (
                        <option key={routine.id} value={routine.id}>
                          {routine.title} ({routine.duration_minutes}min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Apply to all weeks checkbox - only show for future days */}
                  {typeof selectedDay === "object" && !isPastDay && (
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={applyToAllWeeks}
                          onChange={(e) => setApplyToAllWeeks(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-400 font-light">
                          Aplicar a todas las semanas
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Si marcas esta opción, esta rutina se asignará
                        automáticamente a todos los {dayName.toLowerCase()}s
                        futuros.
                      </p>
                    </div>
                  )}

                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-light text-gray-400 mb-2">
                      Estado del Entrenamiento
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        {
                          value: "pending",
                          label: "Pendiente",
                          color: "text-yellow-500",
                        },
                        {
                          value: "in_progress",
                          label: "En Progreso",
                          color: "text-blue-500",
                        },
                        {
                          value: "completed",
                          label: "Completado",
                          color: "text-green-500",
                        },
                        {
                          value: "skipped",
                          label: "Saltado",
                          color: "text-red-500",
                        },
                        {
                          value: "incomplete",
                          label: "Incompleto",
                          color: "text-orange-500",
                        },
                      ].map((status) => (
                        <button
                          key={status.value}
                          onClick={() =>
                            updateWorkoutStatus(
                              dayName,
                              status.value,
                              typeof selectedDay === "object"
                                ? selectedDay
                                : undefined
                            )
                          }
                          className={`px-3 py-2 rounded-sm border font-light transition-all duration-300 ${
                            dayStatus.status === status.value
                              ? `bg-white text-[#0a0a0a]`
                              : `border-[#1f1f1f] text-gray-400 hover:text-white hover:border-white`
                          }`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exercises List */}
                  {dayStatus.routine && selectedDayExercises.length > 0 && (
                    <div>
                      <h3 className="text-lg font-thin text-white mb-4">
                        Ejercicios
                      </h3>
                      <div className="space-y-3">
                        {selectedDayExercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-light">
                                {exercise.name}
                              </h4>
                              <span className="text-sm text-gray-400">
                                #{index + 1}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
                              <div>Series: {exercise.sets}</div>
                              <div>Reps: {exercise.reps}</div>
                              <div>Descanso: {exercise.rest_seconds}s</div>
                            </div>
                            {exercise.description && (
                              <p className="text-sm text-gray-500 mt-2">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Info */}
                  {dayStatus.status === "completed" && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-sm p-4">
                      <div className="flex items-center gap-2 text-green-400">
                        <Award className="w-5 h-5" />
                        <span className="font-light">
                          ¡Entrenamiento completado! +10 XP
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
