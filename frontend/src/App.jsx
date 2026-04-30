import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AnalyzePage from "./pages/AnalyzePage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import DietPage from "./pages/DietPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import ResultsPage from "./pages/ResultsPage";

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
        <Route path="/"        element={<DashboardPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/diet"    element={<DietPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* BUG-020 FIX: show proper 404 instead of silent redirect */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Unauthenticated users hitting an unknown root route */}
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}
