import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  Square,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useWorkout } from "../contexts/WorkoutContext";

export default function ActiveWorkoutPanel() {
  const { activeWorkout, endWorkout, nextExercise, previousExercise } =
    useWorkout();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [exerciseTime, setExerciseTime] = useState(0); // seconds for current exercise
  const [restTime, setRestTime] = useState(0); // seconds for rest
  const [isResting, setIsResting] = useState(false);
  const [totalWorkoutTime, setTotalWorkoutTime] = useState(0); // total workout time

  // Timer for exercise and rest
  useEffect(() => {
    if (!activeWorkout || isPaused) return;

    const interval = setInterval(() => {
      setTotalWorkoutTime((prev) => prev + 1);

      if (isResting) {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setExerciseTime((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout, isPaused, isResting]);

  if (!activeWorkout) return null;

  const currentExercise =
    activeWorkout.exercises[activeWorkout.currentExerciseIndex];
  const progress =
    ((activeWorkout.currentExerciseIndex + 1) /
      activeWorkout.exercises.length) *
    100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartRest = () => {
    if (currentExercise?.rest_seconds) {
      setRestTime(currentExercise.rest_seconds);
      setIsResting(true);
      setExerciseTime(0);
    }
  };

  const handleNextExercise = () => {
    setExerciseTime(0);
    setRestTime(0);
    setIsResting(false);
    nextExercise();
  };

  const handlePreviousExercise = () => {
    setExerciseTime(0);
    setRestTime(0);
    setIsResting(false);
    previousExercise();
  };

  const handleEndWorkout = () => {
    setExerciseTime(0);
    setRestTime(0);
    setTotalWorkoutTime(0);
    setIsResting(false);
    setIsPaused(false);
    endWorkout();
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-[#141414] border-r border-[#1f1f1f] shadow-xl z-50 transition-all duration-300 ${
        isMinimized ? "w-16" : "w-96"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
        {!isMinimized && (
          <div>
            <h3 className="text-lg font-light text-white">
              Entrenamiento Activo
            </h3>
            <p className="text-sm text-gray-400">
              {activeWorkout.routine.title}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${
                isMinimized ? "" : "rotate-180"
              }`}
            />
          </button>
          <button
            onClick={handleEndWorkout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col h-[calc(100%-73px)]">
          {/* Progress Bar */}
          <div className="p-4 border-b border-[#1f1f1f]">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>
                Ejercicio {activeWorkout.currentExerciseIndex + 1} de{" "}
                {activeWorkout.exercises.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[#0a0a0a] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timers */}
          <div className="p-4 border-b border-[#1f1f1f] grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-3 text-center">
              <Clock className="w-5 h-5 text-white mx-auto mb-1" />
              <div className="text-lg font-thin text-white">
                {formatTime(totalWorkoutTime)}
              </div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-3 text-center">
              <Timer className="w-5 h-5 text-white mx-auto mb-1" />
              <div className="text-lg font-thin text-white">
                {isResting ? formatTime(restTime) : formatTime(exerciseTime)}
              </div>
              <div className="text-xs text-gray-400">
                {isResting ? "Descanso" : "Ejercicio"}
              </div>
            </div>
          </div>

          {/* Current Exercise */}
          {currentExercise && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-xl font-light text-white mb-2">
                  {currentExercise.name}
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-gray-400 mb-2">
                  <div>
                    <div className="text-2xl font-thin text-white">
                      {currentExercise.sets}
                    </div>
                    <div className="text-xs">Series</div>
                  </div>
                  <div>
                    <div className="text-2xl font-thin text-white">
                      {currentExercise.reps}
                    </div>
                    <div className="text-xs">Reps</div>
                  </div>
                  <div>
                    <div className="text-2xl font-thin text-white">
                      {currentExercise.rest_seconds}s
                    </div>
                    <div className="text-xs">Descanso</div>
                  </div>
                </div>
                {currentExercise.description && (
                  <p className="text-sm text-gray-400 mt-2">
                    {currentExercise.description}
                  </p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handlePreviousExercise}
                  disabled={activeWorkout.currentExerciseIndex === 0}
                  className="flex-1 p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white mx-auto" />
                </button>

                <button
                  onClick={handleNextExercise}
                  disabled={
                    activeWorkout.currentExerciseIndex ===
                    activeWorkout.exercises.length - 1
                  }
                  className="flex-1 p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white mx-auto" />
                </button>
              </div>

              {/* Rest Button */}
              {!isResting && (
                <button
                  onClick={handleStartRest}
                  className="w-full px-4 py-3 bg-[#1f1f1f] text-white rounded-sm font-light hover:bg-[#2f2f2f] transition-all duration-300 mb-3"
                >
                  Iniciar Descanso ({currentExercise.rest_seconds}s)
                </button>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="p-4 border-t border-[#1f1f1f] space-y-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar
                </>
              )}
            </button>
            <button
              onClick={handleEndWorkout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-sm font-light hover:bg-red-700 transition-all duration-300"
            >
              <Square className="w-4 h-4" />
              Terminar Entrenamiento
            </button>
          </div>
        </div>
      )}

      {isMinimized && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-2">
            {isPaused ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="text-xs text-gray-400 text-center">
            Entrenamiento
            <br />
            {isPaused ? "Pausado" : "Activo"}
          </div>
        </div>
      )}
    </div>
  );
}
