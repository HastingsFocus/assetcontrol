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

  // 🔄 Handle input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🚀 Submit (NOW INSIDE COMPONENT)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // 🔐 LOGIN
      const res = await API.post("/auth/login", form);

      login(res.data);

      const user = res.data.user;
      console.log(user._id);

      toast.success("Login successful 🚀");

      // ✅ ADMIN FIRST (STOP HERE)
      if (user.role === "admin") {
        navigate("/admin");
        return;
      }

      // 🔥 ONLY NORMAL USERS REACH HERE
      const check = await API.get("/items/check-my-setup");

      if (!check.data.isSetup) {
        navigate("/setup-inventory");
        return;
      }

      navigate("/dashboard");

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
    <div style={{ maxWidth: "400px", margin: "auto" }}>
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

        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "15px" }}>
        Don’t have an account?{" "}
        <Link to="/register" style={{ color: "blue" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}