import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "https://bodywise-two.vercel.app",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  // Anon key used for JWT verification in auth middleware (public-safe)
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
};
