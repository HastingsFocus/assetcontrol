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

  // 🔥 REDIRECT LOGIC
  const checkSetupAndRedirect = async (user) => {
    try {
      // 🟢 ADMIN FLOW
      if (user.role === "admin") {
        navigate("/admin");
        return;
      }

      // 🔥 IMPORTANT: user-specific check
      const res = await API.get("/items/check-setup");

      if (res.data.isSetup) {
        navigate("/dashboard");
      } else {
        navigate("/setup-inventory");
      }

    } catch (err) {
      console.error("Setup check failed:", err);
      navigate("/dashboard"); // safety fallback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);

      // 🔐 SAVE AUTH DATA
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful");

      // 🚀 ROUTE USER PROPERLY
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