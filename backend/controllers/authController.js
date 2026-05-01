import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import allowedUsers from "../config/allowedUsers.js";

// 🔐 Generate Token (FIXED)
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      department: user.department,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email and password",
      });
    }

    const allowed = allowedUsers.find((u) => u.email === email);

    if (!allowed) {
      return res.status(403).json({
        message: "Email not authorized",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: allowed.role,
      department: allowed.department,
      inventorySetupComplete: false,
    });

    return res.status(201).json({
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        inventorySetupComplete: user.inventorySetupComplete,
      },
    });

  } catch (err) {
    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    console.log("🚀 LOGIN HIT AT:", Date.now());
    console.log("📩 REQUEST BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });

    console.log("👤 USER FOUND:", user?._id);

    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("🔐 PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("❌ Wrong password");
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    console.log("✅ USER LOGGING IN:", user._id, user.role);

    const token = generateToken(user);

    console.log("🎟️ TOKEN GENERATED:", token);

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        inventorySetupComplete: user.inventorySetupComplete,
      },
    });

  } catch (err) {
    console.error("🔥 LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    // 🔐 Ensure user was injected by auth middleware
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    console.log("🔍 getMe user from token:", req.user._id);

    // 🔥 Always fetch fresh data from DB (source of truth)
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        inventorySetupComplete: user.inventorySetupComplete,
      },
    });

  } catch (error) {
    console.error("❌ getMe error:", error.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
};