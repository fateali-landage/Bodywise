import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

const GEMINI_MODEL = "gemini-1.5-flash";

let genAI = null;
let geminiModel = null;

if (env.geminiApiKey) {
  genAI = new GoogleGenerativeAI(env.geminiApiKey);
  geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
}

export const isGeminiConfigured = () => Boolean(geminiModel);

export const getGeminiModel = () => geminiModel;

export const GEMINI_MODEL_NAME = GEMINI_MODEL;
