import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import { useLocation } from "react-router-dom";

/* =========================
   UI CONSTANTS
========================= */
const STATUS_STYLES = {
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  partially_approved: "bg-blue-100 text-blue-700 border border-blue-200",
};
 
const safeStatus = (status) => (status || "pending").toLowerCase().trim();

const PRIORITY_LABELS = {
  very_important: "Very Important",
  important: "Important",
  not_important: "Not Important",
};

const PRIORITY_STYLES = {
  very_important: "bg-red-50 text-red-600 ring-1 ring-red-200",
  important: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  not_important: "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
};

const STATUS_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  partially_approved: "Partial",
};

const FILTER_LABELS = {
  all: "All",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  partially_approved: "Partial",
};

/* =========================
   HELPERS (IMPORTANT)
========================= */
const deriveRequestStatus = (items = []) => {
  const statuses = items.map((i) => i.itemStatus);

  if (statuses.every((s) => s === "approved")) return "approved";
  if (statuses.every((s) => s === "rejected")) return "rejected";
  if (statuses.every((s) => !s || s === "pending")) return "pending";

  return "partially_approved";
};

/* =========================
   COMPONENT
========================= */
export default function AllRequests({ highlightId: highlightIdFromProps }) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  const [editItems, setEditItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  const location = useLocation();
  const highlightId =
    highlightIdFromProps ||
    new URLSearchParams(location.search).get("requestId");

  const hasOpenedRef = useRef(false);

  /* =========================
     FETCH
  ========================= */
  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* =========================
     OPEN SELECTED
  ========================= */
  useEffect(() => {
    hasOpenedRef.current = false;
  }, [highlightId]);

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

  /* =========================
     SYNC EDIT ITEMS
  ========================= */
  useEffect(() => {
    if (selected) {
      setEditItems(selected.items || []);
    }
  }, [selected]);

  /* =========================
     HELPERS
  ========================= */
  const getItemName = (item) =>
    item.customItemName || item.itemType?.name || item.name || "Unknown Item";

  const totalQty = (req) =>
    req.items?.reduce((sum, i) => sum + (i.quantity || 0), 0);

  /* =========================
     UPDATE BACKEND
  ========================= */
  const updateItems = async (items) => {
    try {
      const newStatus = deriveRequestStatus(items);

      const res = await API.put(`/requests/${selected._id}`, {
        items,
        status: newStatus, // 👈 IMPORTANT FIX
      });

      setSelected(res.data.request);
      fetchRequests();
    } catch (err) {
      console.log(err.response?.data || err);
    }
  };

  /* =========================
     ITEM ACTIONS
  ========================= */
  const updateTempQty = (id, value) => {
    setEditItems((prev) =>
      prev.map((i) =>
        i._id === id ? { ...i, tempQty: Number(value) } : i
      )
    );
  };

  const approveItem = (id) => {
    const updated = editItems.map((i) =>
      i._id === id
        ? {
            ...i,
            itemStatus: "approved",
            approvedQuantity: i.tempQty || i.quantity,
          }
        : i
    );

    setEditItems(updated);
    updateItems(updated);
  };

  const rejectItem = (id) => {
    const updated = editItems.map((i) =>
      i._id === id ? { ...i, itemStatus: "rejected" } : i
    );

    setEditItems(updated);
    updateItems(updated);
  };

  /* =========================
     FILTER
  ========================= */
  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    partially_approved: requests.filter(
      (r) => r.status === "partially_approved"
    ).length,
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="relative animate-[fadeIn_.3s_ease-out]">

      {/* FILTER PILLS */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.keys(counts).map((key) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filterStatus === key
                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/15"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 shadow-sm"
            }`}
          >
            {FILTER_LABELS[key] || key}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filterStatus === key
                  ? "bg-blue-200/80 text-blue-900"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 ring-1 ring-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-zinc-50/90 border-b border-zinc-200/80 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Items</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Dept</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Qty</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Priority</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    No requests in this view.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const status = safeStatus(req.status);
                  return (
                    <tr key={req._id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* ITEMS */}
                      <td className="px-5 py-3.5 align-top">
                        <div className="space-y-0.5">
                          {req.items?.slice(0, 2).map((item) => (
                            <div key={item._id} className="text-zinc-800">
                              <span className="text-zinc-400">•</span> {getItemName(item)}{" "}
                              <span className="text-zinc-400">×{item.quantity}</span>
                            </div>
                          ))}
                          {req.items?.length > 2 && (
                            <div className="text-xs text-zinc-400">
                              +{req.items.length - 2} more
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-zinc-600 align-top">{req.department}</td>
                      <td className="px-5 py-3.5 font-semibold text-zinc-800 tabular-nums align-top">
                        {totalQty(req)}
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            PRIORITY_STYLES[req.priority] || "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {PRIORITY_LABELS[req.priority] || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 align-top">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right align-top">
                        <button
                          onClick={() => setSelected(req)}
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-blue-900/15 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
            onClick={() => setSelected(null)}
          />

          {/* PANEL */}
          <div className="fixed right-0 top-0 w-full max-w-md h-full bg-zinc-50 shadow-2xl flex flex-col z-50 animate-[slideInRight_.28s_cubic-bezier(0.16,1,0.3,1)]">

            {/* HEADER */}
            <div className="relative px-5 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white shrink-0">
              <h2 className="font-semibold tracking-tight">Request Details</h2>
              <p className="text-xs text-slate-300/90 mt-0.5">Review and decide on each item</p>
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3.5 text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* INFO HEADER */}
            <div className="px-5 py-4 border-b border-zinc-200 bg-white grid grid-cols-3 gap-3 text-sm shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-medium">Requested By</p>
                <p className="font-semibold text-zinc-800 truncate">{selected.user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-medium">Department</p>
                <p className="font-semibold text-zinc-800 truncate">{selected.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-medium">Required</p>
                <p className="font-semibold text-zinc-800">
                  {selected.requiredDate
                    ? new Date(selected.requiredDate).toLocaleDateString("en-GB")
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* ITEMS */}
            <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
              {editItems.map((item) => {
                const decided =
                  item.itemStatus === "approved" || item.itemStatus === "rejected";
                return (
                  <div
                    key={item._id}
                    className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-800 truncate">{getItemName(item)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Requested: {item.quantity}</p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          STATUS_STYLES[item.itemStatus || "pending"] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.itemStatus || "pending"}
                      </span>
                    </div>

                    {!decided && (
                      <input
                        type="number"
                        min="0"
                        className="border border-zinc-200 w-full px-3 py-2 mt-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition"
                        placeholder="Approve quantity"
                        onChange={(e) => updateTempQty(item._id, e.target.value)}
                      />
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        disabled={decided}
                        onClick={() => approveItem(item._id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition ${
                          decided
                            ? "bg-zinc-300 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 shadow-sm"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        disabled={decided}
                        onClick={() => rejectItem(item._id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition ${
                          decided
                            ? "bg-zinc-300 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 shadow-sm"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}