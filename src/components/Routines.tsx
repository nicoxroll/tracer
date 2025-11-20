import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Clock,
  TrendingUp,
  Star,
  Plus,
  Edit,
  Trash2,
  Dumbbell,
  Calendar,
} from "lucide-react";

type Exercise = {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  order_index: number;
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

export default function Routines() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [filter, setFilter] = useState<"all" | "default" | "public" | "mine">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [assigningRoutine, setAssigningRoutine] = useState<Routine | null>(
    null
  );
  const [newRoutine, setNewRoutine] = useState({
    title: "",
    description: "",
    difficulty: "intermediate",
    duration_minutes: 30,
    is_public: false,
  });
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    sets: 3,
    reps: "10",
    rest_seconds: 60,
  });

  useEffect(() => {
    if (profile) {
      loadRoutines();
    }
  }, [filter, profile]);

  async function loadRoutines() {
    try {
      setLoading(true);
      let query = supabase.from("routines").select(`
        *,
        profiles:creator_id (username)
      `);

      if (filter === "default") {
        query = query.eq("is_default", true);
      } else if (filter === "public") {
        query = query.eq("is_public", true);
      } else if (filter === "mine") {
        if (!profile) return;
        query = query.eq("creator_id", profile.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error("Error loading routines:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadExercises(routineId: string) {
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
    }
  }

  async function saveExercise(routineId: string) {
    if (!profile) return;

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from("exercises")
          .update({
            name: newExercise.name,
            description: newExercise.description,
            sets: newExercise.sets,
            reps: newExercise.reps,
            rest_seconds: newExercise.rest_seconds,
          })
          .eq("id", editingExercise.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("exercises").insert({
          ...newExercise,
          routine_id: routineId,
          order_index: exercises.length,
        });

        if (error) throw error;
      }

      setNewExercise({
        name: "",
        description: "",
        sets: 3,
        reps: "10",
        rest_seconds: 60,
      });
      setEditingExercise(null);
      loadExercises(routineId);
    } catch (error) {
      console.error("Error saving exercise:", error);
    }
  }

  async function deleteExercise(id: string, routineId: string) {
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
      loadExercises(routineId);
    } catch (error) {
      console.error("Error deleting exercise:", error);
    }
  }

  function startEditExercise(exercise: Exercise) {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      description: exercise.description,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_seconds: exercise.rest_seconds,
    });
  }

  function toggleExpanded(routineId: string) {
    if (expandedRoutine === routineId) {
      setExpandedRoutine(null);
      setExercises([]);
    } else {
      setExpandedRoutine(routineId);
      loadExercises(routineId);
    }
  }

  async function assignRoutineToDay(routineId: string, dayOfWeek: string) {
    if (!profile) return;

    try {
      const { error } = await supabase.from("weekly_plans").upsert(
        {
          user_id: profile.id,
          day_of_week: dayOfWeek,
          routine_id: routineId,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,day_of_week",
        }
      );

      if (error) throw error;

      setAssigningRoutine(null);
      navigate("/weekly-planner");
    } catch (error) {
      console.error("Error assigning routine:", error);
    }
  }

  async function saveRoutine() {
    if (!profile) return;

    try {
      if (editingRoutine) {
        const { error } = await supabase
          .from("routines")
          .update({
            title: newRoutine.title,
            description: newRoutine.description,
            difficulty: newRoutine.difficulty,
            duration_minutes: newRoutine.duration_minutes,
            is_public: newRoutine.is_public,
          })
          .eq("id", editingRoutine.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("routines").insert({
          ...newRoutine,
          creator_id: profile.id,
        });

        if (error) throw error;
      }

      setNewRoutine({
        title: "",
        description: "",
        difficulty: "intermediate",
        duration_minutes: 30,
        is_public: false,
      });
      setEditingRoutine(null);
      loadRoutines();
    } catch (error) {
      console.error("Error saving routine:", error);
    }
  }

  async function deleteRoutine(id: string) {
    try {
      const { error } = await supabase.from("routines").delete().eq("id", id);
      if (error) throw error;
      loadRoutines();
    } catch (error) {
      console.error("Error deleting routine:", error);
    }
  }

  function startEdit(routine: Routine) {
    setEditingRoutine(routine);
    setNewRoutine({
      title: routine.title,
      description: routine.description,
      difficulty: routine.difficulty,
      duration_minutes: routine.duration_minutes,
      is_public: routine.is_public,
    });
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "from-green-500 to-emerald-500";
      case "intermediate":
        return "from-yellow-500 to-orange-500";
      case "advanced":
        return "from-red-500 to-pink-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-thin text-white mb-2">Rutinas</h1>
          <p className="text-gray-400 font-light">
            Explora y administra tus rutinas de entrenamiento
          </p>
        </div>
        <button
          onClick={() => setEditingRoutine(null)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Crear Rutina
        </button>
      </div>

      {/* Routine CRUD Modal */}
      {(editingRoutine !== null || newRoutine.title) && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingRoutine(null);
              setNewRoutine({
                title: "",
                description: "",
                difficulty: "intermediate",
                duration_minutes: 30,
                is_public: false,
              });
            }
          }}
        >
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 w-full max-w-md">
            <h2 className="text-xl font-thin text-white mb-4">
              {editingRoutine ? "Editar Rutina" : "Nueva Rutina"}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Título"
                value={newRoutine.title}
                onChange={(e) =>
                  setNewRoutine((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white"
              />

              <textarea
                placeholder="Descripción"
                value={newRoutine.description}
                onChange={(e) =>
                  setNewRoutine((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white resize-none"
                rows={3}
              />

              <select
                value={newRoutine.difficulty}
                onChange={(e) =>
                  setNewRoutine((prev) => ({
                    ...prev,
                    difficulty: e.target.value,
                  }))
                }
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>

              <input
                type="number"
                placeholder="Duración (minutos)"
                value={newRoutine.duration_minutes}
                onChange={(e) =>
                  setNewRoutine((prev) => ({
                    ...prev,
                    duration_minutes: parseInt(e.target.value),
                  }))
                }
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newRoutine.is_public}
                  onChange={(e) =>
                    setNewRoutine((prev) => ({
                      ...prev,
                      is_public: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-400 font-light">
                  Pública
                </span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveRoutine}
                className="flex-1 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditingRoutine(null);
                  setNewRoutine({
                    title: "",
                    description: "",
                    difficulty: "intermediate",
                    duration_minutes: 30,
                    is_public: false,
                  });
                }}
                className="px-4 py-2 bg-[#1f1f1f] text-gray-400 rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Week Modal */}
      {assigningRoutine && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAssigningRoutine(null);
            }
          }}
        >
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 w-full max-w-md">
            <h2 className="text-xl font-thin text-white mb-4">
              Agregar "{assigningRoutine.title}" a la semana
            </h2>
            <p className="text-gray-400 text-sm font-light mb-6">
              Selecciona el día de la semana para asignar esta rutina:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {[
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo",
              ].map((day) => (
                <button
                  key={day}
                  onClick={() => assignRoutineToDay(assigningRoutine.id, day)}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-white font-light hover:bg-[#1f1f1f] hover:border-white transition-all duration-300 text-left"
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setAssigningRoutine(null)}
                className="flex-1 px-4 py-2 bg-[#1f1f1f] text-gray-400 rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "Todas" },
          { id: "default", label: "Por Defecto" },
          { id: "public", label: "Publicadas" },
          { id: "mine", label: "Mis Rutinas" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 whitespace-nowrap ${
              filter === tab.id
                ? "bg-white text-[#0a0a0a]"
                : "bg-[#141414] border border-[#1f1f1f] text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : routines.length === 0 ? (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-12 text-center">
          <p className="text-gray-400 font-light">No se encontraron rutinas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-[#141414] border border-[#1f1f1f] rounded-sm overflow-hidden hover:border-white transition-all duration-300 group"
            >
              <div
                className={`h-2 bg-gradient-to-r ${getDifficultyColor(
                  routine.difficulty
                )}`}
              />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-light text-white group-hover:text-gray-300 transition-colors duration-300">
                    {routine.title}
                  </h3>
                  {filter === "mine" && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(routine);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoutine(routine.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {routine.is_default && (
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>

                <p className="text-gray-400 text-sm font-light mb-4 line-clamp-2">
                  {routine.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-light">
                      {routine.duration_minutes} min
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light capitalize">
                      {routine.difficulty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light">
                    por {routine.profiles?.username || "Tracer"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAssigningRoutine(routine)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Agregar a la semana"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleExpanded(routine.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Dumbbell className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Exercises View */}
                {expandedRoutine === routine.id && (
                  <div className="mt-6 pt-6 border-t border-[#1f1f1f]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-light text-white">
                        Ejercicios
                      </h4>
                      {filter === "mine" && (
                        <button
                          onClick={() => setEditingExercise(null)}
                          className="flex items-center gap-2 px-3 py-1 bg-[#0a0a0a] text-white rounded-sm font-light hover:bg-[#1f1f1f] transition-all duration-300 text-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      )}
                    </div>

                    {/* Exercise Form */}
                    {(editingExercise !== null || newExercise.name) &&
                      filter === "mine" && (
                        <div className="mb-4 p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm">
                          <h5 className="text-sm font-light text-white mb-3">
                            {editingExercise
                              ? "Editar Ejercicio"
                              : "Nuevo Ejercicio"}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Nombre del ejercicio"
                              value={newExercise.name}
                              onChange={(e) =>
                                setNewExercise((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Repeticiones (ej: 10-12)"
                              value={newExercise.reps}
                              onChange={(e) =>
                                setNewExercise((prev) => ({
                                  ...prev,
                                  reps: e.target.value,
                                }))
                              }
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <input
                              type="number"
                              placeholder="Series"
                              value={newExercise.sets}
                              onChange={(e) =>
                                setNewExercise((prev) => ({
                                  ...prev,
                                  sets: parseInt(e.target.value),
                                }))
                              }
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Descanso (segundos)"
                              value={newExercise.rest_seconds}
                              onChange={(e) =>
                                setNewExercise((prev) => ({
                                  ...prev,
                                  rest_seconds: parseInt(e.target.value),
                                }))
                              }
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white text-sm"
                            />
                          </div>
                          <textarea
                            placeholder="Descripción (opcional)"
                            value={newExercise.description}
                            onChange={(e) =>
                              setNewExercise((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white resize-none text-sm mb-3"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveExercise(routine.id)}
                              className="px-3 py-1 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300 text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingExercise(null);
                                setNewExercise({
                                  name: "",
                                  description: "",
                                  sets: 3,
                                  reps: "10",
                                  rest_seconds: 60,
                                });
                              }}
                              className="px-3 py-1 bg-[#1f1f1f] text-gray-400 rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300 text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Exercises List */}
                    {exercises.length === 0 ? (
                      <p className="text-gray-400 text-sm font-light text-center py-4">
                        No hay ejercicios en esta rutina
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-500 font-light">
                                  #{index + 1}
                                </span>
                                <h5 className="text-sm font-light text-white">
                                  {exercise.name}
                                </h5>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>{exercise.sets} series</span>
                                <span>{exercise.reps} reps</span>
                                <span>{exercise.rest_seconds}s descanso</span>
                              </div>
                            </div>
                            {filter === "mine" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startEditExercise(exercise)}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteExercise(exercise.id, routine.id)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
