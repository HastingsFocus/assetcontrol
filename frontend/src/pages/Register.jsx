import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ MUST be inside component

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Password validation
  const validatePassword = (password) => ({
    minLength: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  // 📊 Strength
  const getStrength = (password) => {
    const rules = validatePassword(password);
    return Object.values(rules).filter(Boolean).length;
  };

  const strength = getStrength(form.password);

  // 🔁 Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // 👁️ Toggle password
  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // 🚀 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rules = validatePassword(form.password);

    if (
      !rules.minLength ||
      !rules.hasUpper ||
      !rules.hasLower ||
      !rules.hasNumber ||
      !rules.hasSymbol
    ) {
      setError(
        "Password must be 6+ chars and include uppercase, lowercase, number & symbol"
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // 🔥 Auto-login if backend returns token
      if (res.data.token && res.data.user) {
        login(res.data);
        toast.success("Account created successfully 🚀");

        if (res.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.success("Registration successful! Please login.");
        navigate("/login");
      }

    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed";

      setError(message);
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        {/* NAME */}
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        {/* EMAIL */}
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        {/* PASSWORD */}
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="button" onClick={togglePassword}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* CONFIRM PASSWORD */}
        <input
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        {/* PASSWORD STRENGTH */}
        <div style={{ marginTop: "10px" }}>
          <div>Password Strength:</div>
          <div style={{ display: "flex", gap: "5px" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 5,
                  background:
                    strength > i
                      ? ["red", "orange", "yellow", "lightgreen", "green"][i]
                      : "#ccc",
                }}
              />
            ))}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: "10px" }}
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      {/* LOGIN LINK */}
      <p style={{ marginTop: "10px" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "blue" }}>
          Login
        </Link>
      </p>
    </div>
  );
}