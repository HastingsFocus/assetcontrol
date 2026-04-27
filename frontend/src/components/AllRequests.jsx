import { useEffect, useState } from "react";
import API from "../services/api";

export default function AllRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [approvedQty, setApprovedQty] = useState("");

  // 📦 Fetch requests
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (error) {
      console.log("❌ Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==============================
  // ✅ UPDATE STATUS (APPROVE / REJECT)
  // ==============================
  const updateStatus = async (id, status) => {
    try {
      const res = await API.put(`/requests/${id}`, { status });

      setSelected(res.data.request);
      fetchRequests();
    } catch (err) {
      console.log("❌ Update error:", err.response?.data || err);
    }
  };

  // ==============================
  // ✅ UPDATE APPROVED QUANTITY
  // ==============================
  const updateApprovedQuantity = async () => {
    try {
      if (!approvedQty || approvedQty <= 0) {
        return alert("Enter a valid quantity");
      }

      if (approvedQty > selected.quantity) {
        return alert("Cannot exceed requested quantity");
      }

      const res = await API.put(`/requests/${selected._id}`, {
        approvedQuantity: approvedQty,
      });

      setSelected(res.data.request);
      setApprovedQty("");
      fetchRequests();
    } catch (err) {
      console.log("❌ Quantity update error:", err.response?.data || err);
    }
  };

  // ==============================
  // 🎯 UI HELPERS
  // ==============================
  const getStatusColor = (status) => {
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "orange";
  };

  return (
    <div>
      <h2>📦 All Requests</h2>

      {/* ================= TABLE ================= */}
      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Department</th>
            <th>Quantity</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => (
            <tr key={req._id}>
              <td>{req.itemName}</td>
              <td>{req.department || req.user?.department || "N/A"}</td>
              <td>{req.quantity}</td>
              <td>{req.priority}</td>
              <td style={{ color: getStatusColor(req.status), fontWeight: "bold" }}>
                {req.status}
              </td>
              <td>
                <button onClick={() => {
                  setSelected(req);
                  setApprovedQty("");
                }}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= DETAILS PANEL ================= */}
      {selected && (
        <div style={{ marginTop: 20, padding: 20, border: "1px solid #ccc" }}>
          <h3>Request Details</h3>

          <p><strong>Item:</strong> {selected.itemName}</p>
          <p><strong>Department:</strong> {selected.department || selected.user?.department}</p>
          <p><strong>Requested By:</strong> {selected.user?.name}</p>
          <p><strong>Email:</strong> {selected.user?.email}</p>
          <p><strong>Requested Quantity:</strong> {selected.quantity}</p>

          <p>
            <strong>Status:</strong>{" "}
            <span style={{ color: getStatusColor(selected.status), fontWeight: "bold" }}>
              {selected.status}
            </span>
          </p>

          <p>
            <strong>Required Date:</strong>{" "}
            {selected.requiredDate
              ? new Date(selected.requiredDate).toDateString()
              : "N/A"}
          </p>

          {/* ================= ACTION BUTTONS ================= */}
          <div style={{ marginTop: 15 }}>
            <button
              onClick={() => updateStatus(selected._id, "approved")}
              disabled={selected.status === "approved"}
            >
              ✅ Approve
            </button>

            <button
              onClick={() => updateStatus(selected._id, "rejected")}
              disabled={selected.status === "rejected"}
              style={{ marginLeft: 10 }}
            >
              ❌ Reject
            </button>
          </div>

          {/* ================= APPROVED QUANTITY ================= */}
          {selected.status === "approved" && (
            <div style={{ marginTop: 15 }}>
              {selected.approvedQuantity ? (
                <p>
                  <strong>Approved Quantity:</strong> {selected.approvedQuantity}
                </p>
              ) : (
                <div>
                  <label><strong>Enter Approved Quantity:</strong></label>
                  <br />

                  <input
                    type="number"
                    value={approvedQty}
                    onChange={(e) => setApprovedQty(Number(e.target.value))}
                  />

                  <button onClick={updateApprovedQuantity} style={{ marginLeft: 10 }}>
                    💾 Save Quantity
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CLOSE */}
          <div style={{ marginTop: 15 }}>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}