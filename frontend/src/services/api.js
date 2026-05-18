import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");

  console.log("REQUEST TOKEN:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("HEADERS:", config.headers);

  return config;
});

export default API;