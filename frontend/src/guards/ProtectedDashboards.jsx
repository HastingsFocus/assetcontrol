import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSetupCheck from "../hooks/useSetupCheck";

export default function ProtectedDashboard({ children }) {
  const { user, token } = useAuth();

  const checking = useSetupCheck(user);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (checking) {
    return <p>Checking setup...</p>;
  }

  return children;
}