import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, loading, children }) {
  if (loading) return <div className="p-6 text-center">Loading session...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
