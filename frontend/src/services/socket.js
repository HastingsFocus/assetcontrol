import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ;

const socket = io(SOCKET_URL, {
  autoConnect: false, // ✅ important (we control connection manually)
  transports: ["websocket"],
});

export default socket;