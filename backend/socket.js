import http from "http";
import { Server } from "socket.io";

let io;
let userSockets = {};

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
    console.log("🟢 User connected:", socket.id);

    socket.on("register", (userId) => {
      userSockets[userId] = socket.id;

      console.log("📌 User registered:", userId);
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);

      for (let id in userSockets) {
        if (userSockets[id] === socket.id) {
          delete userSockets[id];
        }
      }
    });
  });

  return server;
};

// 🔥 SEND NOTIFICATION
export const sendNotification = (userId, data) => {
  const socketId = userSockets[userId];

  if (!io) return;
  if (!socketId) return;

  io.to(socketId).emit("notification", data);
};

// ✅ ADD THIS (IMPORTANT FIX)
export { io, userSockets };