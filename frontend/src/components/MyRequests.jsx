import { useEffect, useState } from "react";
import API from "../services/api";

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
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
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">No requests yet</p>
        <p className="text-gray-400 text-sm mt-1">Your submitted requisitions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">My Requests</h2>
          <p className="text-sm text-gray-500">{requests.length} total request{requests.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 overflow-hidden ring-1 ring-zinc-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Qty</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Priority</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Date Needed</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-800">{req.itemName}</td>
                <td className="px-5 py-3.5 text-gray-600">{req.quantity}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_STYLES[req.priority] || "bg-gray-50 text-gray-500"}`}>
                    {PRIORITY_LABELS[req.priority] || req.priority}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-gray-600">
                  {new Date(req.requiredDate).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"}`}>
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {requests.map((req) => (
          <div key={req._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{req.itemName}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"}`}>
                {req.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Quantity: <span className="text-gray-700 font-medium">{req.quantity}</span></p>
              <p>Priority: <span className={`font-medium ${PRIORITY_STYLES[req.priority]}`}>{PRIORITY_LABELS[req.priority] || req.priority}</span></p>
              <p>Needed by: <span className="text-gray-700">{new Date(req.requiredDate).toLocaleDateString()}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
