import { generateHealthInsights } from "../services/aiInsightsService.js";

const REQUIRED_FIELDS = ["weight", "height", "age", "activity"];

export const getAiInsights = async (req, res) => {
  const body = req.body || {};

  const missing = REQUIRED_FIELDS.filter(
    (key) => body[key] === undefined || body[key] === null || body[key] === "",
  );

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Missing required field(s): ${missing.join(", ")}`,
    });
  }

  try {
    const result = await generateHealthInsights({
      weight: body.weight,
      height: body.height,
      age: body.age,
      activity: body.activity,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      success: false,
      error: err?.message || "Failed to generate AI insights",
    });
  }
};
