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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);

      // 🔥 STEP 1: SAVE USER + TOKEN
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const user = res.data.user;

      alert("Login successful");

      // 🔥 STEP 2: REDIRECT LOGIC (ONBOARDING FLOW)
      if (user.role === "admin") {
        navigate("/admin");
      } 
      else if (!user.inventorySetupComplete) {
        navigate("/setup-inventory");
      } 
      else {
        navigate("/dashboard");
      }

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

      {/* 🔥 REGISTER LINK */}
      <p style={{ marginTop: "10px" }}>
        Don’t have an account?{" "}
        <Link to="/register" style={{ color: "blue" }}>
          Register
        </Link>
      </p>
    </div>
  );
}