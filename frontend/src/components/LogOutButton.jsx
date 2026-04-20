import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 🔥 Clear everything
    localStorage.clear();

    // Optional: disconnect socket
    // socket.disconnect();

    // Redirect to login
    navigate("/login");
  };

  return (
    <button onClick={handleLogout}>
      🚪 Logout
    </button>
  );
}