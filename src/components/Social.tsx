import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Search,
  ChevronRight,
  Lock,
  Globe,
  TrendingUp,
  Award,
  Target,
  Zap,
  Heart,
} from "lucide-react";
import { Profile } from "../lib/supabase";

type Routine = {
  id: string;
  title: string;
  difficulty: string;
  duration_minutes: number;
};

export default function Social() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userRoutines, setUserRoutines] = useState<Routine[]>([]);
  const [loadingRoutines, setLoadingRoutines] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = supabase
          .from("profiles")
          .select("*")
          .or(
            `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
          )
          .limit(20);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserRoutines(userId: string) {
    try {
      setLoadingRoutines(true);
      const { data, error } = await supabase
        .from("routines")
        .select("id, title, difficulty, duration_minutes")
        .eq("creator_id", userId)
        .eq("is_public", true);

      if (error) throw error;
      setUserRoutines(data || []);
    } catch (error) {
      console.error("Error loading user routines:", error);
    } finally {
      setLoadingRoutines(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleUserClick = (user: Profile) => {
    setSelectedUser(user);
    if (user.is_public) {
      loadUserRoutines(user.id);
    } else {
      setUserRoutines([]);
    }
  };

  const getRank = (avg: number): string => {
    if (avg >= 90) return "S";
    if (avg >= 80) return "A";
    if (avg >= 70) return "B";
    if (avg >= 60) return "C";
    if (avg >= 50) return "D";
    return "E";
  };

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case "S":
        return "from-yellow-500 to-orange-500";
      case "A":
        return "from-green-500 to-emerald-500";
      case "B":
        return "from-blue-500 to-cyan-500";
      case "C":
        return "from-gray-500 to-slate-500";
      case "D":
        return "from-gray-600 to-gray-700";
      default:
        return "from-gray-700 to-gray-800";
    }
  };

  if (selectedUser) {
    const stats = [
      {
        name: "Fuerza",
        value: selectedUser.fuerza,
        icon: Zap,
        color: "from-red-500 to-orange-500",
      },
      {
        name: "Resistencia",
        value: selectedUser.resistencia,
        icon: Heart,
        color: "from-blue-500 to-cyan-500",
      },
      {
        name: "Técnica",
        value: selectedUser.tecnica,
        icon: Target,
        color: "from-green-500 to-emerald-500",
      },
      {
        name: "Definición",
        value: selectedUser.definicion,
        icon: TrendingUp,
        color: "from-purple-500 to-pink-500",
      },
      {
        name: "Constancia",
        value: selectedUser.constancia,
        icon: Award,
        color: "from-yellow-500 to-orange-500",
      },
    ];

    const averageStat = Math.round(
      (selectedUser.fuerza +
        selectedUser.resistencia +
        selectedUser.tecnica +
        selectedUser.definicion +
        selectedUser.constancia) /
        5
    );
    const overallRank = getRank(averageStat);

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedUser(null)}
          className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Volver a la lista
        </button>

        <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 bg-gradient-to-br from-white to-gray-300 rounded-sm flex items-center justify-center text-6xl font-thin text-[#0a0a0a]">
              {selectedUser.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <h1 className="text-3xl font-thin text-white">
                  {selectedUser.full_name}
                </h1>
                {selectedUser.is_public ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs">
                    <Globe className="w-3 h-3" /> Público
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs">
                    <Lock className="w-3 h-3" /> Privado
                  </span>
                )}
              </div>
              <p className="text-gray-400 font-light mb-4">
                @{selectedUser.username}
              </p>
              {selectedUser.bio && (
                <p className="text-gray-300 font-light mb-4">
                  {selectedUser.bio}
                </p>
              )}
            </div>

            {selectedUser.is_public && (
              <div
                className={`w-32 h-32 bg-gradient-to-br ${getRankColor(
                  overallRank
                )} rounded-sm flex flex-col items-center justify-center`}
              >
                <span className="text-6xl font-thin text-white">
                  {overallRank}
                </span>
                <span className="text-xs text-white/80 font-light mt-1">
                  RANK
                </span>
              </div>
            )}
          </div>
        </div>

        {selectedUser.is_public ? (
          <>
            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
              <h2 className="text-2xl font-thin text-white mb-6">
                Estadísticas
              </h2>
              <div className="space-y-6">
                {stats.map((stat) => (
                  <div key={stat.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <stat.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-light text-gray-300">
                          {stat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-light text-white">
                          {stat.value}
                        </span>
                        <span className="text-sm font-light text-gray-400 w-8">
                          {getRank(stat.value)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                        style={{ width: `${stat.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
              <h2 className="text-2xl font-thin text-white mb-6">
                Rutinas Públicas
              </h2>
              {loadingRoutines ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userRoutines.length === 0 ? (
                <p className="text-gray-400 font-light text-center py-8">
                  Este usuario no tiene rutinas públicas.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRoutines.map((routine) => (
                    <div
                      key={routine.id}
                      className="bg-[#0a0a0a] border border-[#1f1f1f] p-4 rounded-sm"
                    >
                      <h3 className="text-white font-light mb-2">
                        {routine.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="capitalize">{routine.difficulty}</span>
                        <span>{routine.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-12 text-center">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-light text-white mb-2">
              Perfil Privado
            </h3>
            <p className="text-gray-400 font-light">
              Las estadísticas y rutinas de este usuario son privadas.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-thin text-white mb-2">Comunidad</h1>
        <p className="text-gray-400 font-light">
          Encuentra otros usuarios y mira su progreso
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre de usuario..."
          className="w-full bg-[#141414] border border-[#1f1f1f] rounded-sm pl-12 pr-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300"
        />
      </form>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserClick(user)}
              className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-4 hover:border-white transition-all duration-300 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-300 rounded-sm flex items-center justify-center text-xl font-thin text-[#0a0a0a]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-light truncate group-hover:text-gray-300 transition-colors">
                    {user.full_name}
                  </h3>
                  <p className="text-gray-400 text-sm font-light truncate">
                    @{user.username}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
