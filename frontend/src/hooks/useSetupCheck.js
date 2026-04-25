import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function useSetupCheck(user) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      if (!user) return;

      if (user.role === "admin") {
      setChecking(false);
      return;
    }

      try {
        const res = await API.get("/items/check-my-setup");

if (!res.data.isSetup) {
  navigate("/setup-inventory");
}

      } catch (err) {
        console.log(err);
      } finally {
        setChecking(false);
      }
    };

    checkSetup();
  }, [user]);

  return checking;
}