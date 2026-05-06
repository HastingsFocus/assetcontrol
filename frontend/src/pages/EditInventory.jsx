import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    fetchInventory();
    fetchTypes();

    const handleUpdate = () => fetchInventory();
    socket.on("inventoryUpdated", handleUpdate);
    return () => socket.off("inventoryUpdated", handleUpdate);
  }, [authLoading, user]);

  const fetchInventory = async () => {
    try {
      const res = await API.get("/items/my-inventory");
      setItems(res.data);
    } catch (err) {
      console.log("Error loading inventory", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      { _id: null, itemType: "", conditions: { good: 0, fair: 0, poor: 0 } },
    ]);
  };

  const handleItemTypeChange = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], itemType: value };
      return updated;
    });
  };

  const handleConditionChange = (index, type, value) => {
    setItems((prev) => {
      const updated = [...prev];
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
      toast.error("Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await API.delete(`/items/my-item/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success("Item deleted");
    } catch (err) {
      console.log(err);
      toast.error("Delete failed");
    }
  };

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

      {/* Header */}
      <div className="shrink-0 bg-gradient-to-r from-slate-700 via-slate-700 to-slate-600 text-white px-6 py-4 border-b border-slate-500/30">
        <div className="max-w-2xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </button>
          <div className="hidden h-10 w-px shrink-0 bg-white/20 sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100/90 mb-1">
              St. Joseph's College
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Manage Inventory</h1>
            <p className="text-zinc-300 text-sm mt-0.5">{user?.department || "Your Department"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
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

              return (
                <div key={item._id || index} className="bg-white rounded-2xl border border-zinc-200/90 shadow-md shadow-zinc-900/6 overflow-hidden ring-1 ring-zinc-100">

                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                    <span className="text-sm font-semibold text-zinc-600">
                      {item.itemType?.name || item.itemType || `Item ${index + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 font-medium">Total: {total}</span>
                      {item._id && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-400 hover:text-red-600 transition"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                        className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition"
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
                              className="w-full bg-white border border-current/20 rounded-md px-2 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-current"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save button */}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add item */}
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
