import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

export const analyzeBody = (payload) => api.post("/api/analyze-body", payload);
export const analyzeSkin = (payload) => api.post("/api/analyze-skin", payload);
export const predictHealth = (payload) => api.post("/api/predict", payload);
export const analyzeFood = (payload) => api.post("/api/food", payload);
export const analyzeLifestyle = (payload) => api.post("/api/lifestyle", payload);
export const listHabits = (userId) => api.get(`/api/habits?userId=${userId}`);
export const createHabit = (payload) => api.post("/api/habits", payload);

export default api;
