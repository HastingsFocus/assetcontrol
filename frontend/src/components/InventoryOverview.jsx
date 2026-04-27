import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../socket";

export default function InventoryOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔥 FETCH INVENTORY
  const fetchInventory = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      console.log("🔐 TOKEN:", token);

      const res = await API.get("/items/all");

      setData(res.data);
      setError("");
    } catch (error) {
      console.error("❌ Failed to fetch inventory", error);

      if (error.response?.status === 403) {
        setError("Access denied. Please login again as admin.");
      } else {
        setError("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ONE CLEAN useEffect
  useEffect(() => {
    fetchInventory();

    socket.on("inventoryUpdated", () => {
      console.log("🔄 Inventory update received (admin)");
      fetchInventory();
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

      {error && (
        <p style={{ color: "red", marginBottom: "10px" }}>
          {error}
        </p>
      )}

      {loading && <p>Loading inventory...</p>}

      {!loading && data.length === 0 && !error && (
        <p>No inventory data available</p>
      )}

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