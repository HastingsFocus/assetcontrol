import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔒 PROTECT ROUTES (AUTH CHECK)
const protect = async (req, res, next) => {
  let token;

  // =========================
  // 🔍 GET TOKEN FROM HEADER
  // =========================
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 🚫 NO TOKEN
  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

const user = await User.findById(decoded.id).select("-password");

if (!user) {
  return res.status(401).json({
    message: "User not found",
  });
}

// 🔥 MAKE IT CLEAN + CONSISTENT
req.user = {
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  department: user.department,
};

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};

// 🛡️ ADMIN ONLY MIDDLEWARE
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

// ✅ EXPORTS (FIXED)
export default protect;
export { adminOnly };