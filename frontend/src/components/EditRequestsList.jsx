import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../socket";
import { toast } from "react-toastify";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  completed: "bg-zinc-100 text-zinc-600 border border-zinc-200",
  revoked: "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

export default function EditRequestsList() {
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [decidingId, setDecidingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await API.get("/edit-access");
      setRequests(res.data || []);
    } catch (err) {
      console.log("❌ Fetch edit requests error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Refresh when a new edit request arrives in real-time.
    const handleNotification = (data) => {
      if (data?.type === "edit_access_requested") {
        fetchRequests();
      }
    };
    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [fetchRequests]);

  const decide = async (id, status) => {
    try {
      setDecidingId(id);
      await API.put(`/edit-access/${id}`, { status });
      toast.success(
        status === "approved" ? "Edit access approved" : "Edit access rejected"
      );
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setDecidingId(null);
    }
  };

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const filtered =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-zinc-500 text-sm">Loading edit requests...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "pending", label: "Pending" },
          { key: "approved", label: "Approved" },
          { key: "completed", label: "Completed" },
          { key: "rejected", label: "Rejected" },
          { key: "all", label: "All" },
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
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filterStatus === f.key
                  ? "bg-blue-200/80 text-blue-900"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {counts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 overflow-hidden ring-1 ring-zinc-100">
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-zinc-500">No edit requests found</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {filtered.map((r) => {
              const isDeciding = decidingId === r._id;
              return (
                <li key={r._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-zinc-800">
                          {r.user?.name || "Unknown user"}
                        </p>
                        <span className="text-xs text-zinc-400">
                          {r.user?.email}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            STATUS_STYLES[r.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        Department:{" "}
                        <span className="font-medium text-zinc-700">
                          {r.department || "—"}
                        </span>
                      </p>
                      {r.reason && (
                        <p className="text-sm text-zinc-600 mt-2 italic">
                          &ldquo;{r.reason}&rdquo;
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-400 mt-1.5">
                        Requested {new Date(r.createdAt).toLocaleString()}
                        {r.decidedAt && (
                          <>
                            {" "}
                            · Decided{" "}
                            {new Date(r.decidedAt).toLocaleString()}
                            {r.decidedBy?.name ? ` by ${r.decidedBy.name}` : ""}
                          </>
                        )}
                      </p>
                    </div>

                    {r.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => decide(r._id, "approved")}
                          disabled={isDeciding}
                          className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => decide(r._id, "rejected")}
                          disabled={isDeciding}
                          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
