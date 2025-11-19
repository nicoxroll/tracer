import { useAuth } from '../contexts/AuthContext';
import { Award, TrendingUp, Target, Zap, Heart } from 'lucide-react';

const getRank = (avg: number): string => {
  if (avg >= 90) return 'S';
  if (avg >= 80) return 'A';
  if (avg >= 70) return 'B';
  if (avg >= 60) return 'C';
  if (avg >= 50) return 'D';
  return 'E';
};

const getRankColor = (rank: string): string => {
  switch (rank) {
    case 'S': return 'from-yellow-500 to-orange-500';
    case 'A': return 'from-green-500 to-emerald-500';
    case 'B': return 'from-blue-500 to-cyan-500';
    case 'C': return 'from-gray-500 to-slate-500';
    case 'D': return 'from-gray-600 to-gray-700';
    default: return 'from-gray-700 to-gray-800';
  }
};

export default function Profile() {
  const { profile } = useAuth();

  if (!profile) return null;

  const stats = [
    { name: 'Fuerza', value: profile.fuerza, icon: Zap, color: 'from-red-500 to-orange-500' },
    { name: 'Resistencia', value: profile.resistencia, icon: Heart, color: 'from-blue-500 to-cyan-500' },
    { name: 'Técnica', value: profile.tecnica, icon: Target, color: 'from-green-500 to-emerald-500' },
    { name: 'Definición', value: profile.definicion, icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
    { name: 'Constancia', value: profile.constancia, icon: Award, color: 'from-yellow-500 to-orange-500' },
  ];

  const averageStat = Math.round(
    (profile.fuerza + profile.resistencia + profile.tecnica + profile.definicion + profile.constancia) / 5
  );
  const overallRank = getRank(averageStat);

  return (
    <div className="space-y-6">
      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 bg-gradient-to-br from-white to-gray-300 rounded-sm flex items-center justify-center text-6xl font-thin text-[#0a0a0a]">
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-thin text-white mb-2">{profile.full_name}</h1>
            <p className="text-gray-400 font-light mb-4">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-300 font-light mb-4">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white text-[#0a0a0a] text-xs rounded-sm font-light">
                {profile.role === 'coach' ? 'COACH' : 'TRAINER'}
              </span>
            </div>
          </div>

          <div className={`w-32 h-32 bg-gradient-to-br ${getRankColor(overallRank)} rounded-sm flex flex-col items-center justify-center`}>
            <span className="text-6xl font-thin text-white">{overallRank}</span>
            <span className="text-xs text-white/80 font-light mt-1">RANK</span>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">Estadísticas</h2>
        <div className="space-y-6">
          {stats.map((stat) => (
            <div key={stat.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-light text-gray-300">{stat.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-light text-white">{stat.value}</span>
                  <span className="text-sm font-light text-gray-400 w-8">
                    {getRank(stat.value)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-500 ease-out rounded-full`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">Sistema de Clasificación</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['S', 'A', 'B', 'C', 'D', 'E'].map((rank) => (
            <div
              key={rank}
              className={`bg-gradient-to-br ${getRankColor(rank)} rounded-sm p-4 flex flex-col items-center justify-center`}
            >
              <span className="text-4xl font-thin text-white">{rank}</span>
              <span className="text-xs text-white/80 font-light mt-1">
                {rank === 'S' && '90-100'}
                {rank === 'A' && '80-89'}
                {rank === 'B' && '70-79'}
                {rank === 'C' && '60-69'}
                {rank === 'D' && '50-59'}
                {rank === 'E' && '0-49'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
