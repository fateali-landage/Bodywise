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
    methods: ["GET", "POST", "OPTIONS"],
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
