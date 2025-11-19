import { Globe, Lock, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type UserChallengeWithDetails = {
  id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string;
  challenge: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    target_value: number;
    stat_type: string;
  };
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "strength":
      return "💪";
    case "endurance":
      return "🏃";
    case "technique":
      return "🎯";
    case "consistency":
      return "📅";
    default:
      return "🏆";
  }
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

const calculateLevel = (experience: number) => {
  if (experience >= 1600) return "S";
  if (experience >= 800) return "A";
  if (experience >= 400) return "B";
  if (experience >= 200) return "C";
  if (experience >= 50) return "D";
  return "E";
};

const getNextLevelXP = (currentLevel: string) => {
  switch (currentLevel) {
    case "E":
      return 50;
    case "D":
      return 100;
    case "C":
      return 200;
    case "B":
      return 400;
    case "A":
      return 800;
    case "S":
      return 1600; // Max level
    default:
      return 50;
  }
};

export default function Profile() {
  const { profile } = useAuth();
  const [isPublic, setIsPublic] = useState(profile?.is_public || false);
  const [updating, setUpdating] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<
    UserChallengeWithDetails[]
  >([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState<
    UserChallengeWithDetails[]
  >([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  const loadCompletedChallenges = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_challenges")
        .select(
          `
          *,
          challenge:challenge_id (*)
        `
        )
        .eq("user_id", profile?.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const challenges = data || [];
      setCompletedChallenges(challenges.filter((c) => c.completed));
      setAcceptedChallenges(challenges.filter((c) => !c.completed));
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoadingChallenges(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      setIsPublic(profile.is_public || false);
      loadCompletedChallenges();
    }
  }, [profile, loadCompletedChallenges]);

  const togglePrivacy = async () => {
    if (!profile) return;
    try {
      setUpdating(true);
      const newValue = !isPublic;
      const { error } = await supabase
        .from("profiles")
        .update({ is_public: newValue })
        .eq("id", profile.id);

      if (error) throw error;
      setIsPublic(newValue);
    } catch (error) {
      console.error("Error updating privacy:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (!profile) return null;

  const getRank = (value: number): string => {
    if (value >= 90) return "S";
    if (value >= 80) return "A";
    if (value >= 70) return "B";
    if (value >= 60) return "C";
    if (value >= 50) return "D";
    return "E";
  };

  const averageStat = Math.round(
    (profile.fuerza +
      profile.resistencia +
      profile.tecnica +
      profile.definicion +
      profile.constancia) /
      5
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
            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
              <h1 className="text-3xl font-thin text-white">
                {profile.full_name}
              </h1>
              <button
                onClick={togglePrivacy}
                disabled={updating}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-light transition-all duration-300 ${
                  isPublic
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
              >
                {isPublic ? (
                  <Globe className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                {isPublic ? "Público" : "Privado"}
              </button>
            </div>
            <p className="text-gray-400 font-light mb-4">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-300 font-light mb-4">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white text-[#0a0a0a] text-xs rounded-sm font-light">
                {profile.role === "coach" ? "COACH" : "TRAINER"}
              </span>
            </div>
          </div>

          <div
            className={`w-32 h-32 bg-gradient-to-br ${getRankColor(
              overallRank
            )} rounded-sm flex flex-col items-center justify-center`}
          >
            <span className="text-6xl font-thin text-white">{overallRank}</span>
            <span className="text-xs text-white/80 font-light mt-1">RANK</span>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">
          Estadísticas Detalladas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              name: "Fuerza",
              value: profile.fuerza,
              rank: getRank(profile.fuerza),
            },
            {
              name: "Resistencia",
              value: profile.resistencia,
              rank: getRank(profile.resistencia),
            },
            {
              name: "Técnica",
              value: profile.tecnica,
              rank: getRank(profile.tecnica),
            },
            {
              name: "Velocidad",
              value: profile.definicion,
              rank: getRank(profile.definicion),
            },
            {
              name: "Constancia",
              value: profile.constancia,
              rank: getRank(profile.constancia),
            },
          ].map((stat) => (
            <div key={stat.name} className="text-center">
              <div
                className={`w-16 h-16 mx-auto mb-2 bg-gradient-to-br ${getRankColor(
                  stat.rank
                )} rounded-sm flex items-center justify-center`}
              >
                <span className="text-2xl font-thin text-white">
                  {stat.rank}
                </span>
              </div>
              <h3 className="text-white font-light text-sm mb-1">
                {stat.name}
              </h3>
              <p className="text-gray-400 text-xs">{stat.value}/100</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">
          Progreso de Nivel
        </h2>
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-4xl font-thin text-white mb-1">
              {profile.level || "E"}
            </div>
            <div className="text-sm text-gray-400">Nivel Actual</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-thin text-white mb-1">
              {profile.experience || 0}
            </div>
            <div className="text-sm text-gray-400">XP Total</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-thin text-white mb-1">
              {calculateLevel(
                (profile.experience || 0) +
                  getNextLevelXP(profile.level || "E") -
                  (profile.experience || 0)
              )}
            </div>
            <div className="text-sm text-gray-400">Siguiente Nivel</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Nivel {profile.level || "E"}</span>
            <span>
              {profile.experience || 0} / {getNextLevelXP(profile.level || "E")}{" "}
              XP
            </span>
          </div>
          <div className="w-full bg-[#0a0a0a] rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  ((profile.experience || 0) /
                    getNextLevelXP(profile.level || "E")) *
                    100
                )}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="horizontal"
              data={[
                {
                  level: "E",
                  xp: Math.min(50, profile.experience || 0),
                  required: 50,
                },
                {
                  level: "D",
                  xp: Math.max(
                    0,
                    Math.min(100, (profile.experience || 0) - 50)
                  ),
                  required: 50,
                },
                {
                  level: "C",
                  xp: Math.max(
                    0,
                    Math.min(200, (profile.experience || 0) - 100)
                  ),
                  required: 100,
                },
                {
                  level: "B",
                  xp: Math.max(
                    0,
                    Math.min(400, (profile.experience || 0) - 200)
                  ),
                  required: 200,
                },
                {
                  level: "A",
                  xp: Math.max(
                    0,
                    Math.min(800, (profile.experience || 0) - 400)
                  ),
                  required: 400,
                },
                {
                  level: "S",
                  xp: Math.max(
                    0,
                    Math.min(1600, (profile.experience || 0) - 800)
                  ),
                  required: 800,
                },
              ]}
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis
                dataKey="level"
                type="category"
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#141414",
                  border: "1px solid #1f1f1f",
                  borderRadius: "4px",
                  color: "#ffffff",
                }}
                formatter={(value: any, name: any) => [
                  `${value} XP`,
                  name === "xp" ? "Progreso" : "Requerido",
                ]}
                labelStyle={{ color: "#ffffff" }}
              />
              <Bar
                dataKey="xp"
                fill="#3b82f6"
                name="Progreso"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="required"
                fill="#1f2937"
                name="Requerido"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">
          Comparación de Estadísticas
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={[
                {
                  stat: "Fuerza",
                  value: profile.fuerza,
                  rank: getRank(profile.fuerza),
                },
                {
                  stat: "Resistencia",
                  value: profile.resistencia,
                  rank: getRank(profile.resistencia),
                },
                {
                  stat: "Técnica",
                  value: profile.tecnica,
                  rank: getRank(profile.tecnica),
                },
                {
                  stat: "Velocidad",
                  value: profile.definicion,
                  rank: getRank(profile.definicion),
                },
                {
                  stat: "Constancia",
                  value: profile.constancia,
                  rank: getRank(profile.constancia),
                },
              ]}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="stat" />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tickFormatter={(value) => {
                  if (value >= 90) return "S";
                  if (value >= 80) return "A";
                  if (value >= 70) return "B";
                  if (value >= 60) return "C";
                  if (value >= 50) return "D";
                  return "E";
                }}
              />
              <Radar
                name="Estadísticas"
                dataKey="value"
                stroke="#ffffff"
                fill="#ffffff"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">Retos Aceptados</h2>

        {loadingChallenges ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : acceptedChallenges.length === 0 ? (
          <p className="text-gray-400 font-light text-center py-8">
            No tienes retos aceptados actualmente
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acceptedChallenges.map((userChallenge) => (
              <div
                key={userChallenge.id}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-blue-500" />
                  <h3 className="text-white font-light">
                    {userChallenge.challenge.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm font-light mb-3">
                  {userChallenge.challenge.description}
                </p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-white">
                      {userChallenge.progress} /{" "}
                      {userChallenge.challenge.target_value}
                    </span>
                  </div>
                  <div className="h-2 bg-[#141414] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (userChallenge.progress /
                            userChallenge.challenge.target_value) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">
                    {userChallenge.challenge.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>
                      {getCategoryIcon(userChallenge.challenge.category)}
                    </span>
                    {userChallenge.challenge.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-8">
        <h2 className="text-2xl font-thin text-white mb-6">
          Retos Completados
        </h2>

        {loadingChallenges ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : completedChallenges.length === 0 ? (
          <p className="text-gray-400 font-light text-center py-8">
            Aún no has completado ningún reto
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedChallenges.map((userChallenge) => (
              <div
                key={userChallenge.id}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-white font-light">
                    {userChallenge.challenge.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm font-light mb-2">
                  {userChallenge.challenge.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">
                    {userChallenge.challenge.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    <span>
                      {getCategoryIcon(userChallenge.challenge.category)}
                    </span>
                    {userChallenge.challenge.category}
                  </span>
                  <span>
                    Completado:{" "}
                    {new Date(userChallenge.completed_at).toLocaleDateString(
                      "es-ES"
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
