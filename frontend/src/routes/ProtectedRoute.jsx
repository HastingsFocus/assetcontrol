import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    return <Navigate to="/login" />;
  }

  // 🔥 inventory setup check
  if (!user.inventorySetupComplete) {
    return <Navigate to="/setup-inventory" />;
  }

  return children;
}