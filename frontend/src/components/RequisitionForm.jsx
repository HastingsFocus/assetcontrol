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
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-5xl space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-3xl font-bold">New Requisition</h1>

          <input
            type="date"
            min={minFutureDate}
            value={form.requiredDate}
            onChange={e => setField("requiredDate", e.target.value)}
            className="w-full border rounded-xl p-3 mt-4"
          />

          <select
            value={form.priority}
            onChange={e => setField("priority", e.target.value)}
            className="w-full border rounded-xl p-3 mt-4"
          >
            <option value="very_important">Very Important</option>
            <option value="important">Important</option>
            <option value="not_important">Not Important</option>
          </select>
        </div>

        {/* ITEMS */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Items</h2>

          <div className="grid md:grid-cols-2 gap-4">

            {/* SYSTEM ITEMS */}
            {itemTypes.map(item => {
              const existing = form.items.find(i => i.itemType === item._id);

              return (
                <div key={item._id} className="border p-4 rounded-xl flex justify-between">
                  <p>{item.name} <span className="text-xs text-gray-400">System</span></p>

                  <input
                    type="number"
                    min="0"
                    value={existing?.quantity || ""}
                    onChange={e => updateSystemItem(item._id, e.target.value)}
                    className="w-24 border p-2 rounded"
                  />
                </div>
              );
            })}

            {/* REUSABLE ITEMS */}
            {itemLibrary.map(item => {
              const existing = form.items.find(i => i.libraryId === item._id);

              return (
                <div key={item._id} className="border bg-green-50 p-4 rounded-xl flex justify-between">
                  <p>{item.name} <span className="text-xs text-green-600">Reusable</span></p>

                  <input
                    type="number"
                    min="0"
                    value={existing?.quantity || ""}
                    onChange={e => updateLibraryItem(item._id, item.name, e.target.value)}
                    className="w-24 border p-2 rounded"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOM ITEMS */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between mb-4">
            <h2 className="font-semibold">Custom Items</h2>

            <button
              onClick={addCustom}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {form.items
              .map((item, index) => ({ ...item, index }))
              .filter(i => !i.itemType && !i.libraryId)
              .map(item => (
                <div key={item.index} className="grid md:grid-cols-4 gap-3 border p-4 rounded-xl">

                  <input
                    placeholder="Item name"
                    value={item.customItemName}
                    onChange={e =>
                      updateCustomItem(item.index, "customItemName", e.target.value)
                    }
                    className="border p-2 rounded"
                  />

                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e =>
                      updateCustomItem(item.index, "quantity", Number(e.target.value))
                    }
                    className="border p-2 rounded"
                  />

                  <input
                    placeholder="Description"
                    value={item.description}
                    onChange={e =>
                      updateCustomItem(item.index, "description", e.target.value)
                    }
                    className="border p-2 rounded"
                  />

                  <button
                    onClick={() => removeItem(item.index)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-2xl"
        >
          {loading ? "Submitting..." : "Submit Requisition"}
        </button>

      </div>
    </div>
  );
}