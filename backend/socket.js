import { Server } from "socket.io";
import http from "http";

let io;

export const initSocket = (app) => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userId) return;

      socket.join(userId.toString());

      console.log(`👤 User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
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