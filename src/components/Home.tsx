import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Calendar, Dumbbell, Users, Award, Target } from 'lucide-react';

export default function Home() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    completedWorkouts: 0,
    currentStreak: 0,
    totalRoutines: 0,
    trainersCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    if (!profile) return;

    try {
      setLoading(true);

      const { data: workouts } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', profile.id);

      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .eq('creator_id', profile.id);

      let trainersCount = 0;
      if (profile.role === 'coach') {
        const { data: trainers } = await supabase
          .from('profiles')
          .select('id')
          .eq('coach_id', profile.id);
        trainersCount = trainers?.length || 0;
      }

      const completed = workouts?.filter(w => w.completed).length || 0;

      setStats({
        totalWorkouts: workouts?.length || 0,
        completedWorkouts: completed,
        currentStreak: 0,
        totalRoutines: routines?.length || 0,
        trainersCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const completionRate = stats.totalWorkouts > 0
    ? Math.round((stats.completedWorkouts / stats.totalWorkouts) * 100)
    : 0;

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
              <div className="text-3xl font-thin text-white mb-1">{stats.totalWorkouts}</div>
              <div className="text-sm text-gray-400 font-light">Entrenamientos Totales</div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-gray-400" />
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-sm" />
              </div>
              <div className="text-3xl font-thin text-white mb-1">{stats.completedWorkouts}</div>
              <div className="text-sm text-gray-400 font-light">Completados</div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Dumbbell className="w-8 h-8 text-gray-400" />
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-sm" />
              </div>
              <div className="text-3xl font-thin text-white mb-1">{stats.totalRoutines}</div>
              <div className="text-sm text-gray-400 font-light">Rutinas Creadas</div>
            </div>

            {profile?.role === 'coach' ? (
              <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-sm" />
                </div>
                <div className="text-3xl font-thin text-white mb-1">{stats.trainersCount}</div>
                <div className="text-sm text-gray-400 font-light">Trainers a Cargo</div>
              </div>
            ) : (
              <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-white transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-sm" />
                </div>
                <div className="text-3xl font-thin text-white mb-1">{completionRate}%</div>
                <div className="text-sm text-gray-400 font-light">Tasa de Éxito</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-gray-400" />
                <h2 className="text-2xl font-thin text-white">Estadísticas Rápidas</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-light text-gray-300">Fuerza</span>
                    <span className="text-sm font-light text-white">{profile?.fuerza}/100</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 rounded-full"
                      style={{ width: `${profile?.fuerza}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-light text-gray-300">Resistencia</span>
                    <span className="text-sm font-light text-white">{profile?.resistencia}/100</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 rounded-full"
                      style={{ width: `${profile?.resistencia}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-light text-gray-300">Constancia</span>
                    <span className="text-sm font-light text-white">{profile?.constancia}/100</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 rounded-full"
                      style={{ width: `${profile?.constancia}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-gray-400" />
                <h2 className="text-2xl font-thin text-white">Progreso Reciente</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-sm">
                  <div>
                    <div className="text-sm font-light text-white mb-1">Entrenamientos Completados</div>
                    <div className="text-xs text-gray-400 font-light">Este mes</div>
                  </div>
                  <div className="text-2xl font-thin text-white">{stats.completedWorkouts}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-sm">
                  <div>
                    <div className="text-sm font-light text-white mb-1">Tasa de Cumplimiento</div>
                    <div className="text-xs text-gray-400 font-light">Global</div>
                  </div>
                  <div className="text-2xl font-thin text-white">{completionRate}%</div>
                </div>

                {profile?.role === 'coach' && (
                  <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-sm">
                    <div>
                      <div className="text-sm font-light text-white mb-1">Trainers Activos</div>
                      <div className="text-xs text-gray-400 font-light">Bajo tu supervisión</div>
                    </div>
                    <div className="text-2xl font-thin text-white">{stats.trainersCount}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
