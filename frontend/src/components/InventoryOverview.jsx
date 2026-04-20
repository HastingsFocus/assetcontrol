import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../socket";

export default function InventoryOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // 🔥 NEW

  // 🔥 FETCH INVENTORY
  const fetchInventory = async () => {
    try {
      setLoading(true);

      // 🔥 DEBUG TOKEN
      const token = localStorage.getItem("token");
      console.log("🔐 TOKEN:", token);

      const res = await API.get("/items/all");

      setData(res.data);
      setError(""); // ✅ clear error if success
    } catch (error) {
      console.error("❌ Failed to fetch inventory", error);

      // 🔥 HANDLE DIFFERENT ERRORS
      if (error.response?.status === 403) {
        setError("Access denied. Please login again as admin.");
      } else {
        setError("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 INITIAL LOAD + REAL-TIME SOCKET
  useEffect(() => {
    fetchInventory();

    // 🔥 LISTEN FOR REAL-TIME UPDATES
    socket.on("inventoryUpdated", (data) => {
      console.log("🔥 Real-time inventory update received:", data);
      fetchInventory(); // refresh automatically
    });

    return () => {
      socket.off("inventoryUpdated");
    };
  }, []);

  // 🔥 GROUP BY DEPARTMENT
  const grouped = data.reduce((acc, item) => {
    const dept = item.department || "Unknown";

    if (!acc[dept]) {
      acc[dept] = [];
    }

    acc[dept].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h2>🏢 Department Inventory Overview</h2>

      {/* ❌ ERROR DISPLAY */}
      {error && (
        <p style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      {/* 🔄 LOADING */}
      {loading && <p>Loading inventory...</p>}

      {/* 🚫 NO DATA */}
      {!loading && data.length === 0 && !error && (
        <p>No inventory data available</p>
      )}

      {/* ✅ DATA DISPLAY */}
      {!loading &&
        !error &&
        Object.keys(grouped).map((dept) => (
          <div
            key={dept}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "20px",
            }}
          >
            <h3>📌 {dept}</h3>

            {grouped[dept].map((item) => (
              <div
                key={item._id}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#f9fafb",
                  borderRadius: "6px",
                }}
              >
                <strong>{item.itemType?.name || "Unknown Item"}</strong>

                <div style={{ marginTop: "5px" }}>
                  ✅ Good: {item.conditions?.good || 0} |{" "}
                  ⚠️ Fair: {item.conditions?.fair || 0} |{" "}
                  ❌ Poor: {item.conditions?.poor || 0}
                </div>

                <div style={{ marginTop: "5px" }}>
                  🔢 Total: {item.totalQuantity || 0}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}