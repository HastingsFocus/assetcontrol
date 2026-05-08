import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      // 1. Clear auth state
      logout();

      // 2. Disconnect socket safely
      if (socket?.connected) {
        socket.disconnect();
      }

      // 3. Redirect
      navigate("/login", { replace: true });

    } catch (err) {
      console.log("Logout error:", err);

      // fallback cleanup
      sessionStorage.clear();
      socket?.disconnect?.();

      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="
        w-full
        relative
        flex items-center justify-center
        px-3 py-2.5
        rounded-lg
        text-sm font-medium
        bg-red-600/95 hover:bg-red-600
        text-white
        shadow-sm ring-1 ring-red-500/30
        transition-all
      "
    >
      {/* Left icon */}
      <svg
        className="w-5 h-5 absolute left-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>

      {/* Center text */}
      <span>Logout</span>
    </button>
  );
}