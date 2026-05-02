import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AnalyzePage from "./pages/AnalyzePage";
import AuthPage from "./pages/AuthPage";
import CalorieTrackerPage from "./pages/CalorieTrackerPage";
import DashboardPage from "./pages/DashboardPage";
import DietPlanPage from "./pages/DietPlanPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";
import AICoachPage from "./pages/AICoachPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected routes — all wrapped in Layout which provides BodyWiseProvider */}
      <Route
        element={
          <ProtectedRoute user={user} loading={loading}>
            <Layout user={user} />
          </ProtectedRoute>
        }
      >
        <Route path="/"         element={<DashboardPage />} />
        <Route path="/analyze"  element={<AnalyzePage />} />
        <Route path="/results"  element={<ResultsPage />} />
        <Route path="/diet"     element={<DietPlanPage />} />
        <Route path="/calories" element={<CalorieTrackerPage />} />
        <Route path="/coach"    element={<AICoachPage />} />
        <Route path="/history"  element={<HistoryPage />} />
        <Route path="/profile"  element={<ProfilePage />} />
        <Route path="*"         element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
