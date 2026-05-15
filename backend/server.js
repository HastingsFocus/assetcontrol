import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import editAccessRoutes from "./routes/editAccessRoutes.js";
import { initSocket } from "./socket.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import itemLibraryRoutes from "./routes/itemLibraryRoutes.js";


import seedItemTypes from "./seed/itemType.js";

dotenv.config();

const app = express();

// =========================
// 🔐 CORS CONFIG (FIXED)
// =========================
app.use(
  cors({
    origin: "*", // ✅ allows all origins (fixes Render + sockets)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// =========================
// 🧩 MIDDLEWARE
// =========================
app.use(express.json());

// =========================
// 🚏 ROUTES
// =========================
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/edit-access", editAccessRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/items", itemLibraryRoutes);
app.get("/", (req, res) => {
  res.send("🚀 API Running...");
});

// =========================
// ⚡ SOCKET INIT
// =========================
const server = initSocket(app);

const PORT = process.env.PORT || 5000;

// =========================
// 🚀 START SERVER
// =========================
const startServer = async () => {
  try {
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    if (process.env.SEED_DB === "true") {
      console.log("🌱 Seeding item types...");
      await seedItemTypes();
      console.log("✅ Seeding completed");
    } else {
      console.log("⚡ Seeding skipped (SEED_DB not enabled)");
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();