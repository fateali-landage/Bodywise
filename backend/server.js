import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import rateLimit from "express-rate-limit";

import apiRoutes from "./routes/apiRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";
import customFoodRoutes from "./routes/customFoodRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import weightRoutes from "./routes/weightRoutes.js";
import { env } from "./config/env.js";
import helmet from "helmet";
import { sanitizeInputs } from "./middleware/sanitize.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable trust proxy for rate limiting behind reverse proxies (Render, Vercel)
app.set("trust proxy", 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Whitelist only the deployed Vercel frontend (+ localhost for dev)
const ALLOWED_ORIGINS = [
  env.frontendUrl,                          // https://bodywise-two.vercel.app
  "http://localhost:5000",
  "http://localhost:3000",
  "http://127.0.0.1:5000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ── Body parsing & Security ───────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: "5mb" }));
app.use(sanitizeInputs);

// ── Global rate limit ─────────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP (applies to all routes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,    // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,
  message: { success: false, error: "Too many requests — please try again after 15 minutes." },
});
app.use(globalLimiter);

// Tighter limit specifically on AI/compute-heavy endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "AI request limit reached — please wait before retrying." },
});
app.use("/api/analyze-body",  aiLimiter);
app.use("/api/analyze-skin",  aiLimiter);
app.use("/api/predict",       aiLimiter);
app.use("/api/food",          aiLimiter);
app.use("/api/lifestyle",     aiLimiter);
app.use("/api/ai-insights",   aiLimiter);

// ── Request logging (Development/Debug) ───────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ── Health check (public, no auth needed) ─────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "bodywise-backend", timestamp: new Date().toISOString() }),
);

// ── Database Migration route (secure, requires Service Role Key) ──────────────
import pg from "pg";
const { Client } = pg;

app.get("/api/migrate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    
    if (!token || token !== env.supabaseServiceRoleKey) {
      return res.status(401).json({ success: false, error: "Unauthorized. Service role key required." });
    }

    const host = "db.eittkokstntbpbdhgstj.supabase.co";
    const port = 5432;
    const user = "postgres";
    const database = "postgres";
    
    const passwords = [
      "F9@Fateali9886",
      "F9-Fateali9886",
      "F15@Fateali2004",
      "9886"
    ];

    let success = false;
    let log = [];

    for (const password of passwords) {
      log.push(`Attempting connection with password starting with: ${password.slice(0, 3)}...`);
      const client = new Client({
        host,
        port,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });

      try {
        await client.connect();
        log.push("PostgreSQL connected successfully! Executing migrations...");
        
        const ddl = `
          CREATE EXTENSION IF NOT EXISTS "pgcrypto";

          -- 1. Create user_goals table
          CREATE TABLE IF NOT EXISTS public.user_goals (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
              goal_type TEXT NOT NULL,
              current_weight NUMERIC NOT NULL,
              target_weight NUMERIC NOT NULL,
              target_date DATE,
              weekly_goal TEXT,
              activity_level TEXT NOT NULL,
              height NUMERIC NOT NULL,
              gender TEXT NOT NULL,
              age INTEGER NOT NULL,
              daily_calorie_goal INTEGER NOT NULL,
              protein_goal INTEGER NOT NULL,
              carbs_goal INTEGER NOT NULL,
              fat_goal INTEGER NOT NULL,
              water_goal INTEGER NOT NULL DEFAULT 8,
              status TEXT NOT NULL DEFAULT 'active',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
          CREATE INDEX IF NOT EXISTS idx_user_goals_user ON public.user_goals(user_id);

          DROP POLICY IF EXISTS "Users can manage their own user_goals" ON public.user_goals;
          CREATE POLICY "Users can manage their own user_goals" 
          ON public.user_goals FOR ALL 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);

          -- 2. Create weight_history table
          CREATE TABLE IF NOT EXISTS public.weight_history (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              weight NUMERIC NOT NULL,
              body_fat NUMERIC,
              muscle_mass NUMERIC,
              recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;
          CREATE INDEX IF NOT EXISTS idx_weight_history_user ON public.weight_history(user_id);
          CREATE INDEX IF NOT EXISTS idx_weight_history_date ON public.weight_history(recorded_at);

          DROP POLICY IF EXISTS "Users can manage their own weight_history" ON public.weight_history;
          CREATE POLICY "Users can manage their own weight_history" 
          ON public.weight_history FOR ALL 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);

          -- 3. Create custom_foods table
          CREATE TABLE IF NOT EXISTS public.custom_foods (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              food_name TEXT NOT NULL,
              serving_size TEXT NOT NULL DEFAULT '1 serving',
              calories INTEGER NOT NULL DEFAULT 0,
              protein INTEGER NOT NULL DEFAULT 0,
              carbs INTEGER NOT NULL DEFAULT 0,
              fat INTEGER NOT NULL DEFAULT 0,
              fiber INTEGER NOT NULL DEFAULT 0,
              is_favorite BOOLEAN DEFAULT false,
              notes TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
          CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON public.custom_foods(user_id);

          DROP POLICY IF EXISTS "Users can manage their own custom_foods" ON public.custom_foods;
          CREATE POLICY "Users can manage their own custom_foods" 
          ON public.custom_foods FOR ALL 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);
        `;

        await client.query(ddl);
        log.push("DDL migration completed successfully!");
        await client.end();
        success = true;
        break;
      } catch (connErr) {
        log.push(`Failed with password starting with ${password.slice(0, 3)}: ${connErr.message}`);
      }
    }

    if (success) {
      return res.json({ success: true, message: "Migrations run successfully", log });
    } else {
      return res.status(500).json({ success: false, error: "Failed to connect or migrate database", log });
    }
  } catch (err) {
    console.error("[migrate]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/custom-foods", customFoodRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/weight", weightRoutes);
app.use("/api", apiRoutes);

// Catch-all for undefined API routes to ensure JSON instead of HTML
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.url}`,
  });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use(errorHandler);

// ── Static frontend (optional — only when dist/ exists, e.g. on Render) ───────
const frontendDist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (req, res, next) => {
    const ext = path.extname(req.path);
    if (ext || req.path.startsWith("/assets/") || req.path.startsWith("/icons/")) {
      res.status(404).send("Not Found");
      return;
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`BodyWise backend running on port ${env.port}`);
  console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
