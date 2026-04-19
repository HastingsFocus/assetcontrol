import { useEffect, useState } from "react";
import API from "../services/api";

export default function SetupInventory() {
  const [itemTypes, setItemTypes] = useState([]);
  const [items, setItems] = useState([
    { itemType: "", quantity: 1, condition: "good" }
  ]);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    const res = await API.get("/items/types");
    setItemTypes(res.data);
  };

  const addItem = () => {
    setItems([...items, { itemType: "", quantity: 1, condition: "good" }]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const selectedIds = items.map(i => i.itemType);
  const hasDuplicate = new Set(selectedIds).size !== selectedIds.length;

  const submit = async () => {
    if (hasDuplicate) {
      alert("Duplicate items not allowed");
      return;
    }

    await API.post("/items/setup", { items });
    alert("Inventory saved successfully");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Setup Inventory - {user?.department}</h2>

      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 10 }}>
          
          {/* ITEM TYPE (FILTERED BY BACKEND) */}
          <select
            value={item.itemType}
            onChange={(e) => updateItem(index, "itemType", e.target.value)}
          >
            <option value="">Select Item</option>
            {itemTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", e.target.value)}
          />

          <select
            value={item.condition}
            onChange={(e) => updateItem(index, "condition", e.target.value)}
          >
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      ))}

      <button onClick={addItem}>+ Add Item</button>

      <br /><br />

      <button onClick={submit} disabled={hasDuplicate}>
        Submit Inventory
      </button>

      {hasDuplicate && (
        <p style={{ color: "red" }}>
          Duplicate items not allowed
        </p>
      )}
    </div>
  );
}