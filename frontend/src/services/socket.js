import { io } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

console.log("🔌 SOCKET URL:", URL);

const socket = io(URL, {
  withCredentials: true,
  transports: ["websocket"], 
});

export default socket;