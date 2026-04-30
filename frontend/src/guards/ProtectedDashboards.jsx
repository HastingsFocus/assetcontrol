import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSetupCheck from "../hooks/useSetupCheck";

export default function ProtectedDashboard({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

 const { checking, isSetup } = useSetupCheck();
  // ⏳ WAIT FOR AUTH FIRST
  if (loading) {
    return <p>Loading session...</p>;
  }

  // 🔐 NOT LOGGED IN
  if (!token) {
    return <Navigate to="/login" />;
  }

  // ⏳ WAIT FOR SETUP CHECK
  if (checking) {
    return <p>Checking setup...</p>;
  }

  // 🚨 ONLY redirect AFTER everything is ready
  if (!isSetup && location.pathname !== "/setup-inventory") {
    return <Navigate to="/setup-inventory" replace />;
  }

  return children;
}