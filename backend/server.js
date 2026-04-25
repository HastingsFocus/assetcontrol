import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import { initSocket } from "./socket.js";
import settingsRoutes from "./routes/settingsRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

// 🔥 SOCKET INITIALIZATION (ONLY ONCE)
const server = initSocket(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});