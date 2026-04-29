import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  // 🔍 Get token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token",
    });
  }

  try {
    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 GET FRESH USER FROM DB (CRITICAL FIX)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // 🔥 STANDARDIZED USER OBJECT
    req.user = {
      _id: user._id,  // ✅ FIXED
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      inventorySetupComplete: user.inventorySetupComplete,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalid or expired",
    });
  }
};

export default protect;