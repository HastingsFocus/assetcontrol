import { Server } from "socket.io";
import http from "http";

let io;

// 🔥 INIT SOCKET SERVER
export const initSocket = (app) => {
  const server = http.createServer(app);
io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // ✅ your frontend URL
    credentials: true,               // ✅ allow credentials
  },
});

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    // ✅ JOIN USER ROOM
    socket.on("register", (userId) => {
      socket.join(userId);
      console.log("👤 User registered:", userId);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
    });
  });

  return server;
};

//
// 🔔 SEND TO SPECIFIC USER (FIXES YOUR ERROR)
//
export const sendNotification = (userId, data) => {
  if (!io) {
    console.log("❌ Socket not initialized");
    return;
  }

  io.to(userId).emit("notification", data);
};

//
// 📡 BROADCAST TO ALL ADMINS / USERS
//
export const broadcastInventoryUpdate = (data) => {
  if (!io) {
    console.log("❌ Socket not initialized");
    return;
  }

  io.emit("inventoryUpdated", data);
};

// OPTIONAL EXPORT
export { io };