import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: "trainer" | "coach";
  bio: string;
  avatar_url: string;
  coach_id: string | null;
  is_public: boolean;
  fuerza: number;
  resistencia: number;
  tecnica: number;
  definicion: number;
  constancia: number;
  experience: number;
  level: string;
  created_at: string;
  updated_at: string;
};
