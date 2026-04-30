import { Server } from "socket.io";
import http from "http";

let io;

export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "*", // ✅ TEMP FIX (we tighten later)
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"], // ✅ VERY IMPORTANT
  });

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userId) return;

      const id = userId.toString();
      socket.join(id);

      console.log("👤 User joined room:", id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return server;
};

export const sendNotification = (userId, data) => {
  if (!io) return;

  io.to(userId.toString()).emit("notification", data);
};

export const broadcastInventoryUpdate = (data) => {
  if (!io) return;

  io.emit("inventoryUpdated", data);
};

export { io };