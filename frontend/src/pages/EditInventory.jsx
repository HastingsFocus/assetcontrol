import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../socket";

export default function EditInventory() {
  const [items, setItems] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);

  // =========================
  // 📦 FETCH INVENTORY
  // =========================
  const fetchInventory = async () => {
    try {
      const res = await API.get("/items/my-inventory");
      setItems(res.data);
    } catch (err) {
      console.log("Error loading inventory", err);
    }
  };

  // =========================
  // 📦 FETCH ITEM TYPES
  // =========================
  const fetchTypes = async () => {
    try {
      const res = await API.get("/items/types");
      setItemTypes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // =========================
  // 🔄 INIT + SOCKET
  // =========================
  useEffect(() => {
    fetchInventory();
    fetchTypes();

    const handleUpdate = () => {
      console.log("🔄 Inventory update received (user)");
      fetchInventory();
    };

    socket.on("inventoryUpdated", handleUpdate);

    return () => {
      socket.off("inventoryUpdated", handleUpdate);
    };
  }, []);

  // =========================
  // ➕ ADD ITEM
  // =========================
  const addNewItem = () => {
    setItems((prev) => [
      ...prev,
      {
        _id: null,
        itemType: "",
        conditions: { good: 0, fair: 0, poor: 0 },
      },
    ]);
  };

  // =========================
  // 🔄 ITEM TYPE
  // =========================
  const handleItemTypeChange = (index, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].itemType = value;
      return updated;
    });
  };

  // =========================
  // 🔄 CONDITIONS
  // =========================
  const handleConditionChange = (index, type, value) => {
    setItems((prev) => {
      const updated = [...prev];

      if (!updated[index].conditions) {
        updated[index].conditions = { good: 0, fair: 0, poor: 0 };
      }

      updated[index].conditions[type] = Number(value);
      return updated;
    });
  };

  
  const handleUpdate = async (item) => {
  try {
    // 🆕 CREATE NEW ITEM
    if (!item._id) {
      await API.post("/items/my-item", {
        itemType: item.itemType,
        conditions: item.conditions,
      });

      alert("Item created successfully");
      fetchInventory();
      return;
    }

    // ✏️ UPDATE EXISTING ITEM
    await API.put(`/items/my-item/${item._id}`, {
      itemType: item.itemType?._id || item.itemType,
      conditions: item.conditions,
    });

    alert("Item updated successfully");
    fetchInventory();
  } catch (err) {
    console.log(err);
    alert("Save failed");
  }
};
  // =========================
  // 🗑️ DELETE
  // =========================
  const handleDelete = async (id) => {
    try {
      await API.delete(`/items/my-item/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.log(err);
      alert("Delete failed");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div style={{ padding: "20px" }}>
      <h2>✏️ Manage Inventory</h2>

      {items.length === 0 ? (
        <p>No inventory found</p>
      ) : (
        items.map((item, index) => (
          <div
            key={item._id || index}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              marginBottom: "15px",
              borderRadius: "10px",
              background: "#f9f9f9",
            }}
          >
            {/* ITEM TYPE */}
            <select
              value={item.itemType?._id || item.itemType || ""}
              onChange={(e) =>
                handleItemTypeChange(index, e.target.value)
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
                value={item.conditions?.good ?? 0}
                onChange={(e) =>
                  handleConditionChange(index, "good", e.target.value)
                }
              />

              <label style={{ marginLeft: 10 }}>Fair: </label>
              <input
                type="number"
                value={item.conditions?.fair ?? 0}
                onChange={(e) =>
                  handleConditionChange(index, "fair", e.target.value)
                }
              />

              <label style={{ marginLeft: 10 }}>Poor: </label>
              <input
                type="number"
                value={item.conditions?.poor ?? 0}
                onChange={(e) =>
                  handleConditionChange(index, "poor", e.target.value)
                }
              />
            </div>

            <br />

            {/* TOTAL */}
            <strong>
              Total:{" "}
              {(item.conditions?.good || 0) +
                (item.conditions?.fair || 0) +
                (item.conditions?.poor || 0)}
            </strong>

            <br /><br />

            {/* ACTIONS */}
            <button onClick={() => handleUpdate(item)}>
              💾 Save
            </button>

            {item._id && (
              <button
                onClick={() => handleDelete(item._id)}
                style={{
                  marginLeft: 10,
                  background: "red",
                  color: "white",
                }}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        ))
      )}

      <br />
      <button onClick={addNewItem}>➕ Add Item</button>
    </div>
  );
}