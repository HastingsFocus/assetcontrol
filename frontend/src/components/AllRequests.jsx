import { useEffect, useState } from "react";
import API from "../services/api";

export default function AllRequests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  // 🔄 Fetch all requests
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Update request status
  const updateStatus = async (id, status) => {
    try {
      const res = await API.put(`/requests/${id}`, { status });

      // 🔥 Update modal instantly
      setSelected(res.data.request);

      // 🔄 Refresh table
      fetchRequests();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h2>📦 All Requests</h2>

      {/* TABLE */}
      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", marginTop: "20px" }}
      >
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
              <td>{req.user?.department}</td>
              <td>{req.quantity}</td>
              <td>{req.priority}</td>
              <td>{req.status}</td>
              <td>
                <button onClick={() => setSelected(req)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔍 MODAL / DETAILS VIEW */}
      {selected && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            background: "#f9f9f9",
          }}
        >
          <h3>Request Details</h3>

          <p><strong>Item:</strong> {selected.itemName}</p>
          <p><strong>Department:</strong> {selected.user?.department}</p>
          <p><strong>Requested By:</strong> {selected.user?.name}</p>
          <p><strong>Email:</strong> {selected.user?.email}</p>
          <p><strong>Quantity:</strong> {selected.quantity}</p>
          <p><strong>Priority:</strong> {selected.priority}</p>

          {/* ✅ STATUS WITH COLOR */}
          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  selected.status === "approved"
                    ? "green"
                    : selected.status === "rejected"
                    ? "red"
                    : "orange",
                fontWeight: "bold",
              }}
            >
              {selected.status}
            </span>
          </p>

          <p>
            <strong>Required Date:</strong>{" "}
            {new Date(selected.requiredDate).toDateString()}
          </p>

          {/* ✅ ACTION BUTTONS */}
          <div style={{ marginTop: "15px" }}>
            <button
              onClick={() => updateStatus(selected._id, "approved")}
              disabled={selected.status === "approved"}
            >
              ✅ Approve
            </button>

            <button
              onClick={() => updateStatus(selected._id, "rejected")}
              disabled={selected.status === "rejected"}
              style={{ marginLeft: "10px" }}
            >
              ❌ Reject
            </button>
          </div>

          {/* CLOSE BUTTON */}
          <div style={{ marginTop: "15px" }}>
            <button onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}