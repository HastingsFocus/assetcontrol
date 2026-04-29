import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function useSetupCheck() {
  const { user, loading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    // 🔥 WAIT until auth finishes loading
    if (loading) return;

    // 🔒 No user
    if (!user) {
      setChecking(false);
      setIsSetup(false);
      return;
    }

    // 🔥 ADMIN → ALWAYS TRUE
    if (user.role === "admin") {
      setIsSetup(true);
      setChecking(false);
      return;
    }

    // =========================
    // ⚡ FAST PATH (FROM /auth/me)
    // =========================
    if (user.inventorySetupComplete) {
      setIsSetup(true);
      setChecking(false);
      return;
    }

    // =========================
    // 📡 BACKUP CHECK (SERVER)
    // =========================
    const checkSetup = async () => {
      try {
        console.log("📡 Checking inventory setup...");

        const res = await API.get("/items/check-my-setup");

        setIsSetup(res.data.isSetup);
      } catch (err) {
        console.log("❌ Setup check failed:", err);
        setIsSetup(false);
      } finally {
        setChecking(false);
      }
    };

    checkSetup();

  }, [user, loading]);

  return { checking, isSetup };
}