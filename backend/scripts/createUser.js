/**
 * One-off script to create a sign-in account in MongoDB.
 * Usage: node scripts/createUser.js
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const ACCOUNT = {
  name: "System Admin",
  email: "admin@stjoseph.ac.mw",
  password: "Admin@123",
  role: "admin",
  department: "Administration",
  inventorySetupComplete: true,
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: ACCOUNT.email });

  const hashedPassword = await bcrypt.hash(ACCOUNT.password, 10);

  if (existing) {
    existing.name = ACCOUNT.name;
    existing.password = hashedPassword;
    existing.role = ACCOUNT.role;
    existing.department = ACCOUNT.department;
    existing.inventorySetupComplete = ACCOUNT.inventorySetupComplete;
    await existing.save();
    console.log("Updated existing user:", ACCOUNT.email);
  } else {
    await User.create({
      ...ACCOUNT,
      password: hashedPassword,
    });
    console.log("Created user:", ACCOUNT.email);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
