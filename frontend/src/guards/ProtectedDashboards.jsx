import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSetupCheck from "../hooks/useSetupCheck";

export default function ProtectedDashboard({ children }) {
  const { user, token } = useAuth();
  const location = useLocation();

  const { checking, isSetup } = useSetupCheck(user);

  // 🔐 Not logged in
  if (!token) {
    return <Navigate to="/login" />;
  }

  // ⏳ Still checking setup from backend
  if (checking) {
    return <p>Checking setup...</p>;
  }

  // 🚨 Only redirect if user has NO inventory
  if (!isSetup && location.pathname !== "/setup-inventory") {
    return <Navigate to="/setup-inventory" />;
  }

  return children;
}