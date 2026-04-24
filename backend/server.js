import cors from "cors";
import express from "express";
import apiRoutes from "./routes/apiRoutes.js";
import { env } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_, res) => res.json({ status: "ok", service: "bodywise-backend" }));
app.use("/api", apiRoutes);

app.listen(env.port, () => {
  console.log(`BodyWise backend running on port ${env.port}`);
});
