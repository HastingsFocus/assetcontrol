import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function SetupInventory() {
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([
    {
      itemType: "",
      conditions: { good: 0, fair: 0, poor: 0 }
    }
  ]);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const res = await API.get("/items/types");
    setItemTypes(res.data);
  };

  // ➕ Add row
  const addItem = () => {
    setItems([
      ...items,
      { itemType: "", conditions: { good: 0, fair: 0, poor: 0 } }
    ]);
  };

  // 🔄 Update itemType
  const updateItemType = (index, value) => {
    const updated = [...items];
    updated[index].itemType = value;
    setItems(updated);
  };

  // 🔄 Update conditions
  const updateCondition = (index, type, value) => {
    const updated = [...items];
    updated[index].conditions[type] = Number(value);
    setItems(updated);
  };

  // 🔢 Calculate total
  const getTotal = (conditions) => {
    return (
      (conditions.good || 0) +
      (conditions.fair || 0) +
      (conditions.poor || 0)
    );
  };

  // 🚫 duplicate protection
  const selectedIds = items.map(i => i.itemType);
  const hasDuplicate =
    new Set(selectedIds).size !== selectedIds.length;

  const hasInvalid = items.some((item) => {
  if (!item.itemType) return true; // must select item

  const total = getTotal(item.conditions);

  return total === 0; // only reject if ALL are zero
});
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
    await API.post("/items/setup", { items });

    alert("Inventory saved successfully");

    const user = JSON.parse(localStorage.getItem("user"));
    user.inventorySetupComplete = true;
    localStorage.setItem("user", JSON.stringify(user));

    navigate("/dashboard");
  } catch (error) {
    alert(error.response?.data?.message || "Failed to save inventory");
  }
};

  return (
    <div style={{ padding: 20 }}>
      <h2>Setup Inventory - {user?.department}</h2>

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 15,
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 5
          }}
        >
          {/* ITEM TYPE */}
          <select
            value={item.itemType}
            onChange={(e) =>
              updateItemType(index, e.target.value)
            }
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

          {/* 🔥 LIVE TOTAL */}
          <strong>
            Total: {getTotal(item.conditions)}
          </strong>
        </div>
      ))}

      <button onClick={addItem}>+ Add Item</button>

      <br /><br />

      <button onClick={submit} disabled={hasDuplicate || hasInvalid}>
        Submit Inventory
      </button>

      {hasDuplicate && (
        <p style={{ color: "red" }}>
          Duplicate items not allowed
        </p>
      )}

      {hasInvalid && (
  <p style={{ color: "red" }}>
    Each item must have at least 1 quantity (any condition)
  </p>
)}
    </div>
  );
}