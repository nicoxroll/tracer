import {
  Calendar,
  Clock,
  Dumbbell,
  Edit,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

type RoutineExercise = {
  id: string;
  routine_id: string;
  exercise_id: string;
  sets: number;
  reps: string;
  weight_kg: number;
  rest_seconds: number;
  order_index: number;
  notes: string;
  exercise_library?: ExerciseLibrary;
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
  const [assigningRoutine, setAssigningRoutine] = useState<Routine | null>(
    null
  );
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>(
    []
  );
  const [editingExercise, setEditingExercise] =
    useState<RoutineExercise | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibrary[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>(
    []
  );
  const [newRoutine, setNewRoutine] = useState({
    title: "",
    description: "",
    difficulty: "intermediate",
    duration_minutes: 30,
    is_public: false,
  });
  const [newRoutineExercises, setNewRoutineExercises] = useState<any[]>([]);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState("");
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibrary | null>(null);
  const [newRoutineExercise, setNewRoutineExercise] = useState({
    exercise_id: "",
    sets: 3,
    reps: "10",
    weight_kg: 0,
    rest_seconds: 60,
    notes: "",
  });

  useEffect(() => {
    if (profile) {
      loadRoutines();
    }
  }, [filter, profile]);

  useEffect(() => {
    if (showCreateModal || editingRoutine) {
      loadExerciseLibrary();
    }
  }, [showCreateModal, editingRoutine]);

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

  async function loadRoutineExercises(routineId: string) {
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
      setRoutineExercises(data || []);
    } catch (error) {
      console.error("Error loading routine exercises:", error);
    }
  }

  async function loadExerciseLibrary() {
    try {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*")
        .order("name");

      if (error) throw error;
      setExerciseLibrary(data || []);
    } catch (error) {
      console.error("Error loading exercise library:", error);
    }
  }

  async function saveRoutineExercise(routineId: string) {
    if (!profile) return;

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from("routine_exercises")
          .update({
            sets: newRoutineExercise.sets,
            reps: newRoutineExercise.reps,
            weight_kg: newRoutineExercise.weight_kg,
            rest_seconds: newRoutineExercise.rest_seconds,
            notes: newRoutineExercise.notes,
          })
          .eq("id", editingExercise.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("routine_exercises").insert({
          ...newRoutineExercise,
          routine_id: routineId,
          order_index: routineExercises.length,
        });

        if (error) throw error;
      }

      setNewRoutineExercise({
        exercise_id: "",
        sets: 3,
        reps: "10",
        weight_kg: 0,
        rest_seconds: 60,
        notes: "",
      });
      setEditingExercise(null);
      setShowExerciseSelector(false);
      setSelectedExercise(null);
      loadRoutineExercises(routineId);
    } catch (error) {
      console.error("Error saving routine exercise:", error);
    }
  }

  async function deleteRoutineExercise(id: string, routineId: string) {
    try {
      const { error } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", id);
      if (error) throw error;
      loadRoutineExercises(routineId);
    } catch (error) {
      console.error("Error deleting routine exercise:", error);
    }
  }

  function startEditRoutineExercise(exercise: RoutineExercise) {
    setEditingExercise(exercise);
    setSelectedExercise(exercise.exercise_library || null);
    setNewRoutineExercise({
      exercise_id: exercise.exercise_id,
      sets: exercise.sets,
      reps: exercise.reps,
      weight_kg: exercise.weight_kg,
      rest_seconds: exercise.rest_seconds,
      notes: exercise.notes,
    });
    setShowExerciseSelector(true);
  }

  function toggleExpanded(routineId: string) {
    if (expandedRoutine === routineId) {
      setExpandedRoutine(null);
      setRoutineExercises([]);
    } else {
      setExpandedRoutine(routineId);
      loadRoutineExercises(routineId);
    }
  }

  function openExerciseSelector() {
    setShowExerciseSelector(true);
    loadExerciseLibrary();
  }

  function selectExercise(exercise: ExerciseLibrary) {
    setSelectedExercise(exercise);
    setNewRoutineExercise((prev) => ({
      ...prev,
      exercise_id: exercise.id,
    }));
  }

  function goBackToExerciseSelection() {
    setSelectedExercise(null);
    setEditingExercise(null);
    setNewRoutineExercise({
      exercise_id: "",
      sets: 3,
      reps: "10",
      weight_kg: 0,
      rest_seconds: 60,
      notes: "",
    });
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
      let routineId: string;

      if (editingRoutine) {
        // Update existing routine
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
        routineId = editingRoutine.id;

        // Delete existing exercises and add new ones
        await supabase
          .from("routine_exercises")
          .delete()
          .eq("routine_id", routineId);
      } else {
        // Create new routine
        const { data, error } = await supabase
          .from("routines")
          .insert({
            ...newRoutine,
            creator_id: profile.id,
          })
          .select()
          .single();

        if (error) throw error;
        routineId = data.id;
      }

      // Add exercises
      if (newRoutineExercises.length > 0) {
        const exercisesToInsert = newRoutineExercises.map(
          (exercise, index) => ({
            routine_id: routineId,
            exercise_id: exercise.exercise_id,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_kg: exercise.weight_kg,
            rest_seconds: exercise.rest_seconds,
            order_index: index,
            notes: exercise.notes,
          })
        );

        const { error: exercisesError } = await supabase
          .from("routine_exercises")
          .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;
      }

      // Reset form
      setNewRoutine({
        title: "",
        description: "",
        difficulty: "intermediate",
        duration_minutes: 30,
        is_public: false,
      });
      setNewRoutineExercises([]);
      setExerciseSearchTerm("");
      setEditingRoutine(null);
      setShowCreateModal(false);
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

    // Load existing exercises for editing
    loadRoutineExercisesForEdit(routine.id);
  }

  async function loadRoutineExercisesForEdit(routineId: string) {
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

      const exercises = (data || []).map((exercise) => ({
        exercise_id: exercise.exercise_id,
        exercise: exercise.exercise_library,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_kg: exercise.weight_kg,
        rest_seconds: exercise.rest_seconds,
        notes: exercise.notes,
      }));

      setNewRoutineExercises(exercises);
    } catch (error) {
      console.error("Error loading routine exercises for edit:", error);
    }
  }

  const filteredExercises = exerciseLibrary.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      exercise.description.toLowerCase().includes(exerciseSearch.toLowerCase());
    const matchesMuscleGroups =
      selectedMuscleGroups.length === 0 ||
      selectedMuscleGroups.some((mg) => exercise.muscle_groups.includes(mg));
    return matchesSearch && matchesMuscleGroups;
  });

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

  const getEquipmentLabel = (eq: string): string => {
    const labels: { [key: string]: string } = {
      barbell: "Barra",
      dumbbell: "Mancuernas",
      machine: "Máquina",
      bodyweight: "Peso Corporal",
      cable: "Polea",
      kettlebell: "Kettlebell",
      equipment: "Equipo",
    };
    return labels[eq] || eq;
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
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Crear Rutina
        </button>
      </div>
      {/* Routine CRUD Modal */}
      {(editingRoutine !== null || showCreateModal) && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingRoutine(null);
              setShowCreateModal(false);
              setNewRoutine({
                title: "",
                description: "",
                difficulty: "intermediate",
                duration_minutes: 30,
                is_public: false,
              });
              setNewRoutineExercises([]);
              setExerciseSearchTerm("");
            }
          }}
        >
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-thin text-white mb-6">
              {editingRoutine ? "Editar Rutina" : "Nueva Rutina"}
            </h2>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Título"
                  value={newRoutine.title}
                  onChange={(e) =>
                    setNewRoutine((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-2 text-white font-light focus:outline-none focus:border-white"
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
              </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="flex items-center">
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
              </div>

              {/* Exercise Search and Add */}
              <div>
                <label className="block text-sm font-light text-gray-400 mb-2">
                  Agregar Ejercicios
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar ejercicios por nombre o grupo muscular..."
                      value={exerciseSearchTerm}
                      onChange={(e) => {
                        setExerciseSearchTerm(e.target.value);
                        setShowExerciseDropdown(true);
                      }}
                      onFocus={() => setShowExerciseDropdown(true)}
                      onBlur={() => {
                        // Delay hiding dropdown to allow click on options
                        setTimeout(() => setShowExerciseDropdown(false), 200);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  {/* Exercise Dropdown */}
                  {showExerciseDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-[#141414] border border-[#1f1f1f] rounded-sm mt-1 max-h-60 overflow-y-auto z-10">
                      {(() => {
                        // Get exact matches first
                        const exactMatches = exerciseLibrary.filter(
                          (exercise) =>
                            exerciseSearchTerm &&
                            (exercise.name
                              .toLowerCase()
                              .includes(exerciseSearchTerm.toLowerCase()) ||
                              exercise.muscle_groups.some((group) =>
                                group
                                  .toLowerCase()
                                  .includes(exerciseSearchTerm.toLowerCase())
                              ))
                        );

                        // If we have exact matches, show them
                        if (exactMatches.length > 0) {
                          return exactMatches.slice(0, 10).map((exercise) => (
                            <button
                              key={exercise.id}
                              onClick={() => {
                                const newExercise = {
                                  exercise_id: exercise.id,
                                  exercise,
                                  sets: 3,
                                  reps: "10",
                                  weight_kg: 0,
                                  rest_seconds: 60,
                                  notes: "",
                                };
                                setNewRoutineExercises((prev) => [
                                  ...prev,
                                  newExercise,
                                ]);
                                setExerciseSearchTerm("");
                                setShowExerciseDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-[#1f1f1f] transition-colors border-b border-[#1f1f1f] last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#0a0a0a] rounded-sm overflow-hidden flex-shrink-0">
                                  <img
                                    src={exercise.image_url}
                                    alt={exercise.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.src =
                                        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="text-white font-light text-sm">
                                    {exercise.name}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {exercise.muscle_groups
                                      .slice(0, 2)
                                      .join(", ")}{" "}
                                    • {getEquipmentLabel(exercise.equipment)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ));
                        }

                        // If no exact matches or no search term, show suggested exercises
                        const suggestedExercises = exerciseLibrary.slice(0, 5); // Show first 5 exercises as suggestions

                        return suggestedExercises.map((exercise) => (
                          <button
                            key={exercise.id}
                            onClick={() => {
                              const newExercise = {
                                exercise_id: exercise.id,
                                exercise,
                                sets: 3,
                                reps: "10",
                                weight_kg: 0,
                                rest_seconds: 60,
                                notes: "",
                              };
                              setNewRoutineExercises((prev) => [
                                ...prev,
                                newExercise,
                              ]);
                              setExerciseSearchTerm("");
                              setShowExerciseDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-[#1f1f1f] transition-colors border-b border-[#1f1f1f] last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#0a0a0a] rounded-sm overflow-hidden flex-shrink-0">
                                <img
                                  src={exercise.image_url}
                                  alt={exercise.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-white font-light text-sm">
                                  {exercise.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {exercise.muscle_groups
                                    .slice(0, 2)
                                    .join(", ")}{" "}
                                  • {getEquipmentLabel(exercise.equipment)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Exercises */}
              {newRoutineExercises.length > 0 && (
                <div>
                  <h3 className="text-lg font-light text-white mb-4">
                    Ejercicios Agregados ({newRoutineExercises.length})
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {newRoutineExercises.map((exercise, index) => (
                      <div
                        key={index}
                        className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#141414] rounded-sm overflow-hidden">
                              <img
                                src={exercise.exercise.image_url}
                                alt={exercise.exercise.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src =
                                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
                                }}
                              />
                            </div>
                            <div>
                              <h4 className="text-white font-light text-sm">
                                {exercise.exercise.name}
                              </h4>
                              <p className="text-gray-400 text-xs">
                                {exercise.exercise.muscle_groups
                                  .slice(0, 2)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setNewRoutineExercises((prev) =>
                                prev.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Series
                            </label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => {
                                const updated = [...newRoutineExercises];
                                updated[index].sets = parseInt(e.target.value);
                                setNewRoutineExercises(updated);
                              }}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Reps
                            </label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => {
                                const updated = [...newRoutineExercises];
                                updated[index].reps = e.target.value;
                                setNewRoutineExercises(updated);
                              }}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Peso (kg)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={exercise.weight_kg}
                              onChange={(e) => {
                                const updated = [...newRoutineExercises];
                                updated[index].weight_kg = parseFloat(
                                  e.target.value
                                );
                                setNewRoutineExercises(updated);
                              }}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Descanso (s)
                            </label>
                            <input
                              type="number"
                              value={exercise.rest_seconds}
                              onChange={(e) => {
                                const updated = [...newRoutineExercises];
                                updated[index].rest_seconds = parseInt(
                                  e.target.value
                                );
                                setNewRoutineExercises(updated);
                              }}
                              className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-400 mb-1">
                            Notas
                          </label>
                          <input
                            type="text"
                            value={exercise.notes}
                            onChange={(e) => {
                              const updated = [...newRoutineExercises];
                              updated[index].notes = e.target.value;
                              setNewRoutineExercises(updated);
                            }}
                            placeholder="Notas opcionales..."
                            className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm px-2 py-1 text-white text-sm focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-[#1f1f1f]">
                <button
                  onClick={saveRoutine}
                  className="flex-1 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
                >
                  {editingRoutine ? "Actualizar Rutina" : "Crear Rutina"}
                </button>
                <button
                  onClick={() => {
                    setEditingRoutine(null);
                    setShowCreateModal(false);
                    setNewRoutine({
                      title: "",
                      description: "",
                      difficulty: "intermediate",
                      duration_minutes: 30,
                      is_public: false,
                    });
                    setNewRoutineExercises([]);
                    setExerciseSearchTerm("");
                  }}
                  className="px-4 py-2 bg-[#1f1f1f] text-gray-400 rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}{" "}
      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowExerciseSelector(false)}
        >
          <div
            className="bg-[#141414] border border-[#1f1f1f] rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#1f1f1f]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {selectedExercise && (
                    <button
                      onClick={goBackToExerciseSelection}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      ←
                    </button>
                  )}
                  <h2 className="text-2xl font-thin text-white">
                    {editingExercise
                      ? "Editar Ejercicio"
                      : selectedExercise
                      ? "Configurar Ejercicio"
                      : "Seleccionar Ejercicio"}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowExerciseSelector(false);
                    setSelectedExercise(null);
                    setEditingExercise(null);
                    setNewRoutineExercise({
                      exercise_id: "",
                      sets: 3,
                      reps: "10",
                      weight_kg: 0,
                      rest_seconds: 60,
                      notes: "",
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedExercise ? (
                /* Exercise Configuration */
                <div className="space-y-6">
                  <div className="flex gap-4 p-4 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm">
                    <div className="w-16 h-16 bg-[#141414] rounded-sm overflow-hidden flex-shrink-0">
                      <img
                        src={selectedExercise.image_url}
                        alt={selectedExercise.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-light text-white mb-1">
                        {selectedExercise.name}
                      </h3>
                      <p className="text-sm text-gray-400 font-light mb-2">
                        {selectedExercise.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {getEquipmentLabel(selectedExercise.equipment)}
                        </span>
                        <span>•</span>
                        <span>
                          {selectedExercise.muscle_groups
                            .slice(0, 2)
                            .join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 font-light mb-2">
                        Series
                      </label>
                      <input
                        type="number"
                        value={newRoutineExercise.sets}
                        onChange={(e) =>
                          setNewRoutineExercise((prev) => ({
                            ...prev,
                            sets: parseInt(e.target.value),
                          }))
                        }
                        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 font-light mb-2">
                        Repeticiones
                      </label>
                      <input
                        type="text"
                        placeholder="ej: 10-12"
                        value={newRoutineExercise.reps}
                        onChange={(e) =>
                          setNewRoutineExercise((prev) => ({
                            ...prev,
                            reps: e.target.value,
                          }))
                        }
                        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 font-light mb-2">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={newRoutineExercise.weight_kg}
                        onChange={(e) =>
                          setNewRoutineExercise((prev) => ({
                            ...prev,
                            weight_kg: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 font-light mb-2">
                        Descanso (seg)
                      </label>
                      <input
                        type="number"
                        value={newRoutineExercise.rest_seconds}
                        onChange={(e) =>
                          setNewRoutineExercise((prev) => ({
                            ...prev,
                            rest_seconds: parseInt(e.target.value),
                          }))
                        }
                        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 font-light mb-2">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={newRoutineExercise.notes}
                      onChange={(e) =>
                        setNewRoutineExercise((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-3 py-2 text-white font-light focus:outline-none focus:border-white resize-none"
                      rows={2}
                      placeholder="Notas adicionales..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveRoutineExercise(expandedRoutine!)}
                      className="flex-1 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
                    >
                      {editingExercise
                        ? "Actualizar Ejercicio"
                        : "Agregar a Rutina"}
                    </button>
                    <button
                      onClick={goBackToExerciseSelection}
                      className="px-4 py-2 bg-[#1f1f1f] text-gray-400 rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300"
                    >
                      {editingExercise ? "Cancelar" : "Cambiar Ejercicio"}
                    </button>
                  </div>
                </div>
              ) : (
                /* Exercise Selection */
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar ejercicios..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "pecho",
                      "espalda",
                      "piernas",
                      "hombros",
                      "brazos",
                      "core",
                    ].map((group) => (
                      <button
                        key={group}
                        onClick={() =>
                          setSelectedMuscleGroups((prev) =>
                            prev.includes(group)
                              ? prev.filter((g) => g !== group)
                              : [...prev, group]
                          )
                        }
                        className={`px-3 py-1 rounded-sm text-sm font-light transition-all duration-300 ${
                          selectedMuscleGroups.includes(group)
                            ? "bg-white text-[#0a0a0a]"
                            : "bg-[#0a0a0a] text-gray-400 hover:text-white border border-[#1f1f1f] hover:border-white"
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!selectedExercise && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      onClick={() => selectExercise(exercise)}
                      className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4 hover:border-white transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-[#141414] rounded-sm overflow-hidden flex-shrink-0">
                          <img
                            src={exercise.image_url}
                            alt={exercise.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-light text-white mb-1">
                            {exercise.name}
                          </h3>
                          <p className="text-sm text-gray-400 font-light mb-2 line-clamp-2">
                            {exercise.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{getEquipmentLabel(exercise.equipment)}</span>
                            <span>•</span>
                            <span>
                              {exercise.muscle_groups.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredExercises.length === 0 && (
                  <div className="text-center py-12">
                    <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-thin text-white mb-2">
                      No se encontraron ejercicios
                    </h3>
                    <p className="text-gray-400 font-light">
                      Intenta ajustar los filtros de búsqueda
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Assign to Week Modal */}
      {assigningRoutine && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50"
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
                  {routine.creator_id === profile?.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(routine);
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Editar rutina"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoutine(routine.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar rutina"
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
                        Ejercicios ({routineExercises.length})
                      </h4>
                      {routine.creator_id === profile?.id && (
                        <button
                          onClick={openExerciseSelector}
                          className="flex items-center gap-2 px-3 py-1 bg-[#0a0a0a] text-white rounded-sm font-light hover:bg-[#1f1f1f] transition-all duration-300 text-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      )}
                    </div>

                    {/* Exercises List */}
                    {routineExercises.length === 0 ? (
                      <p className="text-gray-400 text-sm font-light text-center py-4">
                        No hay ejercicios en esta rutina
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {routineExercises.map((exercise, index) => (
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
                                  {exercise.exercise_library?.name}
                                </h5>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>{exercise.sets} series</span>
                                <span>{exercise.reps} reps</span>
                                <span>
                                  {exercise.weight_kg > 0
                                    ? `${exercise.weight_kg}kg`
                                    : "Sin peso"}
                                </span>
                                <span>{exercise.rest_seconds}s descanso</span>
                              </div>
                              {exercise.notes && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {exercise.notes}
                                </p>
                              )}
                            </div>
                            {routine.creator_id === profile?.id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    startEditRoutineExercise(exercise)
                                  }
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteRoutineExercise(
                                      exercise.id,
                                      routine.id
                                    )
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
