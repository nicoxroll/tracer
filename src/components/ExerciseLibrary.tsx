import { Dumbbell, Filter, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Exercise = {
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

const muscleGroups = [
  "pecho",
  "espalda",
  "piernas",
  "hombros",
  "brazos",
  "core",
  "bíceps",
  "tríceps",
  "dorsales",
  "cuádriceps",
  "isquiotibiales",
  "glúteos",
  "gemelos",
  "deltoides",
  "trapecio",
  "abdominales",
  "oblicuos",
];

const equipmentTypes = [
  "barbell",
  "dumbbell",
  "machine",
  "bodyweight",
  "cable",
  "kettlebell",
  "equipment",
];

const exerciseTypes = ["strength", "cardio", "flexibility", "plyometric"];

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>(
    []
  );
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    filterExercises();
  }, [
    exercises,
    searchTerm,
    selectedMuscleGroups,
    selectedEquipment,
    selectedType,
    selectedDifficulty,
  ]);

  async function loadExercises() {
    try {
      const { data, error } = await supabase
        .from("exercise_library")
        .select("*")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterExercises() {
    let filtered = exercises;

    // Search by name or description
    if (searchTerm) {
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by muscle groups
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter((ex) =>
        selectedMuscleGroups.some((mg) => ex.muscle_groups.includes(mg))
      );
    }

    // Filter by equipment
    if (selectedEquipment.length > 0) {
      filtered = filtered.filter((ex) =>
        selectedEquipment.includes(ex.equipment)
      );
    }

    // Filter by type
    if (selectedType) {
      filtered = filtered.filter((ex) => ex.exercise_type === selectedType);
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter((ex) => ex.difficulty === selectedDifficulty);
    }

    setFilteredExercises(filtered);
  }

  function toggleMuscleGroup(group: string) {
    setSelectedMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  function toggleEquipment(eq: string) {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedMuscleGroups([]);
    setSelectedEquipment([]);
    setSelectedType("");
    setSelectedDifficulty("");
  }

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

  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      strength: "Fuerza",
      cardio: "Cardio",
      flexibility: "Flexibilidad",
      plyometric: "Pliométrico",
    };
    return labels[type] || type;
  };

  const getDifficultyLabel = (diff: string): string => {
    const labels: { [key: string]: string } = {
      beginner: "Principiante",
      intermediate: "Intermedio",
      advanced: "Avanzado",
    };
    return labels[diff] || diff;
  };

  const getDifficultyColor = (diff: string): string => {
    const colors: { [key: string]: string } = {
      beginner: "text-green-500",
      intermediate: "text-yellow-500",
      advanced: "text-red-500",
    };
    return colors[diff] || "text-gray-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-thin text-white mb-2">
          Biblioteca de Ejercicios
        </h1>
        <p className="text-gray-400 font-light">
          Explora {exercises.length} ejercicios con imágenes e instrucciones
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#141414] border border-[#1f1f1f] rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-[#141414] border border-[#1f1f1f] rounded-sm text-white hover:border-white transition-all duration-300 flex items-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Filtros
            {(selectedMuscleGroups.length > 0 ||
              selectedEquipment.length > 0 ||
              selectedType ||
              selectedDifficulty) && (
              <span className="px-2 py-1 bg-white text-[#0a0a0a] rounded-sm text-xs">
                {selectedMuscleGroups.length +
                  selectedEquipment.length +
                  (selectedType ? 1 : 0) +
                  (selectedDifficulty ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light text-white">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Limpiar todo
              </button>
            </div>

            {/* Muscle Groups */}
            <div>
              <h4 className="text-sm font-light text-gray-400 mb-3">
                Grupos Musculares
              </h4>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => toggleMuscleGroup(group)}
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

            {/* Equipment */}
            <div>
              <h4 className="text-sm font-light text-gray-400 mb-3">
                Equipamiento
              </h4>
              <div className="flex flex-wrap gap-2">
                {equipmentTypes.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`px-3 py-1 rounded-sm text-sm font-light transition-all duration-300 ${
                      selectedEquipment.includes(eq)
                        ? "bg-white text-[#0a0a0a]"
                        : "bg-[#0a0a0a] text-gray-400 hover:text-white border border-[#1f1f1f] hover:border-white"
                    }`}
                  >
                    {getEquipmentLabel(eq)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type and Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-light text-gray-400 mb-3">Tipo</h4>
                <div className="flex flex-wrap gap-2">
                  {exerciseTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setSelectedType(selectedType === type ? "" : type)
                      }
                      className={`px-3 py-1 rounded-sm text-sm font-light transition-all duration-300 ${
                        selectedType === type
                          ? "bg-white text-[#0a0a0a]"
                          : "bg-[#0a0a0a] text-gray-400 hover:text-white border border-[#1f1f1f] hover:border-white"
                      }`}
                    >
                      {getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-light text-gray-400 mb-3">
                  Dificultad
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["beginner", "intermediate", "advanced"].map((diff) => (
                    <button
                      key={diff}
                      onClick={() =>
                        setSelectedDifficulty(
                          selectedDifficulty === diff ? "" : diff
                        )
                      }
                      className={`px-3 py-1 rounded-sm text-sm font-light transition-all duration-300 ${
                        selectedDifficulty === diff
                          ? "bg-white text-[#0a0a0a]"
                          : "bg-[#0a0a0a] text-gray-400 hover:text-white border border-[#1f1f1f] hover:border-white"
                      }`}
                    >
                      {getDifficultyLabel(diff)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        <p className="text-gray-400 font-light mb-4">
          {filteredExercises.length} ejercicio
          {filteredExercises.length !== 1 ? "s" : ""} encontrado
          {filteredExercises.length !== 1 ? "s" : ""}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
              className="bg-[#141414] border border-[#1f1f1f] rounded-sm overflow-hidden hover:border-white transition-all duration-300 cursor-pointer group"
            >
              <div className="aspect-video bg-[#0a0a0a] relative overflow-hidden">
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
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 bg-[#0a0a0a]/80 backdrop-blur-sm rounded-sm text-xs font-light ${getDifficultyColor(
                      exercise.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(exercise.difficulty)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-light text-white mb-2">
                  {exercise.name}
                </h3>
                <p className="text-sm text-gray-400 font-light mb-3 line-clamp-2">
                  {exercise.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {exercise.muscle_groups.slice(0, 3).map((group) => (
                    <span
                      key={group}
                      className="px-2 py-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-xs text-gray-400"
                    >
                      {group}
                    </span>
                  ))}
                  {exercise.muscle_groups.length > 3 && (
                    <span className="px-2 py-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-xs text-gray-400">
                      +{exercise.muscle_groups.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Dumbbell className="w-3 h-3" />
                  <span>{getEquipmentLabel(exercise.equipment)}</span>
                  <span>•</span>
                  <span>{getTypeLabel(exercise.exercise_type)}</span>
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

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div
          className="fixed top-0 left-0 w-screen h-screen bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExercise(null)}
        >
          <div
            className="bg-[#141414] border border-[#1f1f1f] rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#141414] border-b border-[#1f1f1f] p-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-thin text-white">
                {selectedExercise.name}
              </h2>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="aspect-video bg-[#0a0a0a] rounded-sm overflow-hidden">
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

              <div>
                <h3 className="text-sm font-light text-gray-400 mb-2">
                  Descripción
                </h3>
                <p className="text-white font-light">
                  {selectedExercise.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4">
                  <div className="text-sm text-gray-400 mb-1">Equipamiento</div>
                  <div className="text-white font-light">
                    {getEquipmentLabel(selectedExercise.equipment)}
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4">
                  <div className="text-sm text-gray-400 mb-1">Tipo</div>
                  <div className="text-white font-light">
                    {getTypeLabel(selectedExercise.exercise_type)}
                  </div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4">
                  <div className="text-sm text-gray-400 mb-1">Dificultad</div>
                  <div
                    className={`font-light ${getDifficultyColor(
                      selectedExercise.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(selectedExercise.difficulty)}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-light text-gray-400 mb-3">
                  Grupos Musculares
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExercise.muscle_groups.map((group) => (
                    <span
                      key={group}
                      className="px-3 py-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm text-sm text-white"
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              {selectedExercise.instructions.length > 0 && (
                <div>
                  <h3 className="text-sm font-light text-gray-400 mb-3">
                    Instrucciones
                  </h3>
                  <ol className="space-y-2">
                    {selectedExercise.instructions.map((instruction, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-white font-light"
                      >
                        <span className="text-gray-400">{index + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
