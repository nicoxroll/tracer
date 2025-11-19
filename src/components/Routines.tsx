import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, TrendingUp, Star, Plus, ChevronRight } from 'lucide-react';

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
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [filter, setFilter] = useState<'all' | 'default' | 'public' | 'mine'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, [filter]);

  async function loadRoutines() {
    try {
      setLoading(true);
      let query = supabase.from('routines').select(`
        *,
        profiles:creator_id (username)
      `);

      if (filter === 'default') {
        query = query.eq('is_default', true);
      } else if (filter === 'public') {
        query = query.eq('is_public', true);
      } else if (filter === 'mine') {
        query = query.eq('creator_id', profile?.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'from-green-500 to-emerald-500';
      case 'intermediate': return 'from-yellow-500 to-orange-500';
      case 'advanced': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-thin text-white mb-2">Rutinas</h1>
          <p className="text-gray-400 font-light">Explora y selecciona rutinas de entrenamiento</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300">
          <Plus className="w-4 h-4" />
          Crear Rutina
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'default', label: 'Por Defecto' },
          { id: 'public', label: 'Publicadas' },
          { id: 'mine', label: 'Mis Rutinas' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 whitespace-nowrap ${
              filter === tab.id
                ? 'bg-white text-[#0a0a0a]'
                : 'bg-[#141414] border border-[#1f1f1f] text-gray-400 hover:text-white'
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
              className="bg-[#141414] border border-[#1f1f1f] rounded-sm overflow-hidden hover:border-white transition-all duration-300 cursor-pointer group"
            >
              <div className={`h-2 bg-gradient-to-r ${getDifficultyColor(routine.difficulty)}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-light text-white group-hover:text-gray-300 transition-colors duration-300">
                    {routine.title}
                  </h3>
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
                    <span className="font-light">{routine.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-light capitalize">{routine.difficulty}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light">
                    por {routine.profiles?.username || 'Tracer'}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
