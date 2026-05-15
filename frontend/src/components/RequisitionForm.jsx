import { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function RequisitionForm() {
  const { user } = useAuth();

  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    requiredDate: "",
    remarks: "",
    priority: "important",
    items: [],
  });

  /* =========================
     MIN DATE
  ========================= */
  const minFutureDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  /* =========================
     PRIORITY LABELS
  ========================= */
  const PRIORITY_OPTIONS = [
    {
      value: "very_important",
      label: "Very Important",
    },
    {
      value: "important",
      label: "Important",
    },
    {
      value: "not_important",
      label: "Not Important",
    },
  ];

  /* =========================
     FETCH ITEMS
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/items/types");
        setItemTypes(res.data);
      } catch {
        toast.error("Failed to load items");
      }
    };

    if (user) load();
  }, [user]);

  /* =========================
     UPDATE FORM
  ========================= */
  const setField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* =========================
     PREDEFINED ITEMS
  ========================= */
  const updatePredefined = (itemTypeId, value) => {
    setForm((prev) => {
      let items = [...prev.items];

      const index = items.findIndex(
        (i) => i.itemType === itemTypeId
      );

      // REMOVE ITEM
      if (!value || value <= 0) {
        items = items.filter(
          (i) => i.itemType !== itemTypeId
        );
      }

      // UPDATE EXISTING
      else if (index !== -1) {
        items[index].quantity = Number(value);
      }

      // ADD NEW
      else {
        items.push({
          itemType: itemTypeId,
          customItemName: null,
          quantity: Number(value),
          description: "",
        });
      }

      return {
        ...prev,
        items,
      };
    });
  };

  /* =========================
     ADD CUSTOM ITEM
  ========================= */
  const addCustom = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemType: null,
          customItemName: "",
          quantity: 1,
          description: "",
        },
      ],
    }));
  };

  /* =========================
     UPDATE ITEM
  ========================= */
  const updateItem = (index, field, value) => {
    const items = [...form.items];

    items[index][field] = value;

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  /* =========================
     REMOVE ITEM
  ========================= */
  const removeItem = (index) => {
    const items = [...form.items];

    items.splice(index, 1);

    setForm((prev) => ({
      ...prev,
      items,
    }));
  };

  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = async () => {
    if (!form.requiredDate) {
      return toast.error("Select required date");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(form.requiredDate);

    if (selectedDate <= today) {
      return toast.error("Date must be in the future");
    }

    if (form.items.length === 0) {
      return toast.error("Add at least one item");
    }

    for (const item of form.items) {
      if (!item.quantity || item.quantity <= 0) {
        return toast.error("Invalid quantity");
      }

      if (!item.itemType && !item.customItemName) {
        return toast.error("Custom item name required");
      }
    }

    const cleanedItems = form.items.map((item) => ({
      itemType: item.itemType || null,
      customItemName: item.customItemName || null,
      quantity: item.quantity,
      description: item.description || "",
    }));

    try {
      setLoading(true);

      await API.post("/requests", {
        requiredDate: form.requiredDate,
        remarks: form.remarks,
        priority: form.priority, // 🔥 WHOLE REQUEST PRIORITY
        items: cleanedItems,
      });

      toast.success("Requisition submitted successfully 🚀");

      // RESET FORM
      setForm({
        requiredDate: "",
        remarks: "",
        priority: "important",
        items: [],
      });

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Submission failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-5xl space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h1 className="text-3xl font-bold text-gray-800">
            New Requisition
          </h1>

          {/* REQUIRED DATE */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Required Date
            </label>

            <input
              type="date"
              min={minFutureDate}
              value={form.requiredDate}
              onChange={(e) =>
                setField("requiredDate", e.target.value)
              }
              className="w-full border rounded-xl p-3"
            />
          </div>

          {/* REQUEST PRIORITY */}
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Request Priority
            </label>

            <select
              value={form.priority}
              onChange={(e) =>
                setField("priority", e.target.value)
              }
              className="w-full border rounded-xl p-3"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-500 mt-2">
              This priority applies to the whole requisition.
            </p>
          </div>
        </div>

        {/* PREDEFINED ITEMS */}
        <div className="bg-white rounded-2xl shadow p-6">

          <h2 className="text-lg font-semibold mb-4">
            Department Items
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            {itemTypes.map((item) => {
              const existing = form.items.find(
                (i) => i.itemType === item._id
              );

              return (
                <div
                  key={item._id}
                  className="border rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      Predefined Item
                    </p>
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={existing?.quantity || ""}
                    onChange={(e) =>
                      updatePredefined(
                        item._id,
                        e.target.value
                      )
                    }
                    className="w-24 border rounded-lg p-2"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* CUSTOM ITEMS */}
        <div className="bg-white rounded-2xl shadow p-6">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-lg font-semibold">
              Custom Items
            </h2>

            <button
              onClick={addCustom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-4">

            {form.items
              .map((item, index) => ({
                ...item,
                index,
              }))
              .filter((item) => !item.itemType)
              .map((item) => (
                <div
                  key={item.index}
                  className="grid md:grid-cols-4 gap-3 items-center border rounded-xl p-4"
                >

                  {/* NAME */}
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.customItemName || ""}
                    onChange={(e) =>
                      updateItem(
                        item.index,
                        "customItemName",
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-2"
                  />

                  {/* QTY */}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        item.index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded-lg p-2"
                  />

                  {/* DESCRIPTION */}
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateItem(
                        item.index,
                        "description",
                        e.target.value
                      )
                    }
                    className="border rounded-lg p-2"
                  />

                  {/* REMOVE */}
                  <button
                    onClick={() =>
                      removeItem(item.index)
                    }
                    className="text-red-600 hover:text-red-700 font-medium"
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
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-semibold text-lg"
        >
          {loading
            ? "Submitting..."
            : "Submit Requisition"}
        </button>
      </div>
    </div>
  );
}