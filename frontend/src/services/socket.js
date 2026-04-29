import { io } from "socket.io-client";

const URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("🔌 SOCKET URL:", URL); // 👈 VERY IMPORTANT DEBUG

const socket = io(URL, {
  withCredentials: true,
});

export default socket;