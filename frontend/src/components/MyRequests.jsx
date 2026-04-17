import { useEffect, useState } from "react";
import API from "../services/api";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/my");
      setRequests(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <h2>📋 My Requests</h2>

      {requests.length === 0 ? (
        <p>No requests yet</p>
      ) : (
        requests.map((req) => (
          <div key={req._id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h4>{req.itemName}</h4>
            <p>Quantity: {req.quantity}</p>
            <p>Priority: {req.priority}</p>
            <p>Status: {req.status}</p>
            <p>Date Needed: {new Date(req.requiredDate).toDateString()}</p>
          </div>
        ))
      )}
    </div>
  );
}