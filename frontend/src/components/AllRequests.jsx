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
    <div className="relative">

      {/* FILTER */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.keys(counts).map((key) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              filterStatus === key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-5 py-3 text-left">Items</th>
              <th className="px-5 py-3 text-left">Dept</th>
              <th className="px-5 py-3 text-left">Qty</th>
              <th className="px-5 py-3 text-left">Priority</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredRequests.map((req) => (
              <tr key={req._id} className="hover:bg-gray-50">

                {/* ITEMS */}
                <td className="px-5 py-3 font-medium">
                  <div className="space-y-1">
                    {req.items?.slice(0, 2).map((item) => (
                      <div key={item._id}>
                        • {getItemName(item)} ({item.quantity})
                      </div>
                    ))}

                    {req.items?.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{req.items.length - 2} more
                      </div>
                    )}
                  </div>
                </td>

                <td className="px-5 py-3">{req.department}</td>
                <td className="px-5 py-3 font-semibold">{totalQty(req)}</td>
                <td className="px-5 py-3">
                  {PRIORITY_LABELS[req.priority]}
                </td>

                {/* 🔥 FIXED STATUS (NOW ACCURATE) */}
                <td className="px-5 py-3 capitalize">
  {(() => {
    const status = safeStatus(req.status);

    return (
      <span
        className={`px-2 py-1 rounded ${
          STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  })()}
</td>

                <td className="px-5 py-3">
                  <button
                    onClick={() => setSelected(req)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {selected && (
  <>
    {/* BACKDROP */}
    <div
      className="fixed inset-0 bg-black/40 z-40"
      onClick={() => setSelected(null)}
    />

    {/* PANEL */}
    <div className="fixed right-0 top-0 w-full max-w-md h-full bg-white shadow-xl flex flex-col z-50">

      {/* HEADER */}
      <div className="relative p-4 border-b bg-slate-700 text-white">

        <h2 className="font-semibold">Request Details</h2>

        {/* CLOSE BUTTON */}
        <button
          onClick={() => setSelected(null)}
          className="absolute right-3 top-3 text-white hover:bg-white/10 p-1 rounded"
        >
          ✕
        </button>
      </div>

      {/* INFO HEADER */}
      <div className="p-4 border-b bg-gray-50 space-y-2 text-sm">

        <div>
          <span className="text-gray-500">Requested By:</span>{" "}
          <span className="font-semibold">
            {selected.user?.name || "Unknown"}
          </span>
        </div>

        <div>
          <span className="text-gray-500">Department:</span>{" "}
          <span className="font-semibold">
            {selected.department || "N/A"}
          </span>
        </div>

        <div>
          <span className="text-gray-500">Required Date:</span>{" "}
          <span className="font-semibold">
            {selected.requiredDate
              ? new Date(selected.requiredDate).toLocaleDateString("en-GB")
              : "N/A"}
          </span>
        </div>
      </div>

      {/* ITEMS */}
      <div className="p-4 space-y-4 overflow-y-auto">

        {editItems.map((item) => (
          <div key={item._id} className="border rounded p-3 space-y-2">

            <div className="font-semibold">
              {getItemName(item)}
            </div>

            <div className="text-sm text-gray-500">
              Requested: {item.quantity}
            </div>

            <div className="text-xs">
              Status:{" "}
              <span className="font-semibold">
                {item.itemStatus || "pending"}
              </span>
            </div>

            {!item.itemStatus || item.itemStatus === "pending" ? (
              <input
                type="number"
                className="border w-full p-1 mt-1"
                placeholder="Approve qty"
                onChange={(e) =>
                  updateTempQty(item._id, e.target.value)
                }
              />
            ) : null}

            <div className="flex gap-2 mt-2">

  {/* APPROVE BUTTON */}
  <button
    disabled={item.itemStatus === "approved" || item.itemStatus === "rejected"}
    onClick={() => approveItem(item._id)}
    className={`px-2 py-1 rounded text-sm text-white ${
      item.itemStatus === "approved" || item.itemStatus === "rejected"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700"
    }`}
  >
    Approve
  </button>

  {/* REJECT BUTTON */}
  <button
    disabled={item.itemStatus === "approved" || item.itemStatus === "rejected"}
    onClick={() => rejectItem(item._id)}
    className={`px-2 py-1 rounded text-sm text-white ${
      item.itemStatus === "approved" || item.itemStatus === "rejected"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-red-600 hover:bg-red-700"
    }`}
  >
    Reject
  </button>

</div>
          </div>
        ))}

      </div>
    </div>
  </>
)}
  
    </div>
  );
}