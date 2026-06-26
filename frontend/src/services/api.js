/**
 * api.js — Axios instance configured to talk to the BodyWise backend.
 * Automatically attaches the Supabase JWT token on every request
 * so the backend's requireAuth middleware can verify the session.
 */
import axios from "axios";
import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("❌ VITE_API_URL is missing. Check your .env file");
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Could not retrieve session — send request without token
      // (backend will return 401 for protected routes)
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.error;
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or missing — bubble up a clear message
      return Promise.reject(new Error("Session expired. Please sign in again."));
    }
    if (status === 429) {
      return Promise.reject(new Error("Too many requests. Please wait a moment and try again."));
    }
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return Promise.reject(new Error("Request timed out. The AI is taking too long — please retry."));
    }
    return Promise.reject(new Error("Network error. Please check your connection and try again."));
  },
);

export const analyzeBody      = (payload) => api.post("/api/analyze-body", payload);
export const analyzeSkin      = (payload) => api.post("/api/analyze-skin", payload);
export const predictHealth    = (payload) => api.post("/api/predict", payload);
export const analyzeFood      = (payload) => api.post("/api/food", payload);
export const analyzeLifestyle = (payload) => api.post("/api/lifestyle", payload);
export const listHabits       = ()        => api.get("/api/habits");
export const createHabit      = (payload) => api.post("/api/habits", payload);

export const getDailyFoodLog  = (date)    => api.get(`/api/food-logs?date=${date}`);
export const getFoodLogsRange = (start, end) => api.get(`/api/food-logs?start_date=${start}&end_date=${end}`);
export const addFoodLog       = (payload) => api.post("/api/food-logs", payload);
export const deleteFoodLog    = (id)      => api.delete(`/api/food-logs/${id}`);

export const getHistory       = ()        => api.get("/api/history");

export const aiChat = (payload) =>
  api.post("/api/ai/chat", payload);

// ── Goals API ────────────────────────────────────────────────────────────────
export const getActiveGoal = () => api.get("/api/goals");
export const createOrUpdateGoal = (payload) => api.post("/api/goals", payload);
export const updateGoalTargets = (payload) => api.put("/api/goals", payload);
export const resetGoal = () => api.delete("/api/goals");

// ── Weight History API ────────────────────────────────────────────────────────
export const getWeightHistory = (range = "7days") => api.get(`/api/weight?range=${range}`);
export const getCustomWeightHistory = (start, end) => api.get(`/api/weight?range=custom&start_date=${start}&end_date=${end}`);
export const addWeightLog = (payload) => api.post("/api/weight", payload);
export const deleteWeightLog = (id) => api.delete(`/api/weight/${id}`);

export default api;
