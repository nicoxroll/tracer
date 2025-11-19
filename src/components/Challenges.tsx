import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Trophy, CheckCircle, Plus } from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  target_value: number;
  stat_type: string;
};

type UserChallenge = {
  id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at: string;
  challenge?: Challenge;
};

export default function Challenges() {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available" | "completed">(
    "all"
  );

  useEffect(() => {
    if (profile) {
      loadChallenges();
      loadUserChallenges();
    }
  }, [profile]);

  async function loadChallenges() {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("difficulty", { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    }
  }

  async function loadUserChallenges() {
    try {
      const { data, error } = await supabase
        .from("user_challenges")
        .select(
          `
          *,
          challenge:challenge_id (*)
        `
        )
        .eq("user_id", profile?.id);

      if (error) throw error;
      setUserChallenges(data || []);
    } catch (error) {
      console.error("Error loading user challenges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptChallenge(challengeId: string) {
    if (!profile) return;

    try {
      const { error } = await supabase.from("user_challenges").insert({
        user_id: profile.id,
        challenge_id: challengeId,
      });

      if (error) throw error;
      loadUserChallenges();
    } catch (error) {
      console.error("Error accepting challenge:", error);
    }
  }

  const getUserChallenge = (challengeId: string) => {
    return userChallenges.find((uc) => uc.challenge_id === challengeId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "from-green-500 to-emerald-500";
      case "intermediate":
        return "from-yellow-500 to-orange-500";
      case "advanced":
        return "from-red-500 to-pink-500";
      default:
        return "from-gray-500 to-gray-600";
    }
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

  const filteredChallenges = challenges.filter((challenge) => {
    const userChallenge = getUserChallenge(challenge.id);
    if (filter === "available") return !userChallenge;
    if (filter === "completed") return userChallenge?.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-thin text-white mb-2">Retos</h1>
          <p className="text-gray-400 font-light">
            Acepta desafíos y demuestra tu progreso
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "Todos" },
          { id: "available", label: "Disponibles" },
          { id: "completed", label: "Completados" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 whitespace-nowrap ${
              filter === tab.id
                ? "bg-white text-[#0a0a0a]"
                : "bg-[#141414] border border-[#1f1f1f] text-gray-400 hover:text-white"
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => {
            const userChallenge = getUserChallenge(challenge.id);
            const isAccepted = !!userChallenge;
            const isCompleted = userChallenge?.completed;

            return (
              <div
                key={challenge.id}
                className={`bg-[#141414] border border-[#1f1f1f] rounded-sm overflow-hidden hover:border-white transition-all duration-300 ${
                  isCompleted ? "ring-2 ring-green-500/50" : ""
                }`}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${getDifficultyColor(
                    challenge.difficulty
                  )}`}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCategoryIcon(challenge.category)}
                      </span>
                      <h3 className="text-xl font-light text-white">
                        {challenge.title}
                      </h3>
                    </div>
                    {isCompleted && (
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-gray-400 text-sm font-light mb-4">
                    {challenge.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="capitalize">{challenge.difficulty}</span>
                    <span>Objetivo: {challenge.target_value}</span>
                  </div>

                  {isAccepted ? (
                    <div className="text-center">
                      {isCompleted ? (
                        <div className="flex items-center justify-center gap-2 text-green-500">
                          <Trophy className="w-5 h-5" />
                          <span className="text-sm font-light">
                            ¡Completado!
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">
                          Progreso: {userChallenge.progress}/
                          {challenge.target_value}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => acceptChallenge(challenge.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" />
                      Aceptar Reto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
