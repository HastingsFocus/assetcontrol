import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔒 PROTECT ROUTES (AUTH CHECK)
export const protect = async (req, res, next) => {
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
    // =========================
    // 🔐 VERIFY TOKEN
    // =========================
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // =========================
    // 👤 FETCH FRESH USER FROM DB
    // =========================
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // =========================
    // 🔥 STANDARDIZED USER OBJECT
    // =========================
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      inventorySetupComplete: user.inventorySetupComplete,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};

// 🛡️ ADMIN ONLY MIDDLEWARE
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};