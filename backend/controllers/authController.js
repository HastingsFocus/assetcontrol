import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import allowedUsers from "../config/allowedUsers.js";

// 🔐 Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ REGISTER
export const registerUser = async (req, res) => {
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
    inventorySetupComplete: false, // 🔥 IMPORTANT DEFAULT
  });

  res.status(201).json({
    message: "Registration successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      inventorySetupComplete: user.inventorySetupComplete, // 🔥 ADD THIS
    },
  });
};

// ✅ LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide email and password",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  res.json({
    token: generateToken(user), // 🔥 FIXED HERE
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      inventorySetupComplete: user.inventorySetupComplete,
    },
  });
};