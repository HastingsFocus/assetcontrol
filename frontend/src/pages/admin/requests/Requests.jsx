import { useEffect, useState } from "react";
import API from "../../../services/api";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/requests/${id}/status`, {
        status,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status } : r
        )
      );
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Requests Management
      </h1>

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white shadow rounded-lg p-4 border"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {req.department}
                  </p>

                  <p className="text-sm text-gray-500">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {req.status}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateStatus(req._id, "approved")
                    }
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(req._id, "rejected")
                    }
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <p>
                  Items: {req.items?.length || 0}
                </p>

                <p>
                  Requested By: {req.user?.name || "Unknown"}
                </p>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <p className="text-gray-500">
              No requests found
            </p>
          )}
        </div>
      )}
    </div>
  );
}