import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function useSetupCheck() {
  const { user, loading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setIsSetup(false);
      setChecking(false);
      return;
    }

    // 🔥 ADMIN ALWAYS PASSES
    if (user.role === "admin") {
      setIsSetup(true);
      setChecking(false);
      return;
    }

    // 🔥 FAST PATH
    if (user.inventorySetupComplete) {
      setIsSetup(true);
      setChecking(false);
      return;
    }

    // 🔥 BACKUP SERVER CHECK
    const check = async () => {
      try {
        const res = await API.get("/items/check-my-setup");
        setIsSetup(res.data.isSetup);
      } catch (err) {
        console.log("Setup check failed:", err);
        setIsSetup(false);
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user, loading]);

  return { checking, isSetup };
}