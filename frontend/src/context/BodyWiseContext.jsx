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

const initialInputs = {
  weight: "",
  height: "",
  age: "",
  gender: "",
  diet: "",
  activity: "",
  sleep: "",
};

const initialLifestyle = {
  smoking: false,
  alcohol: false,
  sleepHours: "",
  screenTime: "",
};

const initialHabitItems = { water: true, sleep: false, protein: true };

export function BodyWiseProvider({ user, children }) {
  const [inputs, setInputs] = useState(initialInputs);
  const [lifestyle, setLifestyle] = useState(initialLifestyle);
  const [habitItems, setHabitItems] = useState(initialHabitItems);
  const [food, setFood] = useState("");
  const [result, setResult] = useState({});
  const [loading, setLoading] = useState({
    body: false,
    food: false,
    lifestyle: false,
    habit: false,
  });

  const setLoadingFor = (key, val) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const runAnalysis = useCallback(async () => {
    setLoadingFor("body", true);
    try {
      const [bodyRes, skinRes, predRes] = await Promise.all([
        analyzeBody(inputs),
        analyzeSkin({ concern: "mild dryness" }),
        predictHealth({
          weight: inputs.weight,
          activity: inputs.activity,
          sleep: inputs.sleep,
        }),
      ]);
      setResult((prev) => ({
        ...prev,
        body: bodyRes.data.data,
        skin: skinRes.data.data,
        prediction: predRes.data.data,
      }));
    } finally {
      setLoadingFor("body", false);
    }
  }, [inputs]);

  const runFood = useCallback(async () => {
    if (!food.trim()) return;
    setLoadingFor("food", true);
    try {
      const { data } = await analyzeFood({ food });
      setResult((prev) => ({ ...prev, food: data.data }));
    } finally {
      setLoadingFor("food", false);
    }
  }, [food]);

  const runLifestyle = useCallback(async () => {
    setLoadingFor("lifestyle", true);
    try {
      const { data } = await analyzeLifestyle(lifestyle);
      setResult((prev) => ({ ...prev, lifestyle: data.data }));
    } finally {
      setLoadingFor("lifestyle", false);
    }
  }, [lifestyle]);

  const saveHabit = useCallback(async () => {
    if (!user?.id) return;
    setLoadingFor("habit", true);
    try {
      await createHabit({
        user_id: user.id,
        ...habitItems,
        date: new Date().toISOString().slice(0, 10),
      });
      const { data } = await listHabits(user.id);
      setResult((prev) => ({ ...prev, habits: data.data }));
    } finally {
      setLoadingFor("habit", false);
    }
  }, [habitItems, user]);

  const refreshHabits = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await listHabits(user.id);
    setResult((prev) => ({ ...prev, habits: data.data }));
  }, [user]);

  const scores = useMemo(() => {
    const bodyScore = Math.max(40, 100 - Math.abs((result.body?.bmi || 22) - 22) * 6);
    const skinScore = result.skin?.concernLevel === "medium" ? 68 : 82;
    const lifestyleScore = result.lifestyle?.lifestyleScore || 74;
    return {
      bodyScore: Math.round(bodyScore),
      skinScore: Math.round(skinScore),
      lifestyleScore: Math.round(lifestyleScore),
    };
  }, [result]);

  const value = {
    user,
    inputs,
    setInputs,
    lifestyle,
    setLifestyle,
    habitItems,
    setHabitItems,
    food,
    setFood,
    result,
    setResult,
    loading,
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
