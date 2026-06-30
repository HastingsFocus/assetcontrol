import { useEffect, useState } from "react";
import API from "../services/api";

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  partially_approved: "bg-blue-100 text-blue-700 border border-blue-200",
};

const PRIORITY_STYLES = {
  very_important: "bg-red-50 text-red-600",
  important: "bg-amber-50 text-amber-600",
  not_important: "bg-gray-50 text-gray-500",
};

const PRIORITY_LABELS = {
  very_important: "Very Important",
  important: "Important",
  not_important: "Not Important",
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/my");
      setRequests(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 font-medium">No requests yet</p>
        <p className="text-gray-400 text-sm">
          Your requisitions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-6">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">My Requests</h2>
        <p className="text-sm text-gray-500">
          {requests.length} total request{requests.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* REQUESTS */}
      {requests.map((req) => (
        <div
          key={req._id}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >

          {/* REQUEST HEADER */}
          <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-b">
            <div>
              
              <p className="text-sm text-gray-600">
                Needed:{" "}
                {new Date(req.requiredDate).toLocaleDateString("en-GB")}
              </p>
            </div>

            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                STATUS_STYLES[req.status] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {req.status}
            </span>
          </div>

          {/* ITEMS */}
          <div className="divide-y">

            {req.items.map((item, index) => (
              <div
                key={index}
                className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >

                {/* ITEM NAME */}
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {item.type === "custom"
                      ? "Custom Item"
                      : "Predefined Item"}
                  </p>
                </div>

                {/* DETAILS */}
                <div className="flex flex-wrap gap-2 text-sm">

                  <span className="text-gray-600">
                    Qty:{" "}
                    <span className="font-medium text-gray-800">
                      {item.quantity}
                    </span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      PRIORITY_STYLES[item.priority]
                    }`}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>

                  <span className="text-gray-600">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {item.itemStatus || "pending"}
                    </span>
                  </span>

                </div>
              </div>
            ))}

          </div>

          {/* REMARKS */}
          {req.remarks && (
            <div className="px-5 py-3 bg-gray-50 text-sm text-gray-600">
              <span className="font-medium">Remarks:</span> {req.remarks}
            </div>
          )}

        </div>
      ))}
    </div>
  );
}