/**
 * env.js — Single source of truth for all environment variables.
 *
 * dotenv.config() must be called here BEFORE any other module reads
 * process.env, ensuring correct load order in ESM.
 */
import dotenv from "dotenv";

// Load .env file (no-op on Render where env vars are injected natively)
dotenv.config();

// ── Validate critical keys at startup ─────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_KEY) {
  console.warn(
    "[env] ⚠️  GEMINI_API_KEY is not set. " +
    "All AI endpoints will return fallback responses. " +
    "Set GEMINI_API_KEY in your Render environment variables and redeploy."
  );
} else {
  // Log key presence without exposing the value
  console.log(`[env] ✅ GEMINI_API_KEY loaded (starts with: ${GEMINI_KEY.slice(0, 8)}...)`);
}

export const env = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "https://bodywise-two.vercel.app",
  geminiApiKey: GEMINI_KEY,                           // ← no duplicate key
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
};
