import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

type WorkoutSession = {
  id: string;
  date: string;
  completed: boolean;
  routine_id: string;
  duration_minutes: number;
  routines?: {
    title: string;
  };
};

export default function Calendar() {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, [currentMonth]);

  async function loadWorkouts() {
    if (!profile) return;

    try {
      setLoading(true);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          routines:routine_id (title)
        `)
        .eq('user_id', profile.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getWorkoutForDay = (day: number) => {
    const dateStr = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    ).toISOString().split('T')[0];
    return workouts.find((w) => w.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const completedDays = workouts.filter(w => w.completed).length;
  const totalDays = workouts.length;
  const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-thin text-white mb-2">Seguimiento</h1>
        <p className="text-gray-400 font-light">Rastrea tus días de entrenamiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
          <div className="text-sm text-gray-400 font-light mb-2">Días Completados</div>
          <div className="text-4xl font-thin text-white">{completedDays}</div>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
          <div className="text-sm text-gray-400 font-light mb-2">Días Programados</div>
          <div className="text-4xl font-thin text-white">{totalDays}</div>
        </div>
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
          <div className="text-sm text-gray-400 font-light mb-2">Tasa de Cumplimiento</div>
          <div className="text-4xl font-thin text-white">{completionRate}%</div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-thin text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-[#1f1f1f] rounded-sm transition-colors duration-300"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[#1f1f1f] rounded-sm transition-colors duration-300"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-light text-gray-400 py-2">
                {day}
              </div>
            ))}
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const workout = getWorkoutForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentMonth.getMonth() === new Date().getMonth() &&
                currentMonth.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-sm flex flex-col items-center justify-center transition-all duration-300 ${
                    isToday
                      ? 'border-white bg-white/5'
                      : 'border-[#1f1f1f]'
                  } ${
                    workout
                      ? workout.completed
                        ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'
                        : 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                      : 'hover:bg-[#1f1f1f]'
                  }`}
                >
                  <span className="text-sm font-light text-white">{day}</span>
                  {workout && (
                    <div className="mt-1">
                      {workout.completed ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {workouts.length > 0 && (
        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
          <h2 className="text-2xl font-thin text-white mb-4">Entrenamientos del Mes</h2>
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-sm border border-[#1f1f1f]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${workout.completed ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="text-sm font-light text-white">
                      {workout.routines?.title || 'Entrenamiento'}
                    </div>
                    <div className="text-xs text-gray-400 font-light">
                      {new Date(workout.date).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                  </div>
                </div>
                {workout.completed && (
                  <span className="text-xs text-gray-400 font-light">
                    {workout.duration_minutes} min
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
