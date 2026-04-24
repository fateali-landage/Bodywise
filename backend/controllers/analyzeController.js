import { generateInsight } from "../services/aiService.js";
import { bmiStatus, calculateBmi } from "../services/healthService.js";

export const analyzeBody = async (req, res) => {
  const { weight, height, age, gender, diet, activity, sleep } = req.body;
  const bmi = calculateBmi({ weight, height });
  const insight = await generateInsight(
    { weight, height, age, gender, diet, activity, sleep, bmi },
    "You are BodyWise AI. Give practical body-health insights in 2-3 short sentences.",
  );

  res.json({
    success: true,
    data: {
      bmi,
      status: bmiStatus(bmi),
      insight,
      recommendations: [
        "Keep hydration at 2.5-3L/day.",
        "Maintain at least 7 hours of sleep.",
        "Include protein in every meal.",
      ],
    },
  });
};

export const analyzeSkin = async (req, res) => {
  const { concern = "general skin stress" } = req.body;
  const simulated = ["acne", "dryness", "dark circles"];
  const concernLevel = concern.toLowerCase().includes("dry") ? "medium" : "low";
  const insight = await generateInsight(
    { concern, simulated },
    "You are a skincare AI assistant. Give concise, non-medical wellness suggestions.",
  );

  res.json({
    success: true,
    data: {
      detected: simulated,
      concernLevel,
      insight,
      suggestions: [
        "Use gentle cleanser and non-comedogenic moisturizer.",
        "Apply SPF 30+ every morning.",
        "Prioritize 7-8 hours sleep for skin recovery.",
      ],
    },
  });
};

export const predictHealth = async (req, res) => {
  const { weight, activity, sleep } = req.body;
  const delta = Number(activity) >= 4 && Number(sleep) >= 7 ? "-1.2 kg/month" : "+0.8 kg/month";
  const skinRisk = Number(sleep) < 6 ? "Moderate-High" : "Low-Moderate";
  const insight = await generateInsight(
    { weight, activity, sleep, delta, skinRisk },
    "You are a preventive health AI. Give realistic future trend explanation in short text.",
  );

  res.json({
    success: true,
    data: {
      weightTrend: delta,
      skinConditionRisk: skinRisk,
      insight,
    },
  });
};

export const analyzeFood = async (req, res) => {
  const { food = "mixed meal" } = req.body;
  const calories = food.toLowerCase().includes("salad")
    ? 220
    : food.toLowerCase().includes("rice")
      ? 420
      : 310;
  const insight = await generateInsight(
    { type: "food", food, calories },
    "You are a nutrition AI. Give one concise insight and one practical tip.",
  );

  res.json({
    success: true,
    data: {
      food,
      estimatedCalories: calories,
      macros: { protein: "18g", carbs: "42g", fats: "9g" },
      insight,
    },
  });
};

export const analyzeLifestyle = async (req, res) => {
  const { smoking, alcohol, sleepHours, screenTime } = req.body;
  const riskScore =
    (smoking ? 30 : 0) + (alcohol ? 20 : 0) + (Number(sleepHours) < 6 ? 20 : 0) + (Number(screenTime) > 8 ? 15 : 0);
  const score = Math.max(100 - riskScore, 35);
  const insight = await generateInsight(
    { smoking, alcohol, sleepHours, screenTime, score },
    "You are a lifestyle scientist. Explain behavior impact in clear, evidence-based short points.",
  );

  res.json({
    success: true,
    data: {
      lifestyleScore: score,
      explanations: [
        "Consistent sleep supports hormone balance and skin repair.",
        "Smoking can reduce collagen and increase inflammation.",
        "High screen exposure may worsen eye strain and sleep quality.",
      ],
      insight,
    },
  });
};
