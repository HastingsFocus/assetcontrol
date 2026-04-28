import { useEffect, useState } from "react";
import API from "../services/api";

export default function useSetupCheck(user) {
  const [checking, setChecking] = useState(true);
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    // 🔒 No user → stop checking
    if (!user) {
      setChecking(false);
      return;
    }

    // 🔥 ADMINS SHOULD SKIP SETUP
    if (user.role === "admin") {
      setIsSetup(true);
      setChecking(false);
      return;
    }

    const checkSetup = async () => {
      try {
        console.log("📡 Checking inventory setup...");

        const res = await API.get("/items/check-my-setup");

        console.log("🧪 SETUP CHECK RESULT:", res.data);

        setIsSetup(res.data.isSetup);
      } catch (err) {
        console.log("❌ Setup check failed:", err);
        setIsSetup(false); // safe fallback
      } finally {
        setChecking(false);
      }
    };

    checkSetup();
  }, [user]);

  return { checking, isSetup };
}