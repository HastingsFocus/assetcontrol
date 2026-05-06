import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { useLocation } from "react-router-dom";

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
};

const PRIORITY_LABELS = {
  very_important: "Very Important",
  important: "Important",
  not_important: "Not Important",
};

const PRIORITY_STYLES = {
  very_important: "bg-red-50 text-red-600",
  important: "bg-amber-50 text-amber-600",
  not_important: "bg-gray-50 text-gray-500",
};

export default function AllRequests({ highlightId: highlightIdFromProps }) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [approvedQty, setApprovedQty] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const location = useLocation();
  const highlightId =
    highlightIdFromProps || new URLSearchParams(location.search).get("requestId");
  const hasOpenedRef = useRef(false);

  // =========================
  // FETCH REQUESTS
  // =========================
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (error) {
      console.log("❌ Fetch error:", error);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => { hasOpenedRef.current = false; }, [highlightId]);

  useEffect(() => {
    if (!highlightId || requests.length === 0) return;
    if (hasOpenedRef.current) return;
    const target = requests.find((r) => String(r._id) === String(highlightId));
    if (target) {
      setSelected(target);
      hasOpenedRef.current = true;
    }
  }, [highlightId, requests]);

  // =========================
  // UPDATE STATUS
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
  // UPDATE QUANTITY
  // =========================
  const updateApprovedQuantity = async () => {
    if (!approvedQty || approvedQty <= 0) return alert("Enter a valid quantity");
    if (approvedQty > selected.quantity) return alert("Cannot exceed requested quantity");

    try {
      const res = await API.put(`/requests/${selected._id}`, { approvedQuantity: approvedQty });
      setSelected(res.data.request);
      setApprovedQty("");
      fetchRequests();
    } catch (err) {
      console.log("❌ Quantity update error:", err.response?.data || err);
    }
  };

  const filteredRequests = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="relative">

      {/* Summary pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filterStatus === f.key
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/15"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 shadow-sm"
            }`}
          >
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              filterStatus === f.key ? "bg-blue-200/80 text-blue-900" : "bg-gray-100 text-gray-500"
            }`}>
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 overflow-hidden ring-1 ring-zinc-100">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-gray-500">No requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Department</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Qty</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map((req) => (
                  <tr
                    key={req._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      String(req._id) === String(highlightId) ? "bg-slate-50/80" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">{req.itemName}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {req.department || req.user?.department || "N/A"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{req.quantity}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        PRIORITY_STYLES[req.priority] || "bg-gray-50 text-gray-500"
                      }`}>
                        {PRIORITY_LABELS[req.priority] || req.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => { setSelected(req); setApprovedQty(""); }}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLIDE-IN DETAIL PANEL */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelected(null)}
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          />

          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white z-50 shadow-2xl flex flex-col overflow-hidden">

            {/* Panel Header */}
            <div className="bg-gradient-to-r from-slate-700 via-slate-700 to-slate-600 px-6 py-4 flex items-center justify-between border-b border-slate-500/30">
              <h3 className="text-white font-semibold text-lg tracking-tight">Request Details</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-slate-100/90 hover:bg-white/10 hover:text-white transition"
                aria-label="Close panel"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full capitalize ${
                  STATUS_STYLES[selected.status] || "bg-gray-100 text-gray-600"
                }`}>
                  {selected.status}
                </span>
                {selected.requiredDate && (
                  <span className="text-xs text-gray-400">
                    Needed by {new Date(selected.requiredDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                )}
              </div>

              {/* Info grid */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  { label: "Item", value: selected.itemName },
                  { label: "Department", value: selected.department },
                  { label: "Requested By", value: selected.user?.name },
                  { label: "Quantity Requested", value: selected.quantity },
                  ...(selected.approvedQuantity
                    ? [{ label: "Approved Quantity", value: selected.approvedQuantity }]
                    : []),
                  { label: "Priority", value: PRIORITY_LABELS[selected.priority] || selected.priority },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">{row.label}</span>
                    <span className="text-gray-800 font-semibold">{row.value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              {selected.status === "pending" && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">Actions</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(selected._id, "approved")}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selected._id, "rejected")}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Approved quantity input */}
              {selected.status === "approved" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">Set Approved Quantity</p>
                  {selected.approvedQuantity !== null && selected.approvedQuantity !== undefined ? (
                    <div className="rounded-lg border border-green-300 bg-white px-3 py-2 text-sm text-green-800">
                      Approved quantity saved: <span className="font-semibold">{selected.approvedQuantity}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={approvedQty}
                        onChange={(e) => setApprovedQty(Number(e.target.value))}
                        placeholder={`Max: ${selected.quantity}`}
                        className="flex-1 px-3 py-2 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                      />
                      <button
                        onClick={updateApprovedQuantity}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
