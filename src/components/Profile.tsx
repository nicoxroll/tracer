import { Globe, Lock, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
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

  useEffect(() => {
    if (profile) {
      setIsPublic(profile.is_public || false);
      loadCompletedChallenges();
    }
  }, [profile, loadCompletedChallenges]);

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
          Gráfico de Estadísticas
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={[
                { stat: "Fuerza", value: profile.fuerza },
                { stat: "Resistencia", value: profile.resistencia },
                { stat: "Técnica", value: profile.tecnica },
                { stat: "Definición", value: profile.definicion },
                { stat: "Constancia", value: profile.constancia },
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
