import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import rateLimit from "express-rate-limit";

import apiRoutes from "./routes/apiRoutes.js";
import { env } from "./config/env.js";

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

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));

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

// ── Health check (public, no auth needed) ─────────────────────────────────────
app.get("/health", (_, res) =>
  res.json({ status: "ok", service: "bodywise-backend", timestamp: new Date().toISOString() }),
);

// ── API routes ─────────────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ── Global error handler ───────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // CORS errors surface here
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ success: false, error: err.message });
  }
  console.error("[Server Error]", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Static frontend (optional — only when dist/ exists, e.g. on Render) ───────
const frontendDist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (_, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`BodyWise backend running on port ${env.port}`);
  console.log(`CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
});
