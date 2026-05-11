import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSetupCheck from "../hooks/useSetupCheck";

export default function ProtectedDashboard({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();
  const { checking, isSetup } = useSetupCheck();

  // ⏳ WAIT FOR AUTH
  if (loading) {
    return <p>Loading session...</p>;
  }

  // 🔐 NOT LOGGED IN
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ⏳ WAIT FOR SETUP CHECK
  if (checking) {
    return <p>Checking setup...</p>;
  }

  // 🚨 FIXED REDIRECT PATH (IMPORTANT CHANGE)
  if (!isSetup && location.pathname !== "/dashboard/setup-inventory") {
    return <Navigate to="/dashboard/setup-inventory" replace />;
  }

  return children;
}