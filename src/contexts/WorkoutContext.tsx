import { createContext, useContext, useState } from "react";

type ActiveWorkout = {
  id: string;
  routine: {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    difficulty: string;
  };
  exercises: any[];
  currentExerciseIndex: number;
  startTime: Date;
  isActive: boolean;
};

type WorkoutContextType = {
  activeWorkout: ActiveWorkout | null;
  startWorkout: (routine: any, exercises: any[]) => void;
  endWorkout: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null
  );

  function startWorkout(routine: any, exercises: any[]) {
    setActiveWorkout({
      id: `workout_${Date.now()}`,
      routine,
      exercises,
      currentExerciseIndex: 0,
      startTime: new Date(),
      isActive: true,
    });
  }

  function endWorkout() {
    setActiveWorkout(null);
  }

  function nextExercise() {
    if (
      activeWorkout &&
      activeWorkout.currentExerciseIndex < activeWorkout.exercises.length - 1
    ) {
      setActiveWorkout({
        ...activeWorkout,
        currentExerciseIndex: activeWorkout.currentExerciseIndex + 1,
      });
    }
  }

  function previousExercise() {
    if (activeWorkout && activeWorkout.currentExerciseIndex > 0) {
      setActiveWorkout({
        ...activeWorkout,
        currentExerciseIndex: activeWorkout.currentExerciseIndex - 1,
      });
    }
  }

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        endWorkout,
        nextExercise,
        previousExercise,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}
