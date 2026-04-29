import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function SetupInventory() {
  const { user, loading: authLoading } = useAuth(); // 🔥 IMPORTANT FIX
  const navigate = useNavigate();

  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([
    {
      _id: null,
      itemType: "",
      conditions: { good: 0, fair: 0, poor: 0 },
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // =========================
  // 🔥 WAIT FOR AUTH FIRST (CRITICAL FIX)
  // =========================
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    fetchTypes();
    loadExistingInventory();
  }, [authLoading, user]);

  // =========================
  // 🔥 FETCH ITEM TYPES
  // =========================
  const fetchTypes = async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch item types");
    }
  };

  // =========================
  // 🔥 LOAD INVENTORY
  // =========================
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

  // =========================
  // ➕ ADD ITEM
  // =========================
  const addItem = () => {
    setItems([
      ...items,
      {
        _id: null,
        itemType: "",
        conditions: { good: 0, fair: 0, poor: 0 },
      },
    ]);
  };

  // =========================
  // 🔄 UPDATE ITEM TYPE
  // =========================
  const updateItemType = (index, value) => {
    const updated = [...items];
    updated[index].itemType = value;
    setItems(updated);
  };

  // =========================
  // 🔄 UPDATE CONDITIONS
  // =========================
  const updateCondition = (index, type, value) => {
    const updated = [...items];
    updated[index].conditions[type] = Number(value);
    setItems(updated);
  };

  // =========================
  // 🔢 TOTAL
  // =========================
  const getTotal = (conditions) => {
    return (
      (conditions.good || 0) +
      (conditions.fair || 0) +
      (conditions.poor || 0)
    );
  };

  // =========================
  // 🚫 VALIDATION
  // =========================
  const selectedIds = items.map((i) => i.itemType);

  const hasDuplicate =
    new Set(selectedIds.filter(Boolean)).size !==
    selectedIds.filter(Boolean).length;

  const hasInvalid = items.some((item) => {
    if (!item.itemType) return true;
    return getTotal(item.conditions) === 0;
  });

  // =========================
  // 🚀 SUBMIT
  // =========================
  const submit = async () => {
    if (hasDuplicate) {
      toast.error("Duplicate items not allowed");
      return;
    }

    if (hasInvalid) {
      toast.error("Each item must have at least 1 quantity");
      return;
    }

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

      toast.success("Inventory setup completed successfully 🚀");

      // 🔥 SAFE NAVIGATION
      navigate("/dashboard", { replace: true });

    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Failed to save inventory"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ⏳ LOADING UI (AUTH SAFE)
  // =========================
  if (authLoading || loading) {
    return <p style={{ textAlign: "center" }}>Loading inventory...</p>;
  }

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h2>
        Inventory Setup - {user?.department || "Department"}
      </h2>

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 15,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 5,
          }}
        >
          <select
            value={item.itemType}
            onChange={(e) =>
              updateItemType(index, e.target.value)
            }
          >
            <option value="">Select Item</option>
            {itemTypes.map((t) => (
              <option
                key={t._id}
                value={t._id}
                disabled={items.some(
                  (i, idx) =>
                    i.itemType === t._id && idx !== index
                )}
              >
                {t.name}
              </option>
            ))}
          </select>

          <br /><br />

          <div>
            <label>Good: </label>
            <input
              type="number"
              value={item.conditions.good}
              onChange={(e) =>
                updateCondition(index, "good", e.target.value)
              }
            />

            <label style={{ marginLeft: 10 }}>Fair: </label>
            <input
              type="number"
              value={item.conditions.fair}
              onChange={(e) =>
                updateCondition(index, "fair", e.target.value)
              }
            />

            <label style={{ marginLeft: 10 }}>Poor: </label>
            <input
              type="number"
              value={item.conditions.poor}
              onChange={(e) =>
                updateCondition(index, "poor", e.target.value)
              }
            />
          </div>

          <br />
          <strong>Total: {getTotal(item.conditions)}</strong>
        </div>
      ))}

      <button onClick={addItem}>+ Add Item</button>

      <br /><br />

      <button
        onClick={submit}
        disabled={hasDuplicate || hasInvalid || saving}
      >
        {saving ? "Saving..." : "💾 Save Inventory"}
      </button>
    </div>
  );
}