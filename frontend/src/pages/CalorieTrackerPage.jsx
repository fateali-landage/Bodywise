import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getDailyFoodLog, addFoodLog, deleteFoodLog } from "../services/api";
import {
  searchFood,
  getCustomFoods,
  createCustomFood,
  updateCustomFood,
  deleteCustomFood
} from "../services/nutritionApi";
import { PageHeader, SectionTitle, FieldLabel, ActionButton, Spinner, ListSkeleton } from "../components/ui";
import RadioGroup from "../components/ui/RadioGroup";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const DAILY_TARGET = 2400;

function CalorieRing({ consumed, target }) {
  const pct = Math.min((consumed / target) * 100, 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct > 95 ? "var(--red)" : pct > 75 ? "var(--amber)" : "var(--cyan)";

  return (
    <div className="relative w-[140px] h-[140px] flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}50)`, transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="text-center relative z-10">
        <div className="font-syne font-extrabold text-2xl leading-none" style={{ color }}>
          {parseFloat(consumed).toFixed(1)}
        </div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1 tracking-wider uppercase font-mono">of {target} kcal</div>
      </div>
    </div>
  );
}

const getGramsFromServingSize = (servingSizeStr) => {
  if (!servingSizeStr) return 100;
  const cleanStr = servingSizeStr.toLowerCase().trim();
  
  const parenMatch = cleanStr.match(/\((\d+(?:\.\d+)?)\s*(g|ml|grams|mliter)\)/);
  if (parenMatch) {
    return parseFloat(parenMatch[1]);
  }
  
  const directMatch = cleanStr.match(/^(\d+(?:\.\d+)?)\s*(g|ml|grams|mliter)/);
  if (directMatch) {
    return parseFloat(directMatch[1]);
  }
  
  const numberMatch = cleanStr.match(/^(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const val = parseFloat(numberMatch[1]);
    return val > 0 ? val : 100;
  }
  
  return 100;
};

const calculateNutritionForLog = (foodItem, quantity, unit) => {
  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const isCustom = !!foodItem.isCustom;
  const baseCal = parseFloat(foodItem.calories) || 0;
  const baseProt = parseFloat(foodItem.protein) || 0;
  const baseCarbs = parseFloat(foodItem.carbs) || 0;
  const baseFat = parseFloat(foodItem.fat) || parseFloat(foodItem.fats) || 0;
  const baseFiber = parseFloat(foodItem.fiber) || 0;

  let servingWeightInGrams = 100;
  if (foodItem.servingSize) {
    servingWeightInGrams = getGramsFromServingSize(foodItem.servingSize);
  }

  let calculatedCal = 0;
  let calculatedProt = 0;
  let calculatedCarbs = 0;
  let calculatedFat = 0;
  let calculatedFiber = 0;

  const cleanUnit = (unit || "serving").toLowerCase();

  if (isCustom) {
    if (cleanUnit === "g" || cleanUnit === "ml") {
      const factor = qty / (servingWeightInGrams || 100);
      calculatedCal = baseCal * factor;
      calculatedProt = baseProt * factor;
      calculatedCarbs = baseCarbs * factor;
      calculatedFat = baseFat * factor;
      calculatedFiber = baseFiber * factor;
    } else {
      calculatedCal = baseCal * qty;
      calculatedProt = baseProt * qty;
      calculatedCarbs = baseCarbs * qty;
      calculatedFat = baseFat * qty;
      calculatedFiber = baseFiber * qty;
    }
  } else {
    let grams = qty;
    if (cleanUnit === "kg") {
      grams = qty * 1000;
    } else if (cleanUnit === "serving" || cleanUnit === "piece" || cleanUnit === "cup" || cleanUnit === "tbsp") {
      grams = qty * servingWeightInGrams;
    }

    const factor = grams / 100;
    calculatedCal = baseCal * factor;
    calculatedProt = baseProt * factor;
    calculatedCarbs = baseCarbs * factor;
    calculatedFat = baseFat * factor;
    calculatedFiber = baseFiber * factor;
  }

  const roundToOneDecimal = (val) => Math.round(val * 10) / 10;

  const result = {
    calories: roundToOneDecimal(calculatedCal),
    protein: roundToOneDecimal(calculatedProt),
    carbs: roundToOneDecimal(calculatedCarbs),
    fat: roundToOneDecimal(calculatedFat),
    fiber: roundToOneDecimal(calculatedFiber)
  };

  // Developer tracing logs
  console.log(`[Nutrition Calculation Tracing]`, {
    foodName: foodItem.name || foodItem.food_name,
    isCustom,
    qty,
    unit,
    servingSizeStr: foodItem.servingSize || foodItem.serving_size,
    servingWeightInGrams,
    baseNutrients: { calories: baseCal, protein: baseProt, carbs: baseCarbs, fat: baseFat, fiber: baseFiber },
    calculated: result
  });

  return result;
};


const MEAL_OPTS = [
  { value: "breakfast", label: "Breakfast", icon: "🍳" },
  { value: "lunch",     label: "Lunch",     icon: "🥗" },
  { value: "dinner",    label: "Dinner",    icon: "🍲" },
  { value: "snack",     label: "Snack",     icon: "🍎" },
];

export default function CalorieTrackerPage() {
  const { user } = useAuth();
  
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [food, setFood] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [mealType, setMealType] = useState("lunch");

  // Tab State
  const [activeTab, setActiveTab] = useState("search");

  // Search details
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [localSearchResults, setLocalSearchResults] = useState([]);
  const [selectedFoodPreview, setSelectedFoodPreview] = useState(null);

  // Custom Foods Library
  const [customFoods, setCustomFoods] = useState([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Recently Used
  const [recentlyUsed, setRecentlyUsed] = useState([]);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formFoodName, setFormFoodName] = useState("");
  const [formServingSize, setFormServingSize] = useState("");
  const [formCalories, setFormCalories] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formCarbs, setFormCarbs] = useState("");
  const [formFat, setFormFat] = useState("");
  const [formFiber, setFormFiber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsFavorite, setFormIsFavorite] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create', 'edit', 'duplicate'
  const [editFoodId, setEditFoodId] = useState("");
  const [formError, setFormError] = useState("");

  // Delete Confirm Dialog
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  const UNITS = ["g", "ml", "piece", "serving", "cup", "tbsp"];
  const todayStr = new Date().toISOString().slice(0, 10);

  // Load Recents from LocalStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("bodywise_recent_foods");
      if (cached) {
        setRecentlyUsed(JSON.parse(cached));
      }
    } catch (e) {
      console.warn("Could not load recent foods from localStorage", e);
    }
  }, []);

  // Fetch Library
  const fetchLibrary = async (searchVal = "") => {
    if (!user?.id) return;
    try {
      setLoadingLibrary(true);
      const res = await getCustomFoods(searchVal);
      if (res?.success && res?.data) {
        setCustomFoods(res.data);
        localStorage.setItem("bodywise_custom_foods", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Failed to fetch custom foods library:", err);
      const cached = localStorage.getItem("bodywise_custom_foods");
      if (cached) {
        setCustomFoods(JSON.parse(cached));
      }
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    fetchLibrary(librarySearch);
  }, [user?.id, librarySearch]);

  // Debounced search for USDA + Local Custom Foods
  useEffect(() => {
    const trimmed = food.trim();
    if (!trimmed) {
      setSearchResult(null);
      setSearchError("");
      setLocalSearchResults([]);
      return;
    }

    if (trimmed.length > 100) {
      setSearchError("Search query is too long (max 100 chars).");
      setSearchResult(null);
      setLocalSearchResults([]);
      return;
    }

    setSearchError("");
    setSearching(true);

    // Search locally/custom foods first
    const searchLower = trimmed.toLowerCase();
    const matchedCustom = customFoods.filter(cf => cf.food_name.toLowerCase().includes(searchLower));
    setLocalSearchResults(matchedCustom);

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await searchFood(trimmed);
        if (res?.success && res?.food) {
          setSearchResult(res.food);
        } else {
          setSearchResult(null);
        }
      } catch (err) {
        console.error("USDA search error:", err);
        setSearchResult(null);
        if (matchedCustom.length === 0) {
          if (err.message && err.message.includes("404")) {
            setSearchError("No USDA verified foods found. Fallback estimation will be used.");
          } else {
            setSearchError("USDA search failed. Fallback estimation will be used.");
          }
        }
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [food, customFoods]);

  // Fetch daily log
  useEffect(() => {
    let isMounted = true;
    const fetchLog = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const { data } = await getDailyFoodLog(todayStr);
        if (isMounted) setLog(data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLog();
    return () => { isMounted = false; };
  }, [user?.id, todayStr]);

  // Totals calculation
  const consumed = log.reduce((sum, item) => sum + (item.calories || 0), 0);
  const remaining = Math.max(DAILY_TARGET - consumed, 0);
  const over = consumed > DAILY_TARGET ? consumed - DAILY_TARGET : 0;
  
  const protein = log.reduce((sum, item) => sum + (item.protein || 0), 0);
  const carbs = log.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const fats = log.reduce((sum, item) => sum + (item.fats || 0), 0);

  const previewNutrition = useMemo(() => {
    if (!selectedFoodPreview) return null;
    return calculateNutritionForLog(selectedFoodPreview, qty, unit);
  }, [selectedFoodPreview, qty, unit]);

  const addToRecent = (item) => {
    const recentItem = {
      food_name: item.food_name || item.name,
      serving_size: item.serving_size || item.servingSize || "1 serving",
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fats: item.fat || item.fats || 0,
    };

    setRecentlyUsed(prev => {
      const filtered = prev.filter(r => r.food_name.toLowerCase() !== recentItem.food_name.toLowerCase());
      const updated = [recentItem, ...filtered].slice(0, 10);
      localStorage.setItem("bodywise_recent_foods", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAdd = async () => {
    if (submitting) return;
    let fName = food.trim();
    let finalQty = parseFloat(qty);
    let finalUnit = unit;

    // Smart parsing helper (e.g. "2 eggs", "150 g chicken breast")
    const match = fName.match(/^(\d+(?:\.\d+)?)\s*(g|ml|piece|pieces|serving|servings|cup|cups|tbsp)?\s+(.+)$/i);
    if (match) {
      finalQty = parseFloat(match[1]);
      const rawUnit = (match[2] || "").toLowerCase();
      if (rawUnit.startsWith("piece") || rawUnit === "") finalUnit = "piece";
      else if (rawUnit.startsWith("serving")) finalUnit = "serving";
      else if (rawUnit.startsWith("cup")) finalUnit = "cup";
      else if (rawUnit === "g" || rawUnit === "ml" || rawUnit === "tbsp") finalUnit = rawUnit;
      fName = match[3];
    }

    if (!fName) { setError("Please enter a food description."); return; }
    if (isNaN(finalQty) || finalQty <= 0) { setError("Enter a valid quantity greater than zero."); return; }
    
    setError("");
    setSubmitting(true);
    try {
      let finalCalories, finalProtein, finalCarbs, finalFats;
      if (selectedFoodPreview) {
        const nut = calculateNutritionForLog(selectedFoodPreview, finalQty, finalUnit);
        finalCalories = Math.round(nut.calories);
        finalProtein = Math.round(nut.protein);
        finalCarbs = Math.round(nut.carbs);
        finalFats = Math.round(nut.fat);
      }

      const payload = {
        food_name: selectedFoodPreview ? selectedFoodPreview.name : fName,
        quantity: finalQty,
        unit: finalUnit,
        meal_type: mealType,
        date: todayStr,
        ...(selectedFoodPreview ? {
          calories: finalCalories,
          protein: finalProtein,
          carbs: finalCarbs,
          fats: finalFats,
        } : {})
      };
      const { data } = await addFoodLog(payload);
      if (data?.data) {
        setLog(prev => [data.data, ...prev]);
        setFood("");
        setQty("1");
        addToRecent(selectedFoodPreview || { name: fName, calories: 100 });
        setSelectedFoodPreview(null);
        setSearchResult(null);
      }
    } catch (err) {
      setError("Failed to add food. " + (err.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const selectFoodItem = (item, isCustom) => {
    if (isCustom) {
      setSelectedFoodPreview({
        name: item.food_name,
        brand: "Custom Food",
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat || item.fats || 0,
        fiber: item.fiber || 0,
        servingSize: item.serving_size,
        isCustom: true,
        customId: item.id
      });
      setFood(item.food_name);
    } else {
      setSelectedFoodPreview(item);
      setFood(item.name);
      if (item.servingSize) {
        const lowerUnit = item.servingSize.toLowerCase();
        if (lowerUnit.includes(" g") || lowerUnit.endsWith("g")) {
          setUnit("g");
        } else if (lowerUnit.includes(" ml") || lowerUnit.endsWith("ml")) {
          setUnit("ml");
        } else {
          setUnit("serving");
        }
      }
    }
  };

  const handleLogCustomFoodDirect = async (item) => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        food_name: item.food_name || item.name,
        quantity: 1,
        unit: item.serving_size || item.servingSize || "serving",
        meal_type: mealType,
        date: todayStr,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fats: item.fat || item.fats || 0,
      };
      const { data } = await addFoodLog(payload);
      if (data?.data) {
        setLog(prev => [data.data, ...prev]);
        addToRecent(item);
        setActiveTab("search");
      }
    } catch (err) {
      setError("Failed to log food directly. " + (err.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLog(prev => prev.filter(e => e.id !== id));
      await deleteFoodLog(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Form helper methods
  const openCreateForm = () => {
    setFormFoodName("");
    setFormServingSize("1 serving");
    setFormCalories("");
    setFormProtein("");
    setFormCarbs("");
    setFormFat("");
    setFormFiber("");
    setFormNotes("");
    setFormIsFavorite(false);
    setFormMode("create");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (foodItem) => {
    setFormFoodName(foodItem.food_name);
    setFormServingSize(foodItem.serving_size);
    setFormCalories(String(foodItem.calories));
    setFormProtein(String(foodItem.protein));
    setFormCarbs(String(foodItem.carbs));
    setFormFat(String(foodItem.fat));
    setFormFiber(String(foodItem.fiber || 0));
    setFormNotes(foodItem.notes || "");
    setFormIsFavorite(foodItem.is_favorite);
    setFormMode("edit");
    setEditFoodId(foodItem.id);
    setFormError("");
    setIsFormOpen(true);
  };

  const openDuplicateForm = (foodItem) => {
    setFormFoodName(foodItem.food_name + " (Copy)");
    setFormServingSize(foodItem.serving_size);
    setFormCalories(String(foodItem.calories));
    setFormProtein(String(foodItem.protein));
    setFormCarbs(String(foodItem.carbs));
    setFormFat(String(foodItem.fat));
    setFormFiber(String(foodItem.fiber || 0));
    setFormNotes(foodItem.notes || "");
    setFormIsFavorite(false);
    setFormMode("duplicate");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleImportUSDA = (usdaFood) => {
    setFormFoodName(usdaFood.name);
    setFormServingSize(usdaFood.servingSize || "100 g");
    setFormCalories(String(usdaFood.calories));
    setFormProtein(String(usdaFood.protein));
    setFormCarbs(String(usdaFood.carbs));
    setFormFat(String(usdaFood.fat));
    setFormFiber(String(usdaFood.fiber || 0));
    setFormNotes(`Imported from USDA database (FDC ID: ${usdaFood.fdcId})`);
    setFormIsFavorite(false);
    setFormMode("create");
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSaveCustomFood = async () => {
    const nameClean = formFoodName.trim();
    if (!nameClean) {
      setFormError("Food name is required.");
      return;
    }
    if (nameClean.length > 100) {
      setFormError("Food name cannot exceed 100 characters.");
      return;
    }

    const cals = parseInt(formCalories, 10);
    const prot = parseInt(formProtein, 10) || 0;
    const carbObj = parseInt(formCarbs, 10) || 0;
    const fatObj = parseInt(formFat, 10) || 0;
    const fibObj = parseInt(formFiber, 10) || 0;

    if (isNaN(cals) || cals < 0) {
      setFormError("Calories must be a number greater than or equal to 0.");
      return;
    }
    if (prot < 0 || carbObj < 0 || fatObj < 0 || fibObj < 0) {
      setFormError("Macros must be greater than or equal to 0.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    const payload = {
      food_name: nameClean,
      serving_size: formServingSize.trim() || "1 serving",
      calories: cals,
      protein: prot,
      carbs: carbObj,
      fat: fatObj,
      fiber: fibObj,
      is_favorite: formIsFavorite,
      notes: formNotes.trim() || null
    };

    try {
      if (formMode === "edit") {
        await updateCustomFood(editFoodId, payload);
      } else {
        await createCustomFood(payload);
      }
      setIsFormOpen(false);
      fetchLibrary(librarySearch);
      setError("");
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Failed to save custom food.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomFood = async () => {
    if (!deleteConfirmItem) return;
    try {
      await deleteCustomFood(deleteConfirmItem.id);
      setDeleteConfirmItem(null);
      fetchLibrary(librarySearch);
    } catch (err) {
      console.error("Failed to delete custom food:", err);
      setError("Failed to delete custom food: " + err.message);
      setDeleteConfirmItem(null);
    }
  };

  const handleToggleFavorite = async (foodItem) => {
    try {
      setCustomFoods(prev => prev.map(f => f.id === foodItem.id ? { ...f, is_favorite: !f.is_favorite } : f));
      await updateCustomFood(foodItem.id, { is_favorite: !foodItem.is_favorite });
      fetchLibrary(librarySearch);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const getFeedbackMessage = () => {
    if (consumed === 0) return { msg: "Let's log your first meal to sync metrics!", color: "var(--cyan)" };
    if (over > 0) return { msg: `You exceeded daily target by ${over} kcal today.`, color: "var(--red)" };
    if (remaining < 300) return { msg: "You have reached 90% of your energy target.", color: "var(--amber)" };
    if (consumed < DAILY_TARGET * 0.4 && new Date().getHours() > 14) return { msg: "Caloric intake is low for mid-afternoon. Replenish nutrients.", color: "var(--violet)" };
    return { msg: "Caloric balance is optimal. High macro consistency today!", color: "var(--emerald)" };
  };
  const feedback = getFeedbackMessage();

  const groupedLogs = MEAL_OPTS.reduce((acc, opt) => {
    acc[opt.value] = log.filter(l => l.meal_type === opt.value);
    return acc;
  }, {});

  const weeklyData = Array.from({length: 6}).map((_, i) => ({
    day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString("en-US", { weekday: 'short' }),
    kcal: 1900 + Math.round(Math.random() * 600)
  })).concat([{ day: "Today", kcal: consumed }]);

  const CustomChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[12px] shadow-lg">
        <div className="font-syne font-bold mb-1.5 text-[var(--text-primary)]">{label}</div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-[var(--cyan)]" />
          <span>Intake: <strong className="text-[var(--cyan)] font-mono">{payload[0].value} kcal</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <PageHeader
        eyebrow="Energy Management"
        title="Calorie Tracker"
        description="Monitor daily calorie intake, balance metabolic ratios, and review weekly trends."
      />

      {/* Smart Feedback Banner */}
      <div 
        className="fade-up d1 glass py-4 px-5 rounded-xl flex items-center gap-3 border-l-4 hover:border-y-[var(--border)]" 
        style={{ borderLeftColor: feedback.color }}
      >
        <span className="text-xl">💡</span>
        <div className="text-[14px] text-[var(--text-primary)] font-medium">{feedback.msg}</div>
        {protein < 55 && consumed > 500 && (
          <span className="badge badge-amber ml-auto text-[9px]">Low Protein</span>
        )}
      </div>

      {/* Metric Summaries */}
      <div className="fade-up d2 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: "Target Intake",    value: DAILY_TARGET, color: "var(--cyan)",    icon: "🎯" },
          { label: "Logged Consumed",  value: consumed,      color: "var(--violet)",  icon: "🍽️" },
          { label: "Energy Remaining", value: remaining,     color: over ? "var(--red)" : "var(--emerald)", icon: over ? "⚠️" : "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
            <div className="flex justify-between items-start mb-3">
              <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">{label}</div>
              <div className="text-lg">{icon}</div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <div className="font-syne font-extrabold text-3xl leading-none" style={{ color }}>{typeof value === "number" && label !== "Target Intake" ? value.toFixed(1) : value.toLocaleString()}</div>
              <div className="text-xs text-[var(--text-muted)] font-mono font-semibold">kcal</div>
            </div>
          </div>
        ))}
      </div>

      <div className="fade-up d3 grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Progress & Macros */}
        <div className="glass p-5 sm:p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start h-full hover:border-[var(--border-hover)] justify-between">
          <CalorieRing consumed={consumed} target={DAILY_TARGET} />
          <div className="flex flex-col gap-4 w-full">
            <div className="font-syne font-bold text-[14.5px] text-[var(--text-primary)]">Macronutrient Split</div>
            {[
              { label: "Protein Goal", val: protein, color: "#00e5be", max: 150 },
              { label: "Carbohydrates", val: carbs,   color: "#a78bfa", max: 250 },
              { label: "Fats",          val: fats,    color: "#fbbf24", max: 80 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[var(--text-secondary)]">{m.label}</span>
                  <span className="font-mono font-bold" style={{ color: m.color }}>{parseFloat(m.val).toFixed(1)}g / {m.max}g</span>
                </div>
                <div className="progress-bar-track h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="progress-bar-fill h-full rounded-full" style={{ width: `${Math.min((m.val / m.max) * 100, 100)}%`, background: m.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Food Card with Tabs */}
        <div className="glass p-5 sm:p-6 h-full hover:border-[var(--border-hover)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🍳</span>
              <span className="font-syne font-bold text-[14.5px] text-[var(--text-primary)]">Nutrition Center</span>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5 text-xs">
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 py-1 rounded-md transition-all font-medium ${activeTab === "search" ? "bg-[var(--cyan)] text-[#030712] font-bold shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
              >
                Log Meal
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`px-3 py-1 rounded-md transition-all font-medium ${activeTab === "library" ? "bg-[var(--cyan)] text-[#030712] font-bold shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
              >
                My Foods
              </button>
              <button
                onClick={() => setActiveTab("recent")}
                className={`px-3 py-1 rounded-md transition-all font-medium ${activeTab === "recent" ? "bg-[var(--cyan)] text-[#030712] font-bold shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
              >
                Recent
              </button>
            </div>
          </div>

          {error && <div className="p-3 mb-2 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">⚠️ {error}</div>}

          {/* TAB 1: Search & Log */}
          {activeTab === "search" && (
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel>Meal Classification</FieldLabel>
                <div className="mt-2">
                  <RadioGroup options={MEAL_OPTS} value={mealType} onChange={setMealType} color="cyan" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_100px] gap-3">
                <div>
                  <FieldLabel>Food Description</FieldLabel>
                  <input className="field-input w-full h-11" value={food} onChange={(e) => setFood(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="e.g. 2 fried eggs, 1 cup of oats" />
                </div>
                <div>
                  <FieldLabel>Quantity</FieldLabel>
                  <input className="field-input w-full h-11" value={qty} type="number" min="0.1" step="0.5" onChange={(e) => setQty(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
                </div>
                <div>
                  <FieldLabel>Unit</FieldLabel>
                  <select className="field-input w-full h-11 cursor-pointer" value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Match overlay */}
              {food.trim() && (searching || localSearchResults.length > 0 || searchResult) && (
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-white/[0.01] flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono font-bold">Matches (Select to Preview)</div>
                  {searching && <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 py-1"><Spinner /> Searching databases...</div>}
                  
                  {/* Custom Matches */}
                  {localSearchResults.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[9px] uppercase tracking-wider font-mono font-extrabold text-[var(--violet)]">My Foods ({localSearchResults.length})</div>
                      {localSearchResults.slice(0, 4).map(cf => (
                        <button
                          key={cf.id}
                          onClick={() => selectFoodItem(cf, true)}
                          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-hover)] transition-all flex justify-between items-center"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[var(--text-primary)] capitalize">{cf.food_name}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Serving: {cf.serving_size}</div>
                          </div>
                          <div className="text-[10px] font-mono font-bold text-[var(--violet)] bg-[var(--violet-dim)] px-1.5 py-0.5 rounded border border-[var(--border-accent-violet)]">
                            {cf.calories} kcal
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* USDA Matches */}
                  {searchResult && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[9px] uppercase tracking-wider font-mono font-extrabold text-[var(--cyan)]">USDA Database</div>
                      <button
                        onClick={() => selectFoodItem(searchResult, false)}
                        className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-hover)] transition-all flex justify-between items-center"
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-primary)] capitalize">{searchResult.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{searchResult.brand} · Serving: {searchResult.servingSize}</div>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-[var(--cyan)] bg-[var(--cyan-dim)] px-1.5 py-0.5 rounded border border-[var(--border-accent)]">
                          {searchResult.calories} kcal
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Loader Card */}
              {searching && !selectedFoodPreview && (
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] flex flex-col gap-3 animate-pulse">
                  <div className="flex flex-col gap-2">
                    <div className="skeleton h-3 w-1/4 rounded-full" />
                    <div className="skeleton h-5 w-2/3 rounded-md" />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    <div className="skeleton h-11 rounded-lg" />
                    <div className="skeleton h-11 rounded-lg" />
                    <div className="skeleton h-11 rounded-lg" />
                    <div className="skeleton h-11 rounded-lg" />
                  </div>
                </div>
              )}

              {/* Selected Nutrition Preview Card */}
              {!searching && selectedFoodPreview && (
                <div className="p-4 rounded-xl border border-[var(--border-hover)] bg-[var(--bg-surface-2)] flex flex-col gap-3 animate-[fadeUp_0.2s_ease-out_both] hover:border-[var(--cyan)] transition-all relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {selectedFoodPreview.isCustom ? (
                        <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--violet)] font-extrabold bg-[var(--violet-dim)] px-2 py-0.5 rounded-full border border-[var(--border-accent-violet)] mb-1.5 inline-block">
                          ★ My Custom Food
                        </span>
                      ) : (
                        <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--cyan)] font-extrabold bg-[var(--cyan-dim)] px-2 py-0.5 rounded-full border border-[var(--border-accent)] mb-1.5 inline-block">
                          ✓ USDA Verified Data
                        </span>
                      )}
                      <h4 className="text-[13.5px] font-bold text-[var(--text-primary)] capitalize leading-snug">{selectedFoodPreview.name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {selectedFoodPreview.brand} · Serving: {selectedFoodPreview.servingSize}
                      </p>
                    </div>

                    {!selectedFoodPreview.isCustom && (
                      <button
                        onClick={() => handleImportUSDA(selectedFoodPreview)}
                        className="btn btn-ghost text-[10px] h-7 px-2 shrink-0 border border-white/5 hover:border-[var(--border-hover)]"
                        title="Duplicate and save to My Foods"
                      >
                        📥 Save to Library
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center mt-1">
                    <div className="bg-white/[0.03] p-2 rounded-lg border border-[var(--border)]">
                      <div className="text-xs font-mono font-bold text-[var(--cyan)]">
                        {previewNutrition ? previewNutrition.calories.toFixed(1) : "0.0"}
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[var(--text-muted)] font-semibold mt-0.5">Calories</div>
                    </div>
                    <div className="bg-white/[0.03] p-2 rounded-lg border border-[var(--border)]">
                      <div className="text-xs font-mono font-bold text-[var(--violet)]">
                        {previewNutrition ? previewNutrition.protein.toFixed(1) : "0.0"}g
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[var(--text-muted)] font-semibold mt-0.5">Protein</div>
                    </div>
                    <div className="bg-white/[0.03] p-2 rounded-lg border border-[var(--border)]">
                      <div className="text-xs font-mono font-bold text-[var(--amber)]">
                        {previewNutrition ? previewNutrition.carbs.toFixed(1) : "0.0"}g
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[var(--text-muted)] font-semibold mt-0.5">Carbs</div>
                    </div>
                    <div className="bg-white/[0.03] p-2 rounded-lg border border-[var(--border)]">
                      <div className="text-xs font-mono font-bold text-[var(--emerald)]">
                        {previewNutrition ? previewNutrition.fat.toFixed(1) : "0.0"}g
                      </div>
                      <div className="text-[9px] uppercase font-mono text-[var(--text-muted)] font-semibold mt-0.5">Fats</div>
                    </div>
                  </div>
                  
                  {previewNutrition && previewNutrition.fiber > 0 && (
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium flex items-center justify-between border-t border-[var(--border)] pt-2 px-1">
                      <span>Dietary Fiber:</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {previewNutrition.fiber.toFixed(1)}g
                      </span>
                    </div>
                  )}
                </div>
              )}

              {!searching && food.trim() && !selectedFoodPreview && localSearchResults.length === 0 && (
                <div className="p-3 rounded-xl border border-dashed border-[var(--border)] bg-white/[0.01] text-[11px] text-[var(--text-muted)] animate-[fadeUp_0.2s_ease-out_both] flex items-start gap-2">
                  <span className="text-xs">💡</span>
                  <div>
                    {searchError || "No verified USDA or My Foods matched. Fallback estimation will calculate macros upon logging."}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <ActionButton onClick={handleAdd} loading={submitting} color="cyan" className="w-full sm:w-auto h-10 text-xs px-5">
                  {submitting ? "Analyzing Nutrition..." : "+ Log Meal"}
                </ActionButton>
                <div className="text-[11px] text-[var(--text-muted)] text-center sm:text-left font-medium">Est. energy & macros sync to scores</div>
              </div>
            </div>
          )}

          {/* TAB 2: Custom Library (My Foods) */}
          {activeTab === "library" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center gap-3">
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="field-input flex-1 h-9 text-xs"
                  placeholder="Search custom foods..."
                />
                <button
                  onClick={openCreateForm}
                  className="btn btn-cyan h-9 text-xs px-3.5 font-bold flex items-center gap-1 shrink-0"
                >
                  + Add Food
                </button>
              </div>

              {loadingLibrary ? (
                <ListSkeleton />
              ) : customFoods.length === 0 ? (
                <div className="empty-state py-8">
                  <span className="text-2xl mb-1">🥗</span>
                  <span className="font-semibold text-xs text-[var(--text-primary)]">Library Empty</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Create your first custom food above.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {customFoods.map(cf => (
                    <div
                      key={cf.id}
                      className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)] transition-all flex flex-col gap-2.5 group relative"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[13px] font-bold text-[var(--text-primary)] capitalize leading-none">{cf.food_name}</h4>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">({cf.serving_size})</span>
                          {cf.is_favorite && <span className="text-[10px]" title="Favorited">⭐</span>}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleFavorite(cf)}
                            className="bg-transparent border-none text-xs cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors"
                            title={cf.is_favorite ? "Remove Favorite" : "Mark Favorite"}
                          >
                            ★
                          </button>
                          <button
                            onClick={() => openEditForm(cf)}
                            className="bg-transparent border-none text-[10px] cursor-pointer p-1 text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Edit Food"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openDuplicateForm(cf)}
                            className="bg-transparent border-none text-[10px] cursor-pointer p-1 text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Duplicate Food"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => setDeleteConfirmItem(cf)}
                            className="bg-transparent border-none text-[10px] cursor-pointer p-1 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
                            title="Delete Food"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2.5 text-[11px] font-mono text-[var(--text-muted)]">
                          <span><strong className="text-[var(--cyan)]">{cf.calories}</strong> kcal</span>
                          <span>·</span>
                          <span>P:<strong className="text-[var(--text-secondary)]">{cf.protein}g</strong></span>
                          <span>C:<strong className="text-[var(--text-secondary)]">{cf.carbs}g</strong></span>
                          <span>F:<strong className="text-[var(--text-secondary)]">{cf.fat}g</strong></span>
                          {cf.fiber > 0 && (
                            <>
                              <span>·</span>
                              <span>Fib:<strong className="text-[var(--text-secondary)]">{cf.fiber}g</strong></span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => handleLogCustomFoodDirect(cf)}
                          className="btn btn-ghost h-6 text-[10px] px-2 text-[var(--cyan)] border border-[var(--border-accent)] hover:bg-[var(--cyan-dim)] font-bold flex items-center justify-center"
                          title="Log 1 serving immediately"
                        >
                          Use
                        </button>
                      </div>
                      
                      {cf.notes && (
                        <div className="text-[9.5px] italic text-[var(--text-muted)] border-t border-white/5 pt-1.5 mt-0.5 line-clamp-1">
                          Note: {cf.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Recently Used */}
          {activeTab === "recent" && (
            <div className="flex flex-col gap-4">
              {recentlyUsed.length === 0 ? (
                <div className="empty-state py-8">
                  <span className="text-2xl mb-1">⏱️</span>
                  <span className="font-semibold text-xs text-[var(--text-primary)]">No Recents</span>
                  <span className="text-[11px] text-[var(--text-muted)]">Your last 10 logged foods will show up here.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {recentlyUsed.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between gap-3 hover:border-[var(--border-hover)] transition-all"
                    >
                      <div>
                        <h4 className="text-[12.5px] font-bold text-[var(--text-primary)] capitalize">{item.food_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                          <span>{item.calories} kcal</span>
                          <span>·</span>
                          <span>P:{item.protein}g C:{item.carbs}g F:{item.fats}g</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLogCustomFoodDirect(item)}
                        className="btn btn-ghost h-6 text-[10px] px-2 text-[var(--cyan)] border border-[var(--border-accent)] hover:bg-[var(--cyan-dim)] font-bold"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="fade-up d4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        
        {/* Visual Timeline of Logged Meals */}
        <div className="glass p-5 sm:p-6 hover:border-[var(--border-hover)]">
          <SectionTitle>Today's Log Timeline</SectionTitle>
          
          {loading ? (
            <ListSkeleton />
          ) : log.length === 0 ? (
            <div className="empty-state">
              <span className="text-3xl mb-1">🍽️</span>
              <span className="font-semibold text-sm text-[var(--text-primary)]">Timeline Empty</span>
              <span className="text-xs text-[var(--text-muted)]">No foods have been logged today.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mt-4">
              {MEAL_OPTS.map(meal => {
                const items = groupedLogs[meal.value];
                if (!items || items.length === 0) return null;
                const mealCals = items.reduce((s, i) => s + (i.calories||0), 0);
                
                return (
                  <div key={meal.value} className="relative pl-6 border-l border-[var(--border)] ml-3">
                    <div className="absolute -left-[6px] top-1.5 w-[11px] h-[11px] rounded-full bg-[var(--cyan)] border-2 border-[var(--bg-base)]" />
                    
                    <div className="flex justify-between items-center mb-3 pb-1 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                        <span>{meal.icon}</span> {meal.label}
                      </div>
                      <span className="text-[12.5px] font-mono font-bold text-[var(--cyan)]">{mealCals} kcal</span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {items.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center p-3 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-xl transition-all duration-200">
                          <div>
                            <div className="text-[13.5px] font-semibold text-[var(--text-primary)] capitalize">{entry.food_name}</div>
                            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">Qty: {entry.quantity} {entry.unit || "serving"} · {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                          
                          <div className="flex items-center gap-3.5">
                            <div className="text-right">
                              <div className="text-[13px] font-mono font-bold text-[var(--text-primary)]">{parseFloat(entry.calories).toFixed(1)} kcal</div>
                              <div className="text-[10px] font-mono font-semibold text-[var(--text-muted)] mt-0.5">P:{parseFloat(entry.protein).toFixed(1)}g C:{parseFloat(entry.carbs).toFixed(1)}g F:{parseFloat(entry.fats).toFixed(1)}g</div>
                            </div>
                            <button 
                              onClick={() => handleDelete(entry.id)} 
                              className="bg-transparent border-none text-[var(--text-muted)] cursor-pointer text-sm p-1.5 hover:text-[var(--red)] transition-colors rounded-lg hover:bg-white/5 flex items-center justify-center shrink-0" 
                              aria-label="Delete entry"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Calories Intake Curves */}
        <div className="glass p-5 sm:p-6 lg:sticky lg:top-[var(--space-6)] hover:border-[var(--border-hover)]">
          <SectionTitle>Weekly Intake Trend</SectionTitle>
          <div className="w-full h-[320px] min-w-0 mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 3200]} tick={{ fill: "var(--text-muted)", fontSize: 10.5, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="kcal" 
                  stroke="var(--cyan)" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: "var(--bg-base)", stroke: "var(--cyan)", strokeWidth: 2 }} 
                  activeDot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <div className="text-[10px] text-[var(--text-muted)] mb-2.5 uppercase tracking-wider font-mono font-bold">Quick logging shortcuts</div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <button onClick={() => {
                if (log.length > 0) {
                  log.forEach(item => handleLogCustomFoodDirect(item));
                }
              }} className="btn btn-ghost w-full justify-center text-xs h-9 px-3">Repeat Today's Logs</button>
            </div>
          </div>
        </div>

      </div>

      {/* Manual Food Entry / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out_both]">
          <div className="glass w-full max-w-md p-6 flex flex-col gap-4 border-[var(--border-hover)]">
            <h3 className="font-syne font-bold text-base text-[var(--text-primary)]">
              {formMode === "edit" ? "Edit Custom Food" : formMode === "duplicate" ? "Duplicate Custom Food" : "Create Custom Food"}
            </h3>
            
            {formError && (
              <div className="p-3 rounded-xl bg-[var(--red-dim)] border border-rgba(248,113,113,0.2) text-[var(--red)] text-xs">
                ⚠️ {formError}
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Food Name *</FieldLabel>
                <input
                  className="field-input w-full h-10 text-sm"
                  placeholder="e.g. Homemade Chicken Curry"
                  value={formFoodName}
                  onChange={(e) => setFormFoodName(e.target.value)}
                />
              </div>
              
              <div>
                <FieldLabel>Serving Size (optional)</FieldLabel>
                <input
                  className="field-input w-full h-10 text-sm"
                  placeholder="e.g. 1 bowl, 250 g"
                  value={formServingSize}
                  onChange={(e) => setFormServingSize(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Calories (kcal) *</FieldLabel>
                  <input
                    type="number"
                    className="field-input w-full h-10 text-sm"
                    placeholder="0"
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Protein (g)</FieldLabel>
                  <input
                    type="number"
                    className="field-input w-full h-10 text-sm"
                    placeholder="0"
                    value={formProtein}
                    onChange={(e) => setFormProtein(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <FieldLabel>Carbs (g)</FieldLabel>
                  <input
                    type="number"
                    className="field-input w-full h-10 text-sm"
                    placeholder="0"
                    value={formCarbs}
                    onChange={(e) => setFormCarbs(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Fat (g)</FieldLabel>
                  <input
                    type="number"
                    className="field-input w-full h-10 text-sm"
                    placeholder="0"
                    value={formFat}
                    onChange={(e) => setFormFat(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Fiber (g)</FieldLabel>
                  <input
                    type="number"
                    className="field-input w-full h-10 text-sm"
                    placeholder="0"
                    value={formFiber}
                    onChange={(e) => setFormFiber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Notes (optional)</FieldLabel>
                <textarea
                  className="field-input w-full min-h-[60px] py-2 text-sm resize-none"
                  placeholder="Additional notes or description"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="formIsFavorite"
                  checked={formIsFavorite}
                  onChange={(e) => setFormIsFavorite(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="formIsFavorite" className="text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                  Mark as Favorite ⭐
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setIsFormOpen(false)}
                className="btn btn-ghost text-xs h-9 px-4 justify-center"
              >
                Cancel
              </button>
              <ActionButton
                onClick={handleSaveCustomFood}
                loading={submitting}
                color="cyan"
                className="text-xs h-9 px-4 justify-center"
              >
                Save Food
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out_both]">
          <div className="glass w-full max-w-sm p-6 flex flex-col gap-4 border-[var(--border-hover)]">
            <h3 className="font-syne font-bold text-base text-[var(--red)] flex items-center gap-1.5">
              ⚠️ Delete Custom Food
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Delete <strong className="text-[var(--text-primary)] capitalize">"{deleteConfirmItem.food_name}"</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="btn btn-ghost text-xs h-9 px-4 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomFood}
                className="btn btn-cyan text-xs h-9 px-4 justify-center bg-[var(--red)] hover:bg-[var(--red)] border-none text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
