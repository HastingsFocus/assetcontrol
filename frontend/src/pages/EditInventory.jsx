import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function EditInventory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Edit-access state. `null` = no active request, otherwise the request object.
  const [editAccess, setEditAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);

  // Whether the user currently has live items in inventory.
  const hasItems = items.some((i) => i._id);

  // Four banner modes (display only):
  //   firstSetup → user has no items yet
  //   approved   → admin granted edit access
  //   pending    → request waiting on admin
  //   locked     → has items, no access
  const mode = !hasItems
    ? "firstSetup"
    : editAccess?.status === "approved"
    ? "approved"
    : editAccess?.status === "pending"
    ? "pending"
    : "locked";

  // Existing items can only be edited/deleted when first-setup or after approval.
  // Adding NEW items is always allowed.
  const canEditExisting = mode === "firstSetup" || mode === "approved";

  // =========================
  // FETCH HELPERS
  // =========================
  const fetchInventory = useCallback(async () => {
    try {
      const res = await API.get("/items/my-inventory");
      setItems(res.data);
    } catch (err) {
      console.log("Error loading inventory", err);
    }
  }, []);

  const fetchEditAccess = useCallback(async () => {
    try {
      const res = await API.get("/edit-access/my");
      setEditAccess(res.data?.editRequest || null);
    } catch (err) {
      console.log("Error loading edit access", err);
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    (async () => {
      await Promise.all([fetchInventory(), fetchTypes(), fetchEditAccess()]);
      setLoading(false);
    })();

    const handleInventoryUpdate = () => fetchInventory();
    socket.on("inventoryUpdated", handleInventoryUpdate);

    // React to admin decisions in real-time.
    const handleNotification = (data) => {
      if (data?.type === "edit_access_decided") {
        fetchEditAccess();
      }
    };
    socket.on("notification", handleNotification);

    return () => {
      socket.off("inventoryUpdated", handleInventoryUpdate);
      socket.off("notification", handleNotification);
    };
  }, [authLoading, user, fetchInventory, fetchTypes, fetchEditAccess]);

  // =========================
  // EDIT-ACCESS ACTIONS
  // =========================
  const requestEditAccess = async () => {
    try {
      setAccessLoading(true);
      const res = await API.post("/edit-access");
      setEditAccess(res.data.editRequest);
      toast.success("Edit request sent to admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request edit access");
    } finally {
      setAccessLoading(false);
    }
  };

  const finishEditing = async () => {
    try {
      setAccessLoading(true);
      await API.post("/edit-access/done");
      setEditAccess(null);
      toast.success("Inventory locked");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to lock inventory");
    } finally {
      setAccessLoading(false);
    }
  };

  // =========================
  // ITEM ACTIONS
  // =========================
  // Adding new items is always permitted — only existing-item edits are gated.
  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      { _id: null, itemType: "", conditions: { good: 0, fair: 0, poor: 0 } },
    ]);
  };

  // Local edits to a draft (non-persisted) row are always allowed.
  // Edits to a saved (persisted) row require canEditExisting.
  const handleItemTypeChange = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index]._id && !canEditExisting) return prev;
      updated[index] = { ...updated[index], itemType: value };
      return updated;
    });
  };

  const handleConditionChange = (index, type, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (updated[index]._id && !canEditExisting) return prev;
      updated[index] = {
        ...updated[index],
        conditions: {
          ...updated[index].conditions,
          [type]: Number(value),
        },
      };
      return updated;
    });
  };

  const handleUpdate = async (item, index) => {
    // New items: always allowed. Existing items: needs canEditExisting.
    if (item._id && !canEditExisting) return;

    try {
      setSavingId(item._id || `new-${index}`);

      if (!item._id) {
        await API.post("/items/my-item", {
          itemType: item.itemType,
          conditions: item.conditions,
        });
        toast.success("Item added successfully");
        fetchInventory();
        return;
      }

      await API.put(`/items/my-item/${item._id}`, {
        itemType: item.itemType?._id || item.itemType,
        conditions: item.conditions,
      });

      toast.success("Item updated");
      fetchInventory();
    } catch (err) {
      console.log(err);
      // Surface lock errors clearly (e.g. if access was revoked mid-edit).
      if (err.response?.data?.locked) {
        toast.error(err.response.data.message);
        fetchEditAccess();
      } else {
        toast.error(err.response?.data?.message || "Save failed");
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!canEditExisting) return;
    if (!window.confirm("Delete this item?")) return;
    try {
      await API.delete(`/items/my-item/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success("Item deleted");
    } catch (err) {
      console.log(err);
      if (err.response?.data?.locked) {
        toast.error(err.response.data.message);
        fetchEditAccess();
      } else {
        toast.error(err.response?.data?.message || "Delete failed");
      }
    }
  };

  // Drop a draft (un-persisted) row from the local list.
  const removeDraftItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================
  // RENDER
  // =========================
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-500 text-sm">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
     

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
          {/* Edit access banner */}
          <AccessBanner
            mode={mode}
            editAccess={editAccess}
            onRequest={requestEditAccess}
            onFinish={finishEditing}
            loading={accessLoading}
          />

          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 font-medium">No inventory items found</p>
              <p className="text-zinc-400 text-sm mt-1">Add your first item below</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {items.map((item, index) => {
                const total =
                  (item.conditions?.good || 0) +
                  (item.conditions?.fair || 0) +
                  (item.conditions?.poor || 0);
                const isSaving = savingId === (item._id || `new-${index}`);
                const isDraft = !item._id;
                // A row is interactive if it's a brand-new draft, or
                // if it's an existing item AND the user has edit access.
                const rowEditable = isDraft || canEditExisting;

                return (
                  <div
                    key={item._id || index}
                    className={`bg-white rounded-2xl border border-zinc-200/90 shadow-md shadow-zinc-900/6 overflow-hidden ring-1 ring-zinc-100 ${
                      !rowEditable ? "opacity-90" : ""
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-600">
                          {item.itemType?.name || item.itemType || `Item ${index + 1}`}
                        </span>
                        {isDraft && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-medium">Total: {total}</span>
                        {isDraft ? (
                          <button
                            onClick={() => removeDraftItem(index)}
                            className="text-zinc-400 hover:text-zinc-600 transition"
                            title="Discard new item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ) : (
                          canEditExisting && (
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-400 hover:text-red-600 transition"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Item type */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Item Type</label>
                        <select
                          value={item.itemType?._id || item.itemType || ""}
                          onChange={(e) => handleItemTypeChange(index, e.target.value)}
                          disabled={!rowEditable}
                          className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed"
                        >
                          <option value="">Select item type...</option>
                          {itemTypes.map((t) => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Conditions */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2 text-center">Condition Breakdown</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { key: "good", label: "Good", color: "text-green-700 border-green-300 bg-green-50" },
                            { key: "fair", label: "Fair", color: "text-amber-700 border-amber-300 bg-amber-50" },
                            { key: "poor", label: "Poor", color: "text-red-700 border-red-300 bg-red-50" },
                          ].map((cond) => (
                            <div key={cond.key} className={`border rounded-lg p-3 text-center ${cond.color}`}>
                              <label className="block text-center text-xs font-semibold mb-1.5 uppercase">{cond.label}</label>
                              <input
                                type="number"
                                min="0"
                                value={item.conditions?.[cond.key] ?? 0}
                                onChange={(e) => handleConditionChange(index, cond.key, e.target.value)}
                                disabled={!rowEditable}
                                className="w-full bg-white border border-current/20 rounded-md px-2 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-current disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save button (only when this row is editable) */}
                      {rowEditable && (
                        <button
                          onClick={() => handleUpdate(item, index)}
                          disabled={isSaving}
                          className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg shadow-lg shadow-slate-900/20 transition flex items-center justify-center gap-2"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                              </svg>
                              {item._id ? "Update Item" : "Save New Item"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add item — always available */}
          <button
            onClick={addNewItem}
            className="w-full border-2 border-dashed border-zinc-200 hover:border-slate-400/70 text-zinc-500 hover:text-slate-800 rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2 bg-white/60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Banner that explains the current edit-access state and offers
// the primary action: Request, Awaiting, or Finish editing.
// ============================================================
function AccessBanner({ mode, editAccess, onRequest, onFinish, loading }) {
  if (mode === "firstSetup") {
    return (
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-900">
          You haven&apos;t added any inventory yet. Add your items below — you can always add new items later,
          but editing or removing saved items will require admin approval.
        </p>
      </div>
    );
  }

  if (mode === "approved") {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50/90 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-900">Edit access granted</p>
            <p className="text-xs text-green-800/80 mt-0.5">
              You can now edit or delete existing items. Click &quot;Done Editing&quot; when finished to lock them again.
            </p>
          </div>
        </div>
        <button
          onClick={onFinish}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Done Editing
        </button>
      </div>
    );
  }

  if (mode === "pending") {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">Awaiting admin approval</p>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Edits to existing items are paused
              {editAccess?.createdAt
                ? ` since ${new Date(editAccess.createdAt).toLocaleString()}`
                : ""}
              . You can still add new items in the meantime.
            </p>
          </div>
        </div>
        <button
          disabled
          className="shrink-0 bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-2 rounded-lg cursor-not-allowed"
        >
          Pending
        </button>
      </div>
    );
  }

  // mode === "locked"
  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Existing items are locked</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            You can still add new items below. To edit or delete saved items, request admin approval.
          </p>
        </div>
      </div>
      <button
        onClick={onRequest}
        disabled={loading}
        className="shrink-0 inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {loading ? "Sending..." : "Request Edit"}
      </button>
    </div>
  );
}
