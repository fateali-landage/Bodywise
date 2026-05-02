/**
 * BodyWiseContext.jsx
 * Global application state.
 *
 * Fixes applied:
 *  - BUG-005: All async actions now have try/catch + expose error state
 *  - BUG-008: Analysis results persisted to localStorage, rehydrated on mount
 *  - BUG-010: refreshHabits depends on user?.id (stable primitive), not user object
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  analyzeBody,
  analyzeFood,
  analyzeLifestyle,
  analyzeSkin,
  createHabit,
  listHabits,
  predictHealth,
} from "../services/api";

const BodyWiseContext = createContext(null);

const STORAGE_KEY = "bw_result";

/** Safely parse a JSON string; returns fallback on any error. */
const safeParse = (raw, fallback = {}) => {
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Read persisted result from localStorage on first render. */
const getStoredResult = () => safeParse(localStorage.getItem(STORAGE_KEY));

const initialInputs = {
  weight: "", height: "", age: "", gender: "", diet: "", activity: "", sleep: "",
};

const initialLifestyle = {
  smoking: false, alcohol: false, sleepHours: "", screenTime: "",
};

const initialHabitItems = { water: true, sleep: false, protein: true };

export function BodyWiseProvider({ user, children }) {
  const [inputs,     setInputs]     = useState(initialInputs);
  const [lifestyle,  setLifestyle]  = useState(initialLifestyle);
  const [habitItems, setHabitItems] = useState(initialHabitItems);
  const [food,       setFood]       = useState("");
  const [error,      setError]      = useState(null);   // ← new global error state

  // BUG-008 FIX: rehydrate from localStorage
  const [result, setResultRaw] = useState(getStoredResult);

  const [loading, setLoading] = useState({
    body: false, food: false, lifestyle: false, habit: false,
  });

  /** Persist result to localStorage every time it changes. */
  const setResult = useCallback((updater) => {
    setResultRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota exceeded */ }
      return next;
    });
  }, []);

  const setLoadingFor = (key, val) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  // ── Run body + skin + prediction ─────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setLoadingFor("body", true);
    setError(null);
    try {
      const [bodyRes, skinRes, predRes] = await Promise.all([
        analyzeBody(inputs),
        analyzeSkin({ concern: "mild dryness" }),
        predictHealth({ weight: inputs.weight, activity: inputs.activity, sleep: inputs.sleep }),
      ]);
      setResult((prev) => ({
        ...prev,
        body:       bodyRes.data.data,
        skin:       skinRes.data.data,
        prediction: predRes.data.data,
      }));
    } catch (err) {
      // BUG-005 FIX: surface the error to the UI
      setError(err?.message || "Body analysis failed. Please try again.");
    } finally {
      setLoadingFor("body", false);
    }
  }, [inputs, setResult]);

  // ── Run food analysis ────────────────────────────────────────────────────
  const runFood = useCallback(async () => {
    if (!food.trim()) return;
    setLoadingFor("food", true);
    setError(null);
    try {
      const { data } = await analyzeFood({ food });
      setResult((prev) => ({ ...prev, food: data.data }));
    } catch (err) {
      setError(err?.message || "Food analysis failed. Please try again.");
    } finally {
      setLoadingFor("food", false);
    }
  }, [food, setResult]);

  // ── Run lifestyle analysis ───────────────────────────────────────────────
  const runLifestyle = useCallback(async (payload = null) => {
    setLoadingFor("lifestyle", true);
    setError(null);
    try {
      const dataToSend = payload ? { ...lifestyle, ...payload } : lifestyle;
      const { data } = await analyzeLifestyle(dataToSend);
      setResult((prev) => ({ ...prev, lifestyle: data.data }));
    } catch (err) {
      setError(err?.message || "Lifestyle analysis failed. Please try again.");
    } finally {
      setLoadingFor("lifestyle", false);
    }
  }, [lifestyle, setResult]);

  // ── Save daily habits ────────────────────────────────────────────────────
  const saveHabit = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFor("habit", true);
    setError(null);
    try {
      await createHabit({
        user_id: user.id,
        ...habitItems,
        date: new Date().toISOString().slice(0, 10),
      });
      const { data } = await listHabits(user.id);
      setResult((prev) => ({ ...prev, habits: data.data }));
    } catch (err) {
      setError(err?.message || "Failed to save habit. Please try again.");
    } finally {
      setLoadingFor("habit", false);
    }
  }, [habitItems, user, setResult]);

  // BUG-010 FIX: depend on user?.id (stable string), not the user object
  const refreshHabits = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await listHabits(user.id);
      setResult((prev) => ({ ...prev, habits: data.data }));
    } catch {
      // Silently ignore — habits refreshing on mount is non-critical
    }
  }, [user?.id, setResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const scores = useMemo(() => {
    const bodyScore      = Math.max(40, 100 - Math.abs((result.body?.bmi || 22) - 22) * 6);
    const skinScore      = result.skin?.concernLevel === "medium" ? 68 : 82;
    const lifestyleScore = result.lifestyle?.lifestyleScore || 74;
    return {
      bodyScore:      Math.round(bodyScore),
      skinScore:      Math.round(skinScore),
      lifestyleScore: Math.round(lifestyleScore),
    };
  }, [result]);

  const value = {
    user,
    inputs,     setInputs,
    lifestyle,  setLifestyle,
    habitItems, setHabitItems,
    food,       setFood,
    result,     setResult,
    loading,
    error,      setError,   // ← expose error state to pages
    scores,
    runAnalysis,
    runFood,
    runLifestyle,
    saveHabit,
    refreshHabits,
  };

  return <BodyWiseContext.Provider value={value}>{children}</BodyWiseContext.Provider>;
}

export const useBodyWise = () => {
  const ctx = useContext(BodyWiseContext);
  if (!ctx) throw new Error("useBodyWise must be used within a BodyWiseProvider");
  return ctx;
};
