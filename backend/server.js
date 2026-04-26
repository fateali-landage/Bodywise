import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import apiRoutes from "./routes/apiRoutes.js";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "bodywise-backend" }));
app.use("/api", apiRoutes);

const frontendDist = path.resolve(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (_, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(env.port, () => {
  console.log(`BodyWise backend running on port ${env.port}`);
});
