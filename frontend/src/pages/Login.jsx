import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 STEP 2: CHECK SETUP + REDIRECT LOGIC
  const checkSetupAndRedirect = async (user) => {
    try {
      // Admin goes straight to admin dashboard
      if (user.role === "admin") {
        navigate("/admin");
        return;
      }

      // 🔥 Check if inventory is already setup
      const res = await API.get("/items/check-setup");

      if (res.data.isSetup) {
        navigate("/dashboard"); // ✅ NORMAL FLOW
      } else {
        navigate("/setup-inventory"); // 🚨 FIRST TIME ONLY
      }
    } catch (err) {
      console.error("Setup check failed:", err);
      navigate("/dashboard"); // fallback safety
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);

      // 🔥 STEP 1: SAVE USER + TOKEN
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful");

      // 🔥 STEP 2: REDIRECT USING BACKEND CHECK
      await checkSetupAndRedirect(res.data.user);

    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: "10px" }}>
        Don’t have an account?{" "}
        <Link to="/register" style={{ color: "blue" }}>
          Register
        </Link>
      </p>
    </div>
  );
}