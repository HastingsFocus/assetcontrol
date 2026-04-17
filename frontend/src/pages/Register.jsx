import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // 🔐 Password validation rules
  const validatePassword = (password) => {
    return {
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  // 📊 Strength calculator
  const getStrength = (password) => {
    const rules = validatePassword(password);
    let score = 0;

    Object.values(rules).forEach((val) => {
      if (val) score++;
    });

    return score; // 0 - 5
  };

  const strength = getStrength(form.password);

  // 🔁 Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // 👁️ toggle password visibility
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // 🚀 submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const rules = validatePassword(form.password);

    // ❌ weak password check
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

    // ❌ confirm password check
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      alert("Registration successful");
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
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
          onChange={handleChange}
        />

        {/* EMAIL */}
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        {/* PASSWORD */}
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={handleChange}
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
          onChange={handleChange}
        />

        {/* PASSWORD STRENGTH BAR */}
        <div style={{ marginTop: "10px" }}>
          <div>Password Strength:</div>
          <div style={{ display: "flex", gap: "5px" }}>
            <div style={{ width: 40, height: 5, background: strength > 0 ? "red" : "#ccc" }} />
            <div style={{ width: 40, height: 5, background: strength > 1 ? "orange" : "#ccc" }} />
            <div style={{ width: 40, height: 5, background: strength > 2 ? "yellow" : "#ccc" }} />
            <div style={{ width: 40, height: 5, background: strength > 3 ? "lightgreen" : "#ccc" }} />
            <div style={{ width: 40, height: 5, background: strength > 4 ? "green" : "#ccc" }} />
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}

        {/* SUBMIT */}
        <button type="submit" style={{ marginTop: "10px" }}>
          Register
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