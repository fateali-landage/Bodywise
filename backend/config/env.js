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
const SUPA_URL = process.env.SUPABASE_URL || "";
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || "";
const USDA_KEY = process.env.USDA_API_KEY || "";

if (!GEMINI_KEY) {
  console.warn(
    "[env] ⚠️  GEMINI_API_KEY is not set. " +
    "All AI endpoints will return fallback responses."
  );
}

if (!SUPA_URL || !SUPA_KEY) {
  console.warn(
    "[env] ⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. " +
    "Database operations will use local mock fallbacks."
  );
}

if (!USDA_KEY) {
  console.warn(
    "[env] ⚠️  USDA_API_KEY is not set. " +
    "Food search requests will return mock data."
  );
}

export const env = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "https://bodywise-two.vercel.app",
  geminiApiKey: GEMINI_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  supabaseUrl: SUPA_URL,
  supabaseServiceRoleKey: SUPA_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  usdaApiKey: USDA_KEY,
};
