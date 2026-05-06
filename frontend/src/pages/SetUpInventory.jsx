import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function SetupInventory() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([
    { _id: null, itemType: "", conditions: { good: 0, fair: 0, poor: 0 } },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    fetchTypes();
    loadExistingInventory();
  }, [authLoading, user]);

  const fetchTypes = async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch item types");
    }
  };

  const loadExistingInventory = async () => {
    try {
      const res = await API.get("/items/my-inventory");
      if (res.data.length > 0) {
        const formatted = res.data.map((item) => ({
          _id: item._id,
          itemType: item.itemType._id,
          conditions: {
            good: item.conditions?.good || 0,
            fair: item.conditions?.fair || 0,
            poor: item.conditions?.poor || 0,
          },
        }));
        setItems(formatted);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { _id: null, itemType: "", conditions: { good: 0, fair: 0, poor: 0 } }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemType = (index, value) => {
    const updated = [...items];
    updated[index].itemType = value;
    setItems(updated);
  };

  const updateCondition = (index, type, value) => {
    const updated = [...items];
    updated[index].conditions[type] = Number(value);
    setItems(updated);
  };

  const getTotal = (conditions) =>
    (conditions.good || 0) + (conditions.fair || 0) + (conditions.poor || 0);

  const selectedIds = items.map((i) => i.itemType);
  const hasDuplicate =
    new Set(selectedIds.filter(Boolean)).size !== selectedIds.filter(Boolean).length;
  const hasInvalid = items.some((item) => !item.itemType || getTotal(item.conditions) === 0);

  const submit = async () => {
    if (hasDuplicate) { toast.error("Duplicate items not allowed"); return; }
    if (hasInvalid) { toast.error("Each item must have at least 1 quantity"); return; }

    try {
      setSaving(true);
      const newItems = items.filter((i) => !i._id);
      const existingItems = items.filter((i) => i._id);

      await Promise.all(
        existingItems.map((item) =>
          API.put(`/items/my-item/${item._id}`, {
            itemType: item.itemType,
            conditions: item.conditions,
          })
        )
      );

      if (newItems.length > 0) {
        await API.post("/items/setup", {
          items: newItems.map((item) => ({
            itemType: item.itemType,
            conditions: item.conditions,
          })),
        });
      }

      await API.put("/settings/setup-complete");

      if (typeof refreshUser === "function") await refreshUser();

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to save inventory");
    } finally {
      setSaving(false);
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
            onClick={() => navigate(-1)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <div className="hidden h-10 w-px shrink-0 bg-white/20 sm:block" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-100/90 mb-1">
              St. Joseph's College
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Inventory Setup</h1>
            <p className="text-zinc-300 text-sm mt-0.5">
              {user?.department || "Your Department"} — record your department&apos;s current assets
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">
        {/* Info banner */}
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl px-4 py-3 mb-6 flex gap-3 shadow-sm">
          <svg className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-slate-800/90">
            Record the current condition and quantity of each asset in your department. You can add multiple items.
          </p>
        </div>

        {/* Item cards */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => {
            const total = getTotal(item.conditions);
            return (
              <div key={index} className="bg-white rounded-2xl border border-zinc-200/90 shadow-md shadow-zinc-900/6 overflow-hidden ring-1 ring-zinc-100">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                  <span className="text-sm font-semibold text-zinc-600">Item {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Item type select */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Item Type</label>
                    <select
                      value={item.itemType}
                      onChange={(e) => updateItemType(index, e.target.value)}
                      className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition"
                    >
                      <option value="">Select item type...</option>
                      {itemTypes.map((t) => (
                        <option
                          key={t._id}
                          value={t._id}
                          disabled={items.some((i, idx) => i.itemType === t._id && idx !== index)}
                        >
                          {t.name}
                        </option>
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
                            value={item.conditions[cond.key]}
                            onChange={(e) => updateCondition(index, cond.key, e.target.value)}
                            className="w-full bg-white border border-current/20 rounded-md px-2 py-1.5 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-current"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-zinc-500 mt-2">
                      Total: <span className="font-bold text-slate-800 tabular-nums">{total}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add item */}
        <button
          onClick={addItem}
          className="w-full border-2 border-dashed border-zinc-200 hover:border-slate-400/70 text-zinc-500 hover:text-slate-800 rounded-xl py-3 text-sm font-medium transition flex items-center justify-center gap-2 mb-6 bg-white/60"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Another Item
        </button>

        {/* Validation warnings */}
        {hasDuplicate && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            Duplicate items detected — each item type should appear only once.
          </div>
        )}

        {/* Save */}
        <button
          onClick={submit}
          disabled={hasDuplicate || hasInvalid || saving}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-slate-900/20 transition flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Inventory
            </>
          )}
        </button>
        </div>
      </div>
    </div>
  );
}
