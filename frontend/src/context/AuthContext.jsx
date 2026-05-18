import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import API from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // Load user from token
  // ==========================================
  const loadUser = async (authToken) => {
    try {
      setLoading(true);

      const res = await API.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setUser(res.data.user);
    } catch (err) {
      console.error(
        "❌ Auth failed:",
        err.response?.data || err.message
      );

      setUser(null);
      setToken(null);
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INIT: read token once on app start
  // ==========================================
  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    loadUser(storedToken);
  }, []);

  // ==========================================
  // Login
  // ==========================================
  const login = ({ token, user }) => {
    console.log("LOGIN TOKEN:", token);
    console.log("LOGIN USER:", user);

    sessionStorage.setItem("token", token);

    setToken(token);
    setUser(user);
  };

  // ==========================================
  // Logout
  // ==========================================
  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // ==========================================
  // Manual refresh
  // ==========================================
  const refreshUser = async () => {
    const storedToken = sessionStorage.getItem("token");

    if (!storedToken) return;

    await loadUser(storedToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};