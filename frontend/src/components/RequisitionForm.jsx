import { useState, useEffect } from "react";
import API from "../services/api";

export default function RequisitionForm() {
  const [itemTypes, setItemTypes] = useState([]);

  const [form, setForm] = useState({
    itemType: "",
    requiredDate: "",
    quantity: "",
    priority: "important",
  });

  // =========================
  // 🔥 FETCH ITEM TYPES (BY DEPARTMENT)
  // =========================
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const res = await API.get("/items/types");
        console.log("🔥 ITEM TYPES:", res.data);
        setItemTypes(res.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchItemTypes();
  }, []);

  // =========================
  // 🔄 HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // =========================
  // 🚀 SUBMIT REQUEST
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/requests", form);

      alert("Request submitted successfully");

      // reset form
      setForm({
        itemType: "",
        requiredDate: "",
        quantity: "",
        priority: "important",
      });
    } catch (error) {
      alert(error.response?.data?.message || "Error submitting request");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div>
      <h2>📦 Place Requisition</h2>

      <form onSubmit={handleSubmit}>

        {/* 🔥 ITEM DROPDOWN (NEW) */}
        <select
  name="itemType"
  value={form.itemType}
  onChange={handleChange}
>
  <option value="">Select Item</option>

  {itemTypes.map((item) => (
    <option key={item._id} value={item._id}>
      {item.name}
    </option>
  ))}
</select>

        <br /><br />

        <input
          type="date"
          name="requiredDate"
          value={form.requiredDate}
          onChange={handleChange}
        />

        <br /><br />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <br /><br />

        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="very_important">Very Important</option>
          <option value="important">Important</option>
          <option value="not_important">Not Important</option>
        </select>

        <br /><br />

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}