import { io } from "socket.io-client";

// ⚡ connect to backend
const socket = io("http://localhost:5000", {
  withCredentials: true,
});

export default socket;