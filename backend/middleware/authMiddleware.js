import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 🔒 AUTH MIDDLEWARE (PROTECTED ROUTES)
export const protect = async (req, res, next) => {
  let token;

  // 🔍 Get token from header
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 🚫 No token
  if (!token) {
    return res.status(401).json({
      message: "No token, not authorized",
    });
  }

  try {
    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 Get user from DB
    const user = await User.findById(decoded.id).select("-password");
    req.user = user;

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // 🔥 STANDARDIZED USER OBJECT (IMPORTANT FOR YOUR SYSTEM)
   req.user = {
  _id: user._id,
  name: user.name,          // 🔥 ADD THIS
  role: user.role,
  department: user.department,
  email: user.email,
};

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token failed, not authorized",
    });
  }
};

// 🛡️ ADMIN ONLY
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
};