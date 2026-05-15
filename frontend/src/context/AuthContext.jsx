import { createContext, useContext, useEffect, useRef, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const hasLoaded = useRef(false);

  const loadUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user);
    } catch (err) {
      console.log("❌ Auth failed");

      setUser(null);
      setToken(null);
      sessionStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (hasLoaded.current) return;

    hasLoaded.current = true;
    loadUser();
  }, [token]);

  const login = ({ token, user }) => {
    setToken(token);
    sessionStorage.setItem("token", token); // ✅ FIXED (consistent)
    setUser(user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    hasLoaded.current = false;
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, refreshUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};