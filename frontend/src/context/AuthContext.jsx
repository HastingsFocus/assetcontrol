import { createContext, useContext, useEffect, useRef, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // 🔥 prevents duplicate /me calls
  const hasLoaded = useRef(false);

  // =========================
  // 🔥 LOAD USER ONCE ONLY
  // =========================
  const loadUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      console.log("❌ Auth load failed");

      setUser(null);
      setToken(null);

      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🚀 INITIAL AUTH CHECK (RUN ONCE)
  // =========================
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (hasLoaded.current) return; // 🔥 BLOCK DUPLICATES

    hasLoaded.current = true;
    loadUser();
  }, []); // 🔥 IMPORTANT: EMPTY DEPENDENCY ARRAY

  // =========================
  // 🔐 LOGIN
  // =========================
  const login = ({ token, user }) => {
    setToken(token);
    localStorage.setItem("token", token);

    // 🔥 OPTION 1 (fast UI)
    setUser(user);

    // 🔥 OPTION 2 (ENSURE TRUE SOURCE OF TRUTH)
    loadUser();
  };

  // =========================
  // 🚪 LOGOUT
  // =========================
  const logout = () => {
    setUser(null);
    setToken(null);
    hasLoaded.current = false;

    localStorage.removeItem("token");
  };

  // =========================
  // 🔄 REFRESH USER MANUALLY
  // =========================
  const refreshUser = () => {
    if (token) loadUser();
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