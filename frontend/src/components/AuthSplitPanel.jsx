import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function AuthSplitPanel({ initialMode = "signin" }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activePanel, setActivePanel] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [signinForm, setSigninForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validatePassword = (password) => ({
    minLength: password.length >= 6,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  });

  const strength = useMemo(() => {
    const rules = validatePassword(signupForm.password);
    return Object.values(rules).filter(Boolean).length;
  }, [signupForm.password]);

  const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "",
    "bg-red-500",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-slate-400",
    "bg-slate-500",
  ][strength];

  const handleSigninChange = (e) => {
    setSigninForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSignupChange = (e) => {
    setSignupForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/auth/login", signinForm);
      const { token, user } = res.data;

      sessionStorage.setItem("token", token);
      login({ token, user });
      toast.success("Login successful");
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const rules = validatePassword(signupForm.password);
    if (!rules.minLength || !rules.hasUpper || !rules.hasLower || !rules.hasNumber || !rules.hasSymbol) {
      const message = "Password must be at least 6 characters with uppercase, lowercase, number & symbol.";
      setError(message);
      toast.error(message);
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/register", {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
      });
      const { token, user } = res.data;

      if (token) {
        sessionStorage.setItem("token", token);
        login({ token, user });
        toast.success("Account created successfully");
        navigate(user.role === "admin" ? "/admin" : "/dashboard");
      } else {
        toast.success("Registration successful! Please login.");
        setActivePanel("signin");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isSignin = activePanel === "signin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-zinc-100 to-slate-300 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl mx-auto mb-6 flex justify-center">
        <img
          src="/st-joseph-college-logo.png"
          alt="St Joseph's College of Health Sciences"
          className="w-full max-w-md h-auto object-contain object-center max-h-24 sm:max-h-28"
          width={480}
          height={120}
        />
      </div>

      <div className="w-full max-w-5xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-2xl shadow-slate-900/20 ring-1 ring-white/60">
        <div className="grid md:grid-cols-2 min-h-[560px]">
          <section className="relative bg-white/95 px-6 sm:px-9 py-8 sm:py-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-600 to-slate-400" aria-hidden="true" />

            <div className="pt-3">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {isSignin ? "Sign In" : "Sign Up"}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                {isSignin ? "Access your procurement dashboard" : "Create your account to get started"}
              </p>
            </div>

            <div className="mt-7">
              {isSignin ? (
                <form onSubmit={handleSignin} className="space-y-4 animate-[fadeIn_.25s_ease-out]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.ac"
                      value={signinForm.email}
                      onChange={handleSigninChange}
                      required
                      autoComplete="email"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={signinForm.password}
                      onChange={handleSigninChange}
                      required
                      autoComplete="current-password"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg shadow-md shadow-slate-900/20 transition"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 animate-[fadeIn_.25s_ease-out]">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      name="name"
                      placeholder="John Doe"
                      value={signupForm.name}
                      onChange={handleSignupChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@stjosephs.ac"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="flex gap-2">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={signupForm.password}
                        onChange={handleSignupChange}
                        required
                        className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50/80 hover:bg-slate-100 transition shadow-sm"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {signupForm.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all ${strength >= i ? strengthColor : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Strength: <span className="font-medium">{strengthLabel}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg shadow-md shadow-slate-900/20 transition"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </button>
                </form>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
          </section>

          <section className="relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 text-white">
            <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-14 h-44 w-44 rounded-full bg-slate-300/20 blur-2xl" aria-hidden="true" />
            <div className="relative h-full flex flex-col justify-center px-8 sm:px-10 py-10">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-200/90 mb-3">
                {isSignin ? "Welcome Back" : "Join The Platform"}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                {isSignin ? "Sign in to continue" : "Create your account"}
              </h2>
              <p className="text-slate-200 mt-3 max-w-sm">
                {isSignin
                  ? "Track requests, manage approvals, and monitor inventory from one clean dashboard."
                  : "Get started with procurement requests and inventory tracking for your department."}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActivePanel("signin")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                    isSignin ? "border-white/60 bg-white/20 text-white" : "border-white/25 bg-white/5 text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("signup")}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                    !isSignin ? "border-white/60 bg-white/20 text-white" : "border-white/25 bg-white/5 text-slate-200"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
