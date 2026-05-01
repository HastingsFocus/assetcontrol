import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      // 🔥 1. Clear auth state (context + sessionStorage)
      logout();

      // 🔥 2. Disconnect socket safely
      if (socket?.connected) {
        socket.disconnect();
      }

      // 🔥 3. Redirect
      navigate("/login", { replace: true });

    } catch (err) {
      console.log("Logout error:", err);

      // 🔥 SAFE FALLBACK (IMPORTANT FIX)
      sessionStorage.clear(); // instead of localStorage
      socket?.disconnect?.();

      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: "#dc2626",
        color: "white",
        border: "none",
        padding: "10px 12px",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      🚪 Logout
    </button>
  );
}