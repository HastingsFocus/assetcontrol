import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // 🔄 INPUT HANDLER
  // =========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // 🚀 LOGIN (CLEAN VERSION)
  // =========================
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const res = await API.post("/auth/login", form);
    const { token, user } = res.data;

    // 🔐 Store token ONLY
    localStorage.setItem("token", token);

    // 🔥 Update auth context (fast UI update)
    login({ token, user });

    toast.success("Login successful 🚀");

    // =========================
    // 🚀 ROUTING
    // =========================
    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

  } catch (error) {
    const message =
      error.response?.data?.message || "Login failed";

    toast.error(message);
    console.log("❌ LOGIN ERROR:", message);

  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}