import { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function RequisitionForm() {
  const { user } = useAuth();

  const [itemTypes, setItemTypes] = useState([]);
  const [itemLibrary, setItemLibrary] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    requiredDate: "",
    remarks: "",
    priority: "important",
    items: [],
  });

  const minFutureDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const fetchLibrary = async () => {
    try {
      const res = await API.get("/items/my-library");
      setItemLibrary(res.data);
    } catch {
      toast.error("Failed to load reusable items");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          API.get("/items/types").then(res => setItemTypes(res.data)),
          fetchLibrary(),
        ]);
      } catch {
        toast.error("Failed to load items");
      }
    };

    if (user) load();
  }, [user]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // =========================
  // SYSTEM ITEMS (ItemType)
  // =========================
  const updateSystemItem = (itemTypeId, value) => {
    setForm(prev => {
      let items = [...prev.items];

      const index = items.findIndex(i => i.itemType === itemTypeId);

      if (!value || value <= 0) {
        items = items.filter(i => i.itemType !== itemTypeId);
      } else if (index !== -1) {
        items[index].quantity = Number(value);
      } else {
        items.push({
          itemType: itemTypeId,
          customItemName: null,
          libraryId: null,
          quantity: Number(value),
          description: "",
        });
      }

      return { ...prev, items };
    });
  };

  // =========================
  // REUSABLE ITEMS (Library)
  // =========================
  const updateLibraryItem = (libraryId, name, value) => {
    setForm(prev => {
      let items = [...prev.items];

      const index = items.findIndex(i => i.libraryId === libraryId);

      if (!value || value <= 0) {
        items = items.filter(i => i.libraryId !== libraryId);
      } else if (index !== -1) {
        items[index].quantity = Number(value);
      } else {
        items.push({
          itemType: null,
          customItemName: name,
          libraryId,
          quantity: Number(value),
          description: "",
        });
      }

      return { ...prev, items };
    });
  };

  // =========================
  // CUSTOM ITEMS
  // =========================
  const addCustom = () => {
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemType: null,
          customItemName: "",
          libraryId: null,
          quantity: 1,
          description: "",
        },
      ],
    }));
  };

  const updateCustomItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm(prev => ({ ...prev, items }));
  };

  const removeItem = (index) => {
    const items = [...form.items];
    items.splice(index, 1);
    setForm(prev => ({ ...prev, items }));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    if (!form.requiredDate) return toast.error("Select required date");

    const today = new Date();
    today.setHours(0,0,0,0);

    const selected = new Date(form.requiredDate);

    if (selected <= today)
      return toast.error("Date must be in future");

    if (form.items.length === 0)
      return toast.error("Add at least one item");

    for (const item of form.items) {
      if (!item.quantity || item.quantity <= 0)
        return toast.error("Invalid quantity");

      if (!item.itemType && !item.customItemName)
        return toast.error("Item name required");
    }

    try {
      setLoading(true);

      await API.post("/requests", {
        requiredDate: form.requiredDate,
        remarks: form.remarks,
        priority: form.priority,
        items: form.items,
      });

      toast.success("Requisition submitted 🚀");

      setForm({
        requiredDate: "",
        remarks: "",
        priority: "important",
        items: [],
      });

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================
  const selectedCount = form.items.length;
  const customItems = form.items
    .map((item, index) => ({ ...item, index }))
    .filter((i) => !i.itemType && !i.libraryId);

  const inputClass =
    "w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white shadow-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition";

  return (
    <div className="space-y-6 animate-[fadeIn_.3s_ease-out]">

      {/* INTRO */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">New Requisition</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Choose your items, set a required date and submit for approval.
        </p>
      </div>

      {/* REQUEST DETAILS */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 ring-1 ring-zinc-100 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          Request Details
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Required Date
            </label>
            <input
              type="date"
              min={minFutureDate}
              value={form.requiredDate}
              onChange={(e) => setField("requiredDate", e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setField("priority", e.target.value)}
              className={inputClass}
            >
              <option value="very_important">Very Important</option>
              <option value="important">Important</option>
              <option value="not_important">Not Important</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Remarks <span className="text-zinc-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => setField("remarks", e.target.value)}
            placeholder="Any additional notes for the approver…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* CATALOGUE ITEMS */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 ring-1 ring-zinc-100 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 mb-4">
          Catalogue Items
        </h3>

        {itemTypes.length === 0 && itemLibrary.length === 0 ? (
          <p className="text-sm text-zinc-400 py-2">No catalogue items available.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {/* SYSTEM ITEMS */}
            {itemTypes.map((item) => {
              const existing = form.items.find((i) => i.itemType === item._id);
              const active = !!existing?.quantity;
              return (
                <div
                  key={item._id}
                  className={`flex items-center justify-between gap-3 border rounded-xl p-3.5 transition ${
                    active
                      ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-200"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800 truncate">{item.name}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      System
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={existing?.quantity || ""}
                    onChange={(e) => updateSystemItem(item._id, e.target.value)}
                    className="w-20 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition"
                  />
                </div>
              );
            })}

            {/* REUSABLE ITEMS */}
            {itemLibrary.map((item) => {
              const existing = form.items.find((i) => i.libraryId === item._id);
              const active = !!existing?.quantity;
              return (
                <div
                  key={item._id}
                  className={`flex items-center justify-between gap-3 border rounded-xl p-3.5 transition ${
                    active
                      ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                      : "border-emerald-200/70 bg-emerald-50/40 hover:border-emerald-300"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800 truncate">{item.name}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      Reusable
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={existing?.quantity || ""}
                    onChange={(e) => updateLibraryItem(item._id, item.name, e.target.value)}
                    className="w-20 border border-emerald-200 rounded-lg px-2 py-1.5 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CUSTOM ITEMS */}
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 ring-1 ring-zinc-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Custom Items
          </h3>
          <button
            onClick={addCustom}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg shadow-sm shadow-blue-900/15 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        {customItems.length === 0 ? (
          <p className="text-sm text-zinc-400 py-2">
            Need something not in the catalogue? Add a custom item.
          </p>
        ) : (
          <div className="space-y-3">
            {customItems.map((item) => (
              <div
                key={item.index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 border border-zinc-200 rounded-xl p-4 bg-zinc-50/40"
              >
                <input
                  placeholder="Item name"
                  value={item.customItemName}
                  onChange={(e) =>
                    updateCustomItem(item.index, "customItemName", e.target.value)
                  }
                  className={`sm:col-span-4 ${inputClass}`}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateCustomItem(item.index, "quantity", Number(e.target.value))
                  }
                  className={`sm:col-span-2 ${inputClass}`}
                />
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateCustomItem(item.index, "description", e.target.value)
                  }
                  className={`sm:col-span-5 ${inputClass}`}
                />
                <button
                  onClick={() => removeItem(item.index)}
                  title="Remove item"
                  className="sm:col-span-1 inline-flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg py-2.5 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT BAR */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-t from-zinc-100 via-zinc-100/95 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-800">{selectedCount}</span>{" "}
            item{selectedCount !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/20 transition"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 13l4 4L19 7" />
                </svg>
                Submit Requisition
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}