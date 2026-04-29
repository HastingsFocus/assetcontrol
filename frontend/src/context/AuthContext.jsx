import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // =========================
  // 🔥 LOAD FRESH USER FROM BACKEND
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
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🚀 INITIAL AUTH CHECK
  // =========================
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // =========================
  // 🔐 LOGIN (STORE TOKEN ONLY)
  // =========================
  const login = (data) => {
    setToken(data.token);
    localStorage.setItem("token", data.token);

    // 🔥 DO NOT TRUST USER FROM LOGIN RESPONSE LONG-TERM
    loadUser(); // immediately sync fresh data
  };

  // =========================
  // 🚪 LOGOUT
  // =========================
  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // =========================
  // 🔄 MANUAL REFRESH USER (OPTIONAL BUT POWERFUL)
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