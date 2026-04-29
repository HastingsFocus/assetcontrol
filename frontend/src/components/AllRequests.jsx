import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { useLocation } from "react-router-dom";

export default function AllRequests({ highlightId: highlightIdFromProps }) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [approvedQty, setApprovedQty] = useState("");

  const location = useLocation();

  const highlightId =
    highlightIdFromProps ||
    new URLSearchParams(location.search).get("requestId");

  const hasOpenedRef = useRef(false);

  // =========================
  // 📦 FETCH REQUESTS (CLEAN)
  // =========================
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

  // =========================
  // 🔥 RESET AUTO OPEN WHEN ID CHANGES
  // =========================
  useEffect(() => {
    hasOpenedRef.current = false;
  }, [highlightId]);

  // =========================
  // 🚀 AUTO OPEN REQUEST (SAFE VERSION)
  // =========================
  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    if (hasOpenedRef.current) return;

    const target = requests.find(
      (r) => String(r._id) === String(highlightId)
    );

    if (target) {
      setSelected(target);
      hasOpenedRef.current = true;
    }
  }, [highlightId, requests]);

  // =========================
  // 🔄 UPDATE STATUS
  // =========================
  const updateStatus = async (id, status) => {
    try {
      const res = await API.put(`/requests/${id}`, { status });

      setSelected(res.data.request);
      fetchRequests();
    } catch (err) {
      console.log("❌ Update error:", err.response?.data || err);
    }
  };

  // =========================
  // 💾 UPDATE QUANTITY
  // =========================
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

  const getStatusColor = (status) => {
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "orange";
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ position: "relative" }}>
      <h2>📦 All Requests</h2>

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
                <button
                  onClick={() => {
                    setSelected(req);
                    setApprovedQty("");
                  }}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SIDE PANEL */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.4)",
              zIndex: 999,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "400px",
              height: "100%",
              background: "#fff",
              padding: "20px",
              zIndex: 1000,
              overflowY: "auto",
            }}
          >
            <h3>📄 Request Details</h3>

            <p><strong>Item:</strong> {selected.itemName}</p>
            <p><strong>Department:</strong> {selected.department}</p>
            <p><strong>Requested By:</strong> {selected.user?.name}</p>

            <p><strong>Quantity:</strong> {selected.quantity}</p>

            <p>
              <strong>Status:</strong>{" "}
              <span style={{ color: getStatusColor(selected.status) }}>
                {selected.status}
              </span>
            </p>

            <div style={{ marginTop: 15 }}>
              <button onClick={() => updateStatus(selected._id, "approved")}>
                ✅ Approve
              </button>

              <button
                onClick={() => updateStatus(selected._id, "rejected")}
                style={{ marginLeft: 10 }}
              >
                ❌ Reject
              </button>
            </div>

            {selected.status === "approved" && (
              <div style={{ marginTop: 15 }}>
                <input
                  type="number"
                  value={approvedQty}
                  onChange={(e) => setApprovedQty(Number(e.target.value))}
                />

                <button onClick={updateApprovedQuantity}>
                  💾 Save
                </button>
              </div>
            )}

            <button onClick={() => setSelected(null)} style={{ marginTop: 20 }}>
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
}