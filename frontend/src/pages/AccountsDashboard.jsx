import { useEffect, useState } from "react";
import API from "../api"; // adjust if your API path differs
import socket from "../socket";

export default function AccountsDashboard() {
  const [requests, setRequests] = useState([]);
  const [quantities, setQuantities] = useState({});

  // ===============================
  // 📦 FETCH ADMIN-APPROVED REQUESTS
  // ===============================
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");

      const filtered = res.data.filter(
        (r) => r.status === "approved_by_admin"
      );

      setRequests(filtered);
    } catch (error) {
      console.log("❌ Error fetching requests:", error);
    }
  };

  // ===============================
  // 💰 APPROVE FINAL QUANTITY
  // ===============================
  const approve = async (id) => {
    const qty = quantities[id];

    if (!qty || qty <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    try {
      await API.put(`/requests/accounts-approve/${id}`, {
        approvedQuantity: Number(qty),
      });

      alert("✅ Approved successfully");

      // refresh list
      fetchRequests();
    } catch (error) {
      console.log("❌ Approval error:", error);
    }
  };

  // ===============================
  // 🔄 SOCKET LIVE UPDATES
  // ===============================
  useEffect(() => {
    fetchRequests();

    const handleUpdate = (updatedRequest) => {
      if (updatedRequest.status === "approved_by_admin") {
        setRequests((prev) => {
          const exists = prev.find((r) => r._id === updatedRequest._id);

          if (exists) {
            return prev.map((r) =>
              r._id === updatedRequest._id ? updatedRequest : r
            );
          } else {
            return [updatedRequest, ...prev];
          }
        });
      }

      // remove if already processed
      if (updatedRequest.status === "approved_by_accounts") {
        setRequests((prev) =>
          prev.filter((r) => r._id !== updatedRequest._id)
        );
      }
    };

    socket.on("requestUpdated", handleUpdate);

    return () => socket.off("requestUpdated", handleUpdate);
  }, []);

  // ===============================
  // 🎨 UI
  // ===============================
  return (
    <div style={{ padding: "20px" }}>
      <h2>💰 Accounts Dashboard</h2>

      {requests.length === 0 ? (
        <p>No requests waiting for approval</p>
      ) : (
        requests.map((req) => (
          <div
            key={req._id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginTop: "10px",
              borderRadius: "8px",
            }}
          >
            <h3>📦 {req.itemName}</h3>

            <p>
              <strong>Requested:</strong> {req.requestedQuantity}
            </p>

            <p>
              <strong>Admin Approved:</strong>{" "}
              {req.adminQuantity || "N/A"}
            </p>

            <p>
              <strong>Department:</strong>{" "}
              {req.user?.department || "Unknown"}
            </p>

            {/* INPUT */}
            <input
              type="number"
              placeholder="Enter final quantity"
              value={quantities[req._id] || ""}
              onChange={(e) =>
                setQuantities({
                  ...quantities,
                  [req._id]: e.target.value,
                })
              }
              style={{
                padding: "8px",
                marginTop: "10px",
                width: "200px",
              }}
            />

            {/* BUTTON */}
            <div>
              <button
                onClick={() => approve(req._id)}
                style={{
                  marginTop: "10px",
                  background: "green",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                ✅ Approve Purchase
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}