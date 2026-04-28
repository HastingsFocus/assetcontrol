import { Server } from "socket.io";
import http from "http";

let io;

// 🔥 INIT SOCKET SERVER
export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("register", (userId) => {
  const id = userId.toString(); // 🔥 FORCE STRING

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
// 🔔 SEND NOTIFICATION (ROOM BASED - CLEAN FIX)
//
export const sendNotification = (userId, data) => {
  const id = userId.toString(); // 🔥 FIX HERE

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