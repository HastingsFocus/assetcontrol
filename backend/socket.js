import { Server } from "socket.io";
import http from "http";

let io;

// 🔥 INIT SOCKET SERVER
export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173", // ✅ dev
        "https://assetcontrol-xilu.onrender.com", 
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    // 🔥 REGISTER USER ROOM
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

//
// 🔔 SEND NOTIFICATION
//
export const sendNotification = (userId, data) => {
  if (!io) return;

  const id = userId.toString();

  console.log("📡 Sending notification to room:", id);

  io.to(id).emit("notification", data);
};

//
// 📡 INVENTORY BROADCAST
//
export const broadcastInventoryUpdate = (data) => {
  if (!io) return;

  io.emit("inventoryUpdated", data);
};

export { io };