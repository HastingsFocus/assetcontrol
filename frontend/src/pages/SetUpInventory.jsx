import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function SetupInventory() {
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([
    {
      _id: null,
      itemType: "",
      conditions: { good: 0, fair: 0, poor: 0 },
    },
  ]);

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // =========================
  // 🔥 LOAD DATA
  // =========================
  useEffect(() => {
    fetchTypes();
    loadExistingInventory();
  }, []);

  // =========================
  // 🔥 FETCH ITEM TYPES
  // =========================
  const fetchTypes = async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch item types", err);
    }
  };

  // =========================
  // 🔥 LOAD EXISTING INVENTORY
  // =========================
  const loadExistingInventory = async () => {
    try {
      const res = await API.get("/items/my-inventory");

      if (res.data.length > 0) {
        const formatted = res.data.map((item) => ({
          _id: item._id, // 🔥 IMPORTANT
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
      console.error("❌ Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ➕ ADD ITEM ROW
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
  // 🔢 TOTAL CALCULATION
  // =========================
  const getTotal = (conditions) => {
    return (
      (conditions.good || 0) +
      (conditions.fair || 0) +
      (conditions.poor || 0)
    );
  };

  // =========================
  // 🚫 VALIDATIONS
  // =========================
  const selectedIds = items.map((i) => i.itemType);
  const hasDuplicate =
    new Set(selectedIds).size !== selectedIds.length;

  const hasInvalid = items.some((item) => {
    if (!item.itemType) return true;
    return getTotal(item.conditions) === 0;
  });

  // =========================
  // 🔥 SUBMIT (FIXED)
  // =========================
  const submit = async () => {
    if (hasDuplicate) {
      alert("Duplicate items not allowed");
      return;
    }

    if (hasInvalid) {
      alert("Each item must have at least 1 quantity");
      return;
    }

    try {
      await Promise.all(
        items.map((item) => {
          if (item._id) {
            // 🔥 UPDATE EXISTING ITEM
            return API.put(`/items/my-item/${item._id}`, {
              itemType: item.itemType,
              conditions: item.conditions,
            });
          } else {
            // 🔥 CREATE NEW ITEM
            return API.post("/items/setup", {
              items: [
                {
                  itemType: item.itemType,
                  conditions: item.conditions,
                },
              ],
            });
          }
        })
      );

      alert("Inventory saved successfully");

      const updatedUser = JSON.parse(localStorage.getItem("user"));
      updatedUser.inventorySetupComplete = true;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to save inventory");
    }
  };

  // =========================
  // 🔄 LOADING
  // =========================
  if (loading) {
    return <p style={{ padding: 20 }}>Loading inventory...</p>;
  }

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: 20 }}>
      <h2>Inventory Setup - {user?.department}</h2>

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
          {/* ITEM TYPE */}
          <select
            value={item.itemType}
            onChange={(e) => updateItemType(index, e.target.value)}
          >
            <option value="">Select Item</option>
            {itemTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <br /><br />

          {/* CONDITIONS */}
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

          {/* TOTAL */}
          <strong>Total: {getTotal(item.conditions)}</strong>
        </div>
      ))}

      <button onClick={addItem}>+ Add Item</button>

      <br /><br />

      <button onClick={submit} disabled={hasDuplicate || hasInvalid}>
        💾 Save Inventory
      </button>

      {hasDuplicate && (
        <p style={{ color: "red" }}>Duplicate items not allowed</p>
      )}

      {hasInvalid && (
        <p style={{ color: "red" }}>
          Each item must have at least 1 quantity
        </p>
      )}
    </div>
  );
}